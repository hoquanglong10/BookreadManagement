using CustomerManagement.API.Models;
using Microsoft.EntityFrameworkCore;

namespace CustomerManagement.API.Data;

public class ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : DbContext(options)
{
    public DbSet<Customer> Customers => Set<Customer>();
    public DbSet<User> Users => Set<User>();
    public DbSet<Story> Stories => Set<Story>();
    public DbSet<Chapter> Chapters => Set<Chapter>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>().HasIndex(user => user.Username).IsUnique();
        modelBuilder.Entity<User>().Property(user => user.Email).HasMaxLength(256);
        modelBuilder.Entity<User>().HasIndex(user => user.Email).IsUnique().HasFilter("[Email] IS NOT NULL");

        modelBuilder.Entity<Story>(story =>
        {
            story.Property(x => x.Title).HasMaxLength(200).IsRequired();
            story.Property(x => x.Author).HasMaxLength(120).IsRequired();
            story.Property(x => x.Genre).HasMaxLength(80).IsRequired();
            story.Property(x => x.Description).HasMaxLength(3000).IsRequired();
            story.Property(x => x.Status).HasMaxLength(30).IsRequired();
            story.Property(x => x.CoverTheme).HasMaxLength(30).IsRequired();
            story.HasIndex(x => x.Title);
        });
        modelBuilder.Entity<Chapter>(chapter =>
        {
            chapter.Property(x => x.Title).HasMaxLength(200).IsRequired();
            chapter.HasIndex(x => new { x.StoryId, x.Number }).IsUnique();
            chapter.HasOne(x => x.Story).WithMany(x => x.Chapters).HasForeignKey(x => x.StoryId).OnDelete(DeleteBehavior.Cascade);
        });
    }
}
