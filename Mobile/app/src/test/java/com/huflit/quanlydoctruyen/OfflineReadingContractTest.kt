package com.huflit.quanlydoctruyen

import com.google.gson.Gson
import com.google.gson.JsonParser
import com.huflit.quanlydoctruyen.data.ChapterContent
import com.huflit.quanlydoctruyen.data.OfflineChapterEntity
import com.huflit.quanlydoctruyen.data.OfflineProgressSyncEvent
import com.huflit.quanlydoctruyen.data.OfflineProgressSyncRequest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class OfflineReadingContractTest {
    @Test
    fun cachedEpisodeRetainsItsChapterAndNavigationMetadata() {
        val chapter = ChapterContent(
            id = 81,
            storyId = 12,
            storyTitle = "Tiệm sách cuối hẻm",
            number = 19,
            storyChapterId = 7,
            storyChapterNumber = 3,
            storyChapterTitle = "Mùa mưa",
            episodeNumber = 4,
            title = "Bức thư chưa gửi",
            content = "Nội dung tập truyện đã lưu.",
            prevNumber = 18,
            nextNumber = 20
        )

        val cached = OfflineChapterEntity(
            storyId = chapter.storyId,
            number = chapter.number,
            accountId = 9,
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
        )

        assertEquals(chapter, cached.toChapterContent())
        assertEquals(9, cached.accountId)
    }

    @Test
    fun syncRequestUsesTheBackendJsonContractAndStableEventId() {
        val event = OfflineProgressSyncEvent(
            clientEventId = "9d7450ac-d9bd-46ad-9f9c-fd20e99c7a31",
            storyId = 12,
            chapterNumber = 19,
            viewedAt = "2026-11-09T10:15:30Z"
        )
        val json = JsonParser.parseString(Gson().toJson(OfflineProgressSyncRequest(listOf(event)))).asJsonObject
        val body = json.getAsJsonArray("events").single().asJsonObject

        assertEquals(event.clientEventId, body.get("clientEventId").asString)
        assertEquals(event.storyId, body.get("storyId").asInt)
        assertEquals(event.chapterNumber, body.get("chapterNumber").asInt)
        assertEquals(event.viewedAt, body.get("viewedAt").asString)
        assertNull(body.get("episodeNumber"))
    }
}
