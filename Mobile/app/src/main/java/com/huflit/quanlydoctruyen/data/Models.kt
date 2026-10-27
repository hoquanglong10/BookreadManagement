package com.huflit.quanlydoctruyen.data

// Khớp với DTO bên backend (QuanLyDocTruyen.API/DTOs)

data class HealthResponse(val status: String, val time: String)

data class UserDto(
    val id: Int,
    val username: String,
    val email: String? = null,
    val displayName: String = "",
    val avatarUrl: String? = null,
    val role: String = "User"
)

data class AuthResponse(val token: String, val expiresAt: String, val user: UserDto)

data class RegisterResponse(
    val id: Int,
    val username: String,
    val email: String,
    val createdAt: String
)

data class LoginRequest(val username: String, val password: String)

data class RegisterRequest(
    val username: String,
    val email: String,
    val password: String
)

data class UpdateProfileRequest(val displayName: String, val avatarUrl: String?)
data class ChangePasswordRequest(val currentPassword: String, val newPassword: String)

data class GenreRef(val id: Int, val name: String)

data class Genre(val id: Int, val name: String, val storyCount: Int)

data class PagedResult<T>(
    val items: List<T>,
    val page: Int,
    val pageSize: Int,
    val totalCount: Int,
    val totalPages: Int
)

data class StoryListItem(
    val id: Int,
    val title: String,
    val author: String,
    val coverUrl: String?,
    val status: String,
    val accessType: String,
    val genres: List<GenreRef>,
    val chapterCount: Int,
    val episodeCount: Int = 0,
    val storyChapterCount: Int = 0,
    val viewCount: Long,
    val createdAt: String,
    val updatedAt: String
)

data class ChapterListItem(
    val id: Int,
    val number: Int,
    val storyChapterId: Int = 0,
    val storyChapterNumber: Int = 0,
    val storyChapterTitle: String = "",
    val episodeNumber: Int = 1,
    val title: String,
    val isFree: Boolean,
    val isPublished: Boolean = true,
    val publishAt: String = "",
    val hasContent: Boolean = true,
    val canRead: Boolean = true,
    val accessLabel: String = "",
    val isRead: Boolean = false
)

data class StoryDetail(
    val id: Int,
    val title: String,
    val author: String,
    val genre: String = "",
    val description: String?,
    val coverUrl: String?,
    val status: String,
    val accessType: String,
    val price: Double = 0.0,
    val freeChapterCount: Int = 0,
    val hasPurchase: Boolean = false,
    val hasPlanAccess: Boolean = false,
    val lastReadNumber: Int? = null,
    val storyChapterCount: Int = 0,
    val viewCount: Long,
    val genres: List<GenreRef>,
    val chapters: List<ChapterListItem>
)

data class ReadingProgressResponse(val items: List<ReadingProgressItem> = emptyList())

data class ReadingProgressItem(
    val storyId: Int,
    val storyTitle: String,
    val author: String,
    val genre: String = "",
    val coverTheme: String = "",
    val coverUrl: String? = null,
    val chapterNumber: Int,
    val chapterTitle: String,
    val storyChapterNumber: Int,
    val storyChapterTitle: String,
    val episodeNumber: Int,
    val readAt: String
)

data class ChapterContent(
    val id: Int,
    val storyId: Int,
    val storyTitle: String,
    val number: Int,
    val storyChapterNumber: Int = 0,
    val storyChapterTitle: String = "",
    val episodeNumber: Int = 1,
    val title: String,
    val content: String,
    val prevNumber: Int?,
    val nextNumber: Int?
)

data class PaymentRequest(val requestId: String, val simulateFailure: Boolean = false)
data class SubscriptionPlanDto(
    val id: Int, val name: String, val price: Double, val durationDays: Int,
    val accessScope: String, val genreNames: List<String> = emptyList(), val storyTitles: List<String> = emptyList()
)
data class PaymentResultDto(
    val id: Int, val reference: String, val type: String, val amount: Double,
    val status: String, val createdAt: String, val entitlementGranted: Boolean,
    val failureReason: String? = null, val reconciledAt: String? = null
)
data class PaymentHistoryDto(
    val id: Int, val reference: String, val type: String, val amount: Double,
    val status: String, val createdAt: String, val processedAt: String?, val failureReason: String?,
    val entitlementGranted: Boolean, val reconciledAt: String?, val planName: String?, val storyTitle: String?
)

fun statusLabel(status: String) = when (status) {
    "Completed", "Hoàn thành" -> "Hoàn thành"
    "Ongoing", "Đang cập nhật" -> "Đang cập nhật"
    else -> status
}
