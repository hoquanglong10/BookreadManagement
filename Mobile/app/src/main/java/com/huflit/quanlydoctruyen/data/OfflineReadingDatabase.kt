package com.huflit.quanlydoctruyen.data

import android.content.Context
import androidx.room.Dao
import androidx.room.Database
import androidx.room.Entity
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.PrimaryKey
import androidx.room.Query
import androidx.room.Room
import androidx.room.RoomDatabase
import java.time.Instant
import java.util.UUID

@Entity(tableName = "offline_chapters", primaryKeys = ["storyId", "number", "accountId"])
data class OfflineChapterEntity(
    val storyId: Int,
    val number: Int,
    val accountId: Int,
    val id: Int,
    val storyTitle: String,
    val storyChapterId: Int,
    val storyChapterNumber: Int,
    val storyChapterTitle: String,
    val episodeNumber: Int,
    val title: String,
    val content: String,
    val prevNumber: Int?,
    val nextNumber: Int?,
    val cachedAt: Long = System.currentTimeMillis()
) {
    fun toChapterContent() = ChapterContent(
        id = id,
        storyId = storyId,
        storyTitle = storyTitle,
        number = number,
        storyChapterId = storyChapterId,
        storyChapterNumber = storyChapterNumber,
        storyChapterTitle = storyChapterTitle,
        episodeNumber = episodeNumber,
        title = title,
        content = content,
        prevNumber = prevNumber,
        nextNumber = nextNumber
    )
}

@Entity(tableName = "pending_read_events")
data class PendingReadEventEntity(
    @PrimaryKey val clientEventId: String,
    val userId: Int,
    val storyId: Int,
    val chapterNumber: Int,
    val viewedAt: String
)

@Dao
interface OfflineReadingDao {
    @Query("SELECT * FROM offline_chapters WHERE storyId = :storyId AND number = :number AND accountId = :accountId LIMIT 1")
    suspend fun getChapter(storyId: Int, number: Int, accountId: Int): OfflineChapterEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun saveChapter(chapter: OfflineChapterEntity)

    @Query("DELETE FROM offline_chapters WHERE rowid IN (SELECT rowid FROM offline_chapters ORDER BY cachedAt DESC LIMIT -1 OFFSET 100)")
    suspend fun pruneChapterCache()

    @Insert(onConflict = OnConflictStrategy.IGNORE)
    suspend fun enqueueReadEvent(event: PendingReadEventEntity)

    @Query("SELECT * FROM pending_read_events WHERE userId = :userId ORDER BY viewedAt LIMIT 100")
    suspend fun pendingReadEvents(userId: Int): List<PendingReadEventEntity>

    @Query("DELETE FROM pending_read_events WHERE clientEventId IN (:eventIds)")
    suspend fun deleteReadEvents(eventIds: List<String>)
}

@Database(entities = [OfflineChapterEntity::class, PendingReadEventEntity::class], version = 1, exportSchema = false)
abstract class OfflineReadingDatabase : RoomDatabase() {
    abstract fun offlineReadingDao(): OfflineReadingDao

    companion object {
        @Volatile private var instance: OfflineReadingDatabase? = null

        fun get(context: Context): OfflineReadingDatabase = instance ?: synchronized(this) {
            instance ?: Room.databaseBuilder(
                context.applicationContext,
                OfflineReadingDatabase::class.java,
                "bookread-offline.db"
            ).build().also { instance = it }
        }
    }
}

class OfflineReadingRepository(private val dao: OfflineReadingDao) {
    suspend fun cache(chapter: ChapterContent, accountId: Int) {
        dao.saveChapter(OfflineChapterEntity(
            storyId = chapter.storyId,
            number = chapter.number,
            accountId = accountId,
            id = chapter.id,
            storyTitle = chapter.storyTitle,
            storyChapterId = chapter.storyChapterId,
            storyChapterNumber = chapter.storyChapterNumber,
            storyChapterTitle = chapter.storyChapterTitle,
            episodeNumber = chapter.episodeNumber,
            title = chapter.title,
            content = chapter.content,
            prevNumber = chapter.prevNumber,
            nextNumber = chapter.nextNumber
        ))
        dao.pruneChapterCache()
    }

    suspend fun getChapter(storyId: Int, number: Int, accountId: Int) = dao.getChapter(storyId, number, accountId)

    suspend fun recordOfflineRead(userId: Int, chapter: ChapterContent) {
        dao.enqueueReadEvent(PendingReadEventEntity(
            clientEventId = UUID.randomUUID().toString(),
            userId = userId,
            storyId = chapter.storyId,
            chapterNumber = chapter.number,
            viewedAt = Instant.now().toString()
        ))
    }

    suspend fun syncPending(api: ApiService, userId: Int) {
        while (true) {
            val pending = dao.pendingReadEvents(userId)
            if (pending.isEmpty()) return
            val result = api.syncReadingProgress(OfflineProgressSyncRequest(pending.map {
                OfflineProgressSyncEvent(it.clientEventId, it.storyId, it.chapterNumber, it.viewedAt)
            }))
            val acknowledged = result.syncedEventIds + result.rejected.map { it.clientEventId }
            if (acknowledged.isEmpty()) return
            dao.deleteReadEvents(acknowledged)
        }
    }
}
