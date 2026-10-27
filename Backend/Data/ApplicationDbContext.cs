using CustomerManagement.API.Models;
using Microsoft.EntityFrameworkCore;

namespace CustomerManagement.API.Data;

public class ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : DbContext(options)
{
    public DbSet<Customer> Customers => Set<Customer>();
    public DbSet<User> Users => Set<User>();
    public DbSet<Story> Stories => Set<Story>();
    public DbSet<Chapter> Chapters => Set<Chapter>();
    public DbSet<StoryChapter> StoryChapters => Set<StoryChapter>();
    public DbSet<Genre> Genres => Set<Genre>();
    public DbSet<StoryGenre> StoryGenres => Set<StoryGenre>();
    public DbSet<SubscriptionPlan> SubscriptionPlans => Set<SubscriptionPlan>();
    public DbSet<SubscriptionPlanGenre> SubscriptionPlanGenres => Set<SubscriptionPlanGenre>();
    public DbSet<SubscriptionPlanStory> SubscriptionPlanStories => Set<SubscriptionPlanStory>();
    public DbSet<UserSubscription> UserSubscriptions => Set<UserSubscription>();
    public DbSet<StoryPurchase> StoryPurchases => Set<StoryPurchase>();
    public DbSet<ReadEvent> ReadEvents => Set<ReadEvent>();
    public DbSet<PaymentTransaction> PaymentTransactions => Set<PaymentTransaction>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>().HasIndex(user => user.Username).IsUnique();
        modelBuilder.Entity<User>().Property(user => user.Email).HasMaxLength(256);
        modelBuilder.Entity<User>().HasIndex(user => user.Email).IsUnique().HasFilter("[Email] IS NOT NULL");
        modelBuilder.Entity<User>().Property(user => user.DisplayName).HasMaxLength(80).HasDefaultValue("");
        modelBuilder.Entity<User>().Property(user => user.AvatarUrl).HasMaxLength(500);

        modelBuilder.Entity<Story>(story =>
        {
            story.Property(x => x.Title).HasMaxLength(200).IsRequired();
            story.Property(x => x.Author).HasMaxLength(120).IsRequired();
            story.Property(x => x.Genre).HasMaxLength(80).IsRequired();
            story.Property(x => x.Description).HasMaxLength(3000).IsRequired();
            story.Property(x => x.Status).HasMaxLength(30).IsRequired();
            story.Property(x => x.CoverTheme).HasMaxLength(30).IsRequired();
            story.Property(x => x.CoverUrl).HasMaxLength(500);
            story.Property(x => x.AccessType).HasMaxLength(20).HasDefaultValue("Free").IsRequired();
            story.Property(x => x.Price).HasPrecision(18, 2).HasDefaultValue(0m);
            story.Property(x => x.FreeChapterCount).HasDefaultValue(0);
            story.HasIndex(x => x.Title);
            story.Property(x => x.UpdatedAt).HasDefaultValueSql("GETUTCDATE()");
        });
        modelBuilder.Entity<Chapter>(chapter =>
        {
            chapter.Property(x => x.Title).HasMaxLength(200).IsRequired();
            chapter.Property(x => x.Content).IsRequired();
            chapter.Property(x => x.IsFree).HasDefaultValue(false);
            chapter.Property(x => x.PublishAt).HasDefaultValueSql("GETUTCDATE()");
            chapter.HasIndex(x => new { x.StoryId, x.Number }).IsUnique();
            chapter.HasIndex(x => new { x.StoryChapterId, x.EpisodeNumber }).IsUnique();
            chapter.HasOne(x => x.Story).WithMany(x => x.Chapters).HasForeignKey(x => x.StoryId).OnDelete(DeleteBehavior.Cascade);
            chapter.HasOne(x => x.StoryChapter).WithMany(x => x.Episodes).HasForeignKey(x => x.StoryChapterId).OnDelete(DeleteBehavior.Restrict);
        });
        modelBuilder.Entity<StoryChapter>(chapter =>
        {
            chapter.Property(x => x.Title).HasMaxLength(200).IsRequired();
            chapter.HasIndex(x => new { x.StoryId, x.Number }).IsUnique();
            chapter.HasOne(x => x.Story).WithMany(x => x.StoryChapters).HasForeignKey(x => x.StoryId).OnDelete(DeleteBehavior.Cascade);
        });
        modelBuilder.Entity<Genre>(genre =>
        {
            genre.Property(x => x.Name).HasMaxLength(80).IsRequired();
            genre.HasIndex(x => x.Name).IsUnique();
        });
        modelBuilder.Entity<StoryGenre>(relation =>
        {
            relation.HasKey(item => new { item.StoryId, item.GenreId });
            relation.HasOne(item => item.Story).WithMany(story => story.StoryGenres).HasForeignKey(item => item.StoryId).OnDelete(DeleteBehavior.Cascade);
            relation.HasOne(item => item.Genre).WithMany(genre => genre.StoryGenres).HasForeignKey(item => item.GenreId).OnDelete(DeleteBehavior.Restrict);
            relation.HasIndex(item => item.GenreId);
        });
        modelBuilder.Entity<SubscriptionPlan>(plan =>
        {
            plan.Property(item => item.Name).HasMaxLength(100).IsRequired();
            plan.Property(item => item.Price).HasPrecision(18, 2);
            plan.Property(item => item.AccessScope).HasMaxLength(30).IsRequired();
        });
        modelBuilder.Entity<SubscriptionPlanGenre>(relation =>
        {
            relation.HasKey(item => new { item.PlanId, item.GenreId });
            relation.HasOne(item => item.Plan).WithMany(plan => plan.PlanGenres).HasForeignKey(item => item.PlanId).OnDelete(DeleteBehavior.Cascade);
            relation.HasOne(item => item.Genre).WithMany(genre => genre.SubscriptionPlanGenres).HasForeignKey(item => item.GenreId).OnDelete(DeleteBehavior.Restrict);
        });
        modelBuilder.Entity<SubscriptionPlanStory>(relation =>
        {
            relation.HasKey(item => new { item.PlanId, item.StoryId });
            relation.HasOne(item => item.Plan).WithMany(plan => plan.PlanStories).HasForeignKey(item => item.PlanId).OnDelete(DeleteBehavior.Cascade);
            relation.HasOne(item => item.Story).WithMany().HasForeignKey(item => item.StoryId).OnDelete(DeleteBehavior.Restrict);
        });
        modelBuilder.Entity<UserSubscription>(subscription =>
        {
            subscription.Property(item => item.Status).HasMaxLength(20).IsRequired();
            subscription.HasOne(item => item.User).WithMany().HasForeignKey(item => item.UserId).OnDelete(DeleteBehavior.Cascade);
            subscription.HasOne(item => item.Plan).WithMany().HasForeignKey(item => item.PlanId).OnDelete(DeleteBehavior.Restrict);
            subscription.HasIndex(item => new { item.UserId, item.Status, item.EndsAt });
        });
        modelBuilder.Entity<StoryPurchase>(purchase =>
        {
            purchase.Property(item => item.PriceAtPurchase).HasPrecision(18, 2);
            purchase.HasOne(item => item.User).WithMany().HasForeignKey(item => item.UserId).OnDelete(DeleteBehavior.Cascade);
            purchase.HasOne(item => item.Story).WithMany().HasForeignKey(item => item.StoryId).OnDelete(DeleteBehavior.Restrict);
            purchase.HasIndex(item => new { item.UserId, item.StoryId }).IsUnique();
        });
        modelBuilder.Entity<ReadEvent>(readEvent =>
        {
            readEvent.HasKey(item => item.Id);
            readEvent.Property(item => item.Id).ValueGeneratedOnAdd();
            readEvent.HasOne<Story>().WithMany().HasForeignKey(item => item.StoryId).OnDelete(DeleteBehavior.Restrict);
            readEvent.HasOne<Chapter>().WithMany().HasForeignKey(item => item.ChapterId).OnDelete(DeleteBehavior.Restrict);
            readEvent.HasIndex(item => new { item.StoryId, item.ChapterId, item.ViewedAt });
            readEvent.HasIndex(item => new { item.UserId, item.ViewedAt });
        });
        modelBuilder.Entity<PaymentTransaction>(transaction =>
        {
            transaction.Property(item => item.Reference).HasMaxLength(40).IsRequired();
            transaction.Property(item => item.Type).HasMaxLength(20).IsRequired();
            transaction.Property(item => item.Amount).HasPrecision(18, 2);
            transaction.Property(item => item.Status).HasMaxLength(20).IsRequired();
            transaction.Property(item => item.FailureReason).HasMaxLength(500);
            transaction.Property(item => item.ReconciliationNote).HasMaxLength(500);
            transaction.HasIndex(item => item.Reference).IsUnique();
            transaction.HasIndex(item => new { item.UserId, item.IdempotencyKey }).IsUnique();
            transaction.HasIndex(item => new { item.Status, item.CreatedAt });
            transaction.HasOne(item => item.User).WithMany().HasForeignKey(item => item.UserId).OnDelete(DeleteBehavior.Restrict);
            transaction.HasOne(item => item.Plan).WithMany().HasForeignKey(item => item.PlanId).OnDelete(DeleteBehavior.Restrict);
            transaction.HasOne(item => item.Story).WithMany().HasForeignKey(item => item.StoryId).OnDelete(DeleteBehavior.Restrict);
            transaction.HasOne(item => item.ReconciledByUser).WithMany().HasForeignKey(item => item.ReconciledByUserId).OnDelete(DeleteBehavior.Restrict);
        });
    }
}
