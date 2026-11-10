namespace CustomerManagement.API.DTOs;

public sealed record ReadingProgressSyncRequest(IReadOnlyList<OfflineReadEventRequest>? Events);

public sealed record OfflineReadEventRequest(Guid ClientEventId, int StoryId, int ChapterNumber, DateTime ViewedAt);
