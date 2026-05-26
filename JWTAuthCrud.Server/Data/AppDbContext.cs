using Microsoft.EntityFrameworkCore;
using ImelApp.Server.Models;

namespace ImelApp.Server.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<User> Users { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Konfiguracija za entitet User
            modelBuilder.Entity<User>(entity =>
            {
                entity.Property(u => u.Username)
                    .IsRequired()
                    .HasMaxLength(50);

                entity.Property(u => u.Email)
                    .IsRequired()
                    .HasMaxLength(50);

                entity.Property(u => u.PasswordHash)
                    .IsRequired();

                entity.Property(u => u.IsActive)
                    .HasDefaultValue(true);

                entity.Property(u => u.Role)
                    .HasConversion<int>()
                    .HasDefaultValue(UserRole.User);

                // Ovdje smo promijenili GETUTCDATE() u Postgresovu funkciju za svaki slučaj
                entity.Property(u => u.CreatedAt)
                    .HasDefaultValueSql("CURRENT_TIMESTAMP");

                entity.Property(u => u.FailedLoginAttempts)
                    .HasDefaultValue(0);

                // Dodavanje mock admin korisnika
                entity.HasData(new User
                {
                    Id = 1,
                    Username = "admin",
                    Email = "admin@example.com",
                    PasswordHash = "$2a$11$hE/qRHSPywOYztBMrEUzKODkZA6KFSlcBB9CfMYuPSLcL5/2Mt4Ra",
                    IsActive = true,
                    Role = UserRole.Admin,
                    CreatedAt = new DateTime(2024, 1, 1, 12, 0, 0, DateTimeKind.Utc)
                });
            });
        }

    }
}
