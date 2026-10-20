using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using CustomerManagement.API.Data;
using CustomerManagement.API.DTOs;
using CustomerManagement.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace CustomerManagement.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController(ApplicationDbContext context, IConfiguration configuration) : ControllerBase
{
    [AllowAnonymous]
    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterRequest request)
    {
        var username = request.Username.Trim();
        var email = request.Email.Trim().ToLowerInvariant();

        if (await context.Users.AnyAsync(x => x.Username == username))
            return Conflict(new { message = "Tên đăng nhập đã được sử dụng." });
        if (await context.Users.AnyAsync(x => x.Email == email))
            return Conflict(new { message = "Email đã được sử dụng." });

        var user = new User
        {
            Username = username,
            Email = email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Role = "User"
        };
        context.Users.Add(user);
        try
        {
            await context.SaveChangesAsync();
        }
        catch (DbUpdateException)
        {
            // The unique indexes also guard against concurrent registrations.
            if (await context.Users.AsNoTracking().AnyAsync(x => x.Email == email))
                return Conflict(new { message = "Email đã được sử dụng." });
            if (await context.Users.AsNoTracking().AnyAsync(x => x.Username == username))
                return Conflict(new { message = "Tên đăng nhập đã được sử dụng." });
            throw;
        }

        return StatusCode(StatusCodes.Status201Created, new
        {
            user.Id,
            user.Username,
            user.Email,
            user.CreatedAt
        });
    }

    [AllowAnonymous]
    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginRequest request)
    {
        var identifier = request.Username.Trim();
        var email = identifier.ToLowerInvariant();
        var user = await context.Users.SingleOrDefaultAsync(x => x.Username == identifier || x.Email == email);
        if (user is null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            return Unauthorized(new { message = "Sai tài khoản hoặc mật khẩu." });
        if (user.IsLocked)
            return StatusCode(StatusCodes.Status403Forbidden, new { message = "Tài khoản đã bị khóa." });

        var expiresInMinutes = configuration.GetValue<int>("Jwt:ExpiresInMinutes");
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Name, user.Username),
            new Claim(ClaimTypes.Role, user.Role)
        };
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(configuration["Jwt:Key"]!));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var token = new JwtSecurityToken(
            issuer: configuration["Jwt:Issuer"],
            audience: configuration["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(expiresInMinutes),
            signingCredentials: credentials);

        return Ok(new
        {
            token = new JwtSecurityTokenHandler().WriteToken(token),
            expiresIn = expiresInMinutes * 60,
            user = new { user.Id, user.Username, user.Email, user.Role }
        });
    }
}
