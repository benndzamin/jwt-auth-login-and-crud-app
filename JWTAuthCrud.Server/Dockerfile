# Koristi zvanični .NET 9 SDK za build fazu
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Kopiraj .csproj i povuci zavisnosti (restore)
COPY ["JWTAuthCrud.Server.csproj", "./"]
RUN dotnet restore "./JWTAuthCrud.Server.csproj"

# Kopiraj ostatak koda
COPY . .

# Pošto na Renderu pravimo ČISTI API (bez SPA proxy-ja koji pokreće frontend),
# ova zastavica osigurava da se .NET ne buni za klijentske foldere tokom objave
RUN dotnet publish "JWTAuthCrud.Server.csproj" -c Release -o /app/publish /p:UseAppHost=false /p:BuildSpa=false

# Finalna faza - koristi manji runtime imidž za .NET 9
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

# Render dinamički dodjeljuje port, ali 10000 je standard za Docker na Renderu
ENV ASPNETCORE_URLS=http://+:10000
EXPOSE 10000

ENTRYPOINT ["dotnet", "JWTAuthCrud.Server.dll"]