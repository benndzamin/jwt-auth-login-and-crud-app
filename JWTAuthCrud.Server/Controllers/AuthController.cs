using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using ImelApp.Server.Models;
using ImelApp.Server.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity.Data;
using Microsoft.AspNetCore.Authorization;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly string _key;

    public AuthController(AppDbContext context, IConfiguration configuration)
    {
        _context = context;
        _key = configuration.GetValue<string>("JwtSettings:SecretKey")
               ?? throw new ArgumentNullException("JwtSettings:SecretKey", "The secret key must be provided.");
    }


    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Username == request.Username);

        if (user == null)
        {
            return Unauthorized(new { message = "Incorrect username or password." });
        }

        // Check if user is locked out
        if (user.LockoutEnd.HasValue && user.LockoutEnd > DateTime.UtcNow)
        {
            var timeLeft = user.LockoutEnd.Value - DateTime.UtcNow;
            return Unauthorized(new { message = $"User is temporarily locked out. Try again in {timeLeft.Minutes} minutes." });
        }

        // Verify password
        if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
        {
            // Increment failed login attempts
            user.FailedLoginAttempts++;

            // If failed attempts reach 3, lock the user
            if (user.FailedLoginAttempts >= 3)
            {
                user.LockoutEnd = DateTime.UtcNow.AddMinutes(5); // Lock user for 5 minutes
            }

            await _context.SaveChangesAsync();

            return Unauthorized(new { message = "Incorrect username or password." });
        }

        // Failure count after successfull login
        user.FailedLoginAttempts = 0;
        await _context.SaveChangesAsync();

        var tokenHandler = new JwtSecurityTokenHandler();
        var tokenKey = Encoding.UTF8.GetBytes(_key);
        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(new Claim[]
            {
            new Claim(ClaimTypes.Name, user.Username),
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Role, user.Role.ToString() ?? "User")
            }),
            Expires = DateTime.UtcNow.AddHours(1),
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(tokenKey), SecurityAlgorithms.HmacSha256Signature)
        };
        var token = tokenHandler.CreateToken(tokenDescriptor);
        var jwt = tokenHandler.WriteToken(token);
        return Ok(new { token = jwt });
    }


    [Authorize(Roles = "Admin")]
    [HttpGet("users")]
    public async Task<IActionResult> GetAllUsers()
    {
        var users = await _context.Users.ToListAsync();
        var userDtos = users.Select(u => new
        {
            u.Id,
            u.Username,
            u.Email,
            u.IsActive,
            Role = u.Role.ToString(),
            u.CreatedAt
        }).ToList();

        return Ok(userDtos);
    }


    [Authorize]
    [HttpPost("logout")]
    public IActionResult Logout()
    {
        // Token is in sessionStorage, here we just send confirmation
        return Ok(new { message = "User successfully logged out." });
    }

    // Delete user by ID (admin only)
    [Authorize(Roles = "Admin")]
    [HttpDelete("delete/{id}")]
    public async Task<IActionResult> DeleteUser(int id)
    {
        var user = await _context.Users.FindAsync(id);

        if (user == null)
        {
            return NotFound(new { message = "User not found." });
        }

        _context.Users.Remove(user);
        await _context.SaveChangesAsync();

        return Ok(new { message = "User deleted successfully." });
    }

    // Register new user
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        // Check if user already exists by username or email
        var existingUser = await _context.Users.FirstOrDefaultAsync(u => u.Username == request.Username || u.Email == request.Email);
        if (existingUser != null)
        {
            return BadRequest(new { message = "User with this username or email already exists." });
        }

        // Check if role is valid
        if (!Enum.IsDefined(typeof(UserRole), request.Role))
        {
            return BadRequest(new { message = "Invalid role." });
        }

        // If role is not provided, set it to UserRole.User (0)
        var userRole = (UserRole)request.Role; // Convert int to UserRole

        // Hash password
        var hashedPassword = BCrypt.Net.BCrypt.HashPassword(request.Password);

        // Create new user
        var newUser = new User
        {
            Username = request.Username,
            Email = request.Email,
            PasswordHash = hashedPassword,
            IsActive = request.IsActive,
            Role = userRole // Set user role default to user - only admin can grant admin role!
        };

        _context.Users.Add(newUser);
        await _context.SaveChangesAsync();

        return Ok(new { message = "User successfully registered." });
    }


    // Returns only the username of the logged-in user
    [Authorize]
    [HttpGet("user")]
    public IActionResult GetUserData()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (userIdClaim == null)
        {
            return Unauthorized(new { message = "User is not authenticated." });
        }

        var user = _context.Users.FirstOrDefault(u => u.Id.ToString() == userIdClaim);

        if (user == null)
        {
            return Unauthorized(new { message = "User not found." });
        }

        return Ok(new { username = user.Username, email = user.Email, role = user.Role.ToString(),  created = user.CreatedAt, active = user.IsActive.ToString() });
    }



    [Authorize]
    [HttpGet("username")]
    public IActionResult GetUserName()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (userIdClaim == null)
        {
            return Unauthorized(new { message = "User is not authenticated." });
        }

        var user = _context.Users.FirstOrDefault(u => u.Id.ToString() == userIdClaim);

        if (user == null)
        {
            return NotFound(new { message = "User not found." });
        }

        return Ok(new { username = user.Username });
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("edit/{id}")]
    public async Task<IActionResult> EditUser(int id, [FromBody] EditUserRequest request)
    {

        Console.WriteLine($"Register request received: Username={request.Username}, Email={request.Email}, Role={request.Role}");

        // Find user
        var user = await _context.Users.FindAsync(id);
        if (user == null)
        {
            return NotFound(new { message = "User not found." });
        }

        // Check if new username already exists (if being changed)
        if (!string.IsNullOrEmpty(request.Username) && request.Username != user.Username)
        {
            var existingUsername = await _context.Users.FirstOrDefaultAsync(u => u.Username == request.Username);
            if (existingUsername != null)
            {
                return BadRequest(new { message = "Username already taken." });
            }
        }

        // Check if new email already exists (if being changed)
        if (!string.IsNullOrEmpty(request.Email) && request.Email != user.Email)
        {
            var existingEmail = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
            if (existingEmail != null)
            {
                return BadRequest(new { message = "Email already in use." });
            }
        }

        // Update fields if provided
        if (!string.IsNullOrEmpty(request.Username))
            user.Username = request.Username;

        if (!string.IsNullOrEmpty(request.Email))
            user.Email = request.Email;

        if (!string.IsNullOrEmpty(request.Password))
            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);

        if (request.IsActive.HasValue)
            user.IsActive = request.IsActive.Value;

        if (request.Role.HasValue && Enum.IsDefined(typeof(UserRole), request.Role))
            user.Role = (UserRole)request.Role.Value;

        // Save changes
        await _context.SaveChangesAsync();

        return Ok(new { message = "User successfully updated." });
    }



}

// DTO - Model for login request
public class LoginRequest
{
    public required string Username { get; set; }
    public required string Password { get; set; }
}


// DTO - Model for user registration
public class RegisterRequest
{
    public required string Username { get; set; }
    public required string Email { get; set; }
    public required string Password { get; set; }
    public required bool IsActive { get; set; }
    public int Role { get; set; }

}

// DTO - Model for editing user
public class EditUserRequest
{
    public string? Username { get; set; }
    public string? Email { get; set; }
    public string? Password { get; set; }
    public bool? IsActive { get; set; }
    public int? Role { get; set; }
}