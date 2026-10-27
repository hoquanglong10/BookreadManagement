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
            DisplayName = username,
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
            expiresAt = token.ValidTo,
            user = new { user.Id, user.Username, user.Email, DisplayName = string.IsNullOrWhiteSpace(user.DisplayName) ? user.Username : user.DisplayName, user.AvatarUrl, user.Role }
        });
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> Me(CancellationToken cancellationToken)
    {
        var idValue = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(idValue, out var id)) return Unauthorized();
        var user = await context.Users.AsNoTracking()
            .Where(item => item.Id == id)
            .Select(item => new { item.Id, item.Username, item.Email, DisplayName = item.DisplayName == "" ? item.Username : item.DisplayName, item.AvatarUrl, item.Role })
            .SingleOrDefaultAsync(cancellationToken);
        return user is null ? NotFound(new { message = "Không tìm thấy tài khoản." }) : Ok(user);
    }

    [Authorize]
    [HttpPut("profile")]
    public async Task<IActionResult> UpdateProfile(UpdateProfileRequest request, CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        if (userId is null) return Unauthorized();
        var user = await context.Users.FindAsync([userId.Value], cancellationToken);
        if (user is null) return NotFound(new { message = "Không tìm thấy tài khoản." });

        user.DisplayName = request.DisplayName.Trim();
        user.AvatarUrl = string.IsNullOrWhiteSpace(request.AvatarUrl) ? null : request.AvatarUrl.Trim();
        await context.SaveChangesAsync(cancellationToken);
        return Ok(new { user.Id, user.Username, user.Email, user.DisplayName, user.AvatarUrl, user.Role });
    }

    [Authorize]
    [HttpPut("password")]
    public async Task<IActionResult> ChangePassword(ChangePasswordRequest request, CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        if (userId is null) return Unauthorized();
        var user = await context.Users.FindAsync([userId.Value], cancellationToken);
        if (user is null) return NotFound(new { message = "Không tìm thấy tài khoản." });
        if (!BCrypt.Net.BCrypt.Verify(request.CurrentPassword, user.PasswordHash))
            return BadRequest(new { message = "Mật khẩu hiện tại không chính xác." });
        if (request.CurrentPassword == request.NewPassword)
            return BadRequest(new { message = "Mật khẩu mới phải khác mật khẩu hiện tại." });

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        await context.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    private int? GetCurrentUserId() =>
        int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var id) ? id : null;
}
