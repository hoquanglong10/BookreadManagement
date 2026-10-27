package com.huflit.quanlydoctruyen.ui.screens

import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.Card
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.huflit.quanlydoctruyen.data.ApiClient
import com.huflit.quanlydoctruyen.data.Genre
import com.huflit.quanlydoctruyen.data.PagedResult
import com.huflit.quanlydoctruyen.data.ReadingProgressItem
import com.huflit.quanlydoctruyen.data.SessionManager
import com.huflit.quanlydoctruyen.data.StoryListItem
import com.huflit.quanlydoctruyen.data.toMessage
import com.huflit.quanlydoctruyen.ui.components.CoverPlaceholder
import com.huflit.quanlydoctruyen.ui.components.ErrorBox
import com.huflit.quanlydoctruyen.ui.components.StatusBadge
import kotlinx.coroutines.launch
import kotlinx.coroutines.async
import kotlinx.coroutines.coroutineScope
import kotlin.coroutines.cancellation.CancellationException

private val SORTS = listOf("updated" to "Mới cập nhật", "newest" to "Mới phát hành", "views" to "Đọc nhiều")

private data class HomeCatalogResults(
    val primary: PagedResult<StoryListItem>,
    val updated: PagedResult<StoryListItem>? = null,
    val newest: PagedResult<StoryListItem>? = null,
    val popular: PagedResult<StoryListItem>? = null
)

// PB11: tìm kiếm truyện, PB12: các danh sách gợi ý
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeScreen(onOpenStory: (Int) -> Unit, onLogin: () -> Unit, onProfile: () -> Unit) {
    var input by rememberSaveable { mutableStateOf("") }
    var keyword by rememberSaveable { mutableStateOf("") }
    var sort by rememberSaveable { mutableStateOf("updated") }
    var selectedGenreId by rememberSaveable { mutableStateOf<Int?>(null) }

    val stories = remember { mutableStateListOf<StoryListItem>() }
    val updatedStories = remember { mutableStateListOf<StoryListItem>() }
    val newestStories = remember { mutableStateListOf<StoryListItem>() }
    val popularStories = remember { mutableStateListOf<StoryListItem>() }
    val genres = remember { mutableStateListOf<Genre>() }
    val readingProgress = remember { mutableStateListOf<ReadingProgressItem>() }
    var page by remember { mutableIntStateOf(1) }
    var totalPages by remember { mutableIntStateOf(1) }
    var loading by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf<String?>(null) }
    var reloadKey by remember { mutableIntStateOf(0) }
    val scope = rememberCoroutineScope()
    val user = SessionManager.user

    LaunchedEffect(user?.id) {
        readingProgress.clear()
        if (user != null) {
            try { readingProgress.addAll(ApiClient.api.readingProgress().items) } catch (_: Exception) { }
        }
    }

    // Tải trang đầu mỗi khi đổi từ khóa / cách sắp xếp
    LaunchedEffect(Unit) {
        try { genres.addAll(ApiClient.api.genres()) } catch (_: Exception) { }
    }

    LaunchedEffect(keyword, selectedGenreId, sort, reloadKey) {
        loading = true
        error = null
        try {
            val results = coroutineScope {
                val current = async { ApiClient.api.searchStories(keyword = keyword.ifBlank { null }, genreId = selectedGenreId, sort = sort, page = 1) }
                if (keyword.isBlank() && selectedGenreId == null) {
                    val updateRequest = async { ApiClient.api.searchStories(sort = "updated", pageSize = 6) }
                    val newestRequest = async { ApiClient.api.searchStories(sort = "newest", pageSize = 6) }
                    val popularRequest = async { ApiClient.api.searchStories(sort = "views", pageSize = 6) }
                    HomeCatalogResults(current.await(), updateRequest.await(), newestRequest.await(), popularRequest.await())
                } else HomeCatalogResults(current.await())
            }
            stories.clear()
            stories.addAll(results.primary.items)
            updatedStories.clear(); results.updated?.let { updatedStories.addAll(it.items) }
            newestStories.clear(); results.newest?.let { newestStories.addAll(it.items) }
            popularStories.clear(); results.popular?.let { popularStories.addAll(it.items) }
            page = results.primary.page
            totalPages = results.primary.totalPages
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            error = e.toMessage()
        } finally {
            loading = false
        }
    }

    fun loadMore() {
        scope.launch {
            loading = true
            try {
                val res = ApiClient.api.searchStories(keyword = keyword.ifBlank { null }, genreId = selectedGenreId, sort = sort, page = page + 1)
                stories.addAll(res.items)
                page = res.page
                totalPages = res.totalPages
            } catch (e: CancellationException) {
                throw e
            } catch (e: Exception) {
                error = e.toMessage()
            } finally {
                loading = false
            }
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Đọc Truyện", fontWeight = FontWeight.Bold) },
                actions = {
                    if (user != null) {
                        TextButton(onClick = onProfile) { Text(user.displayName.ifBlank { user.username }) }
                        TextButton(onClick = onProfile) { Text("Hồ sơ") }
                        TextButton(onClick = { SessionManager.logout() }) { Text("Đăng xuất") }
                    } else {
                        TextButton(onClick = onLogin) { Text("Đăng nhập") }
                    }
                }
            )
        }
    ) { padding ->
        Column(Modifier.padding(padding).fillMaxSize()) {
            OutlinedTextField(
                value = input,
                onValueChange = { input = it },
                placeholder = { Text("Tìm theo tên truyện hoặc tác giả") },
                singleLine = true,
                keyboardOptions = KeyboardOptions(imeAction = ImeAction.Search),
                keyboardActions = KeyboardActions(onSearch = { keyword = input.trim() }),
                trailingIcon = { TextButton(onClick = { keyword = input.trim() }) { Text("Tìm") } },
                modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 8.dp)
            )

            Row(
                Modifier.horizontalScroll(rememberScrollState()).padding(horizontal = 16.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                SORTS.forEach { (value, label) ->
                    FilterChip(selected = sort == value, onClick = { sort = value }, label = { Text(label) })
                }
            }

            Row(
                Modifier.horizontalScroll(rememberScrollState()).padding(horizontal = 16.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                FilterChip(selected = selectedGenreId == null, onClick = { selectedGenreId = null }, label = { Text("Tất cả thể loại") })
                genres.forEach { genre ->
                    FilterChip(selected = selectedGenreId == genre.id, onClick = { selectedGenreId = if (selectedGenreId == genre.id) null else genre.id }, label = { Text(genre.name) })
                }
            }

            if (keyword.isNotBlank()) {
                Text(
                    "Kết quả cho \"$keyword\"",
                    style = MaterialTheme.typography.bodySmall,
                    modifier = Modifier.padding(horizontal = 16.dp, vertical = 4.dp)
                )
            }

            when {
                error != null && stories.isEmpty() -> ErrorBox(error!!, onRetry = { reloadKey++ })
                !loading && stories.isEmpty() -> Text(
                    "Không tìm thấy truyện phù hợp",
                    textAlign = TextAlign.Center,
                    modifier = Modifier.fillMaxWidth().padding(32.dp)
                )
                else -> LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = androidx.compose.foundation.layout.PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    if (keyword.isBlank() && selectedGenreId == null) {
                        if (user != null && readingProgress.isNotEmpty()) {
                            item { ReadingProgressShelf(readingProgress, onOpenStory) }
                        }
                        item { StoryShelf("Mới cập nhật", updatedStories, onOpenStory) }
                        item { StoryShelf("Mới phát hành", newestStories, onOpenStory) }
                        item { StoryShelf("Đọc nhiều", popularStories, onOpenStory) }
                    }
                    items(stories, key = { it.id }) { story ->
                        StoryRow(story, onClick = { onOpenStory(story.id) })
                    }
                    item {
                        Column(Modifier.fillMaxWidth(), horizontalAlignment = Alignment.CenterHorizontally) {
                            if (loading) CircularProgressIndicator(Modifier.padding(8.dp))
                            else if (page < totalPages) OutlinedButton(onClick = { loadMore() }) { Text("Xem thêm") }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun ReadingProgressShelf(progress: List<ReadingProgressItem>, onOpenStory: (Int) -> Unit) {
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Text("Đọc tiếp", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
        LazyRow(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            items(progress, key = { "progress-${it.storyId}" }) { item ->
                Card(Modifier.width(220.dp).clickable { onOpenStory(item.storyId) }) {
                    Column(Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(5.dp)) {
                        Text(item.storyTitle, maxLines = 2, overflow = TextOverflow.Ellipsis, fontWeight = FontWeight.SemiBold)
                        Text("Chương ${item.storyChapterNumber} · Tập ${item.episodeNumber}", style = MaterialTheme.typography.bodySmall)
                        Text("Mở lại truyện để tiếp tục →", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.primary)
                    }
                }
            }
        }
    }
}

@Composable
private fun StoryShelf(title: String, stories: List<StoryListItem>, onOpenStory: (Int) -> Unit) {
    if (stories.isEmpty()) return
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Text(title, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
        LazyRow(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            items(stories, key = { "${title}-${it.id}" }) { story ->
                Card(Modifier.width(116.dp).clickable { onOpenStory(story.id) }) {
                    Column(Modifier.padding(8.dp), verticalArrangement = Arrangement.spacedBy(5.dp)) {
                        CoverPlaceholder(story.title, Modifier.fillMaxWidth().height(128.dp))
                        Text(story.title, maxLines = 2, overflow = TextOverflow.Ellipsis, fontWeight = FontWeight.SemiBold, style = MaterialTheme.typography.bodySmall)
                        Text("${story.storyChapterCount} chương · ${story.episodeCount.takeIf { it > 0 } ?: story.chapterCount} tập", style = MaterialTheme.typography.labelSmall)
                    }
                }
            }
        }
    }
}

@Composable
private fun StoryRow(story: StoryListItem, onClick: () -> Unit) {
    Card(Modifier.fillMaxWidth().clickable(onClick = onClick)) {
        Row(Modifier.padding(10.dp)) {
            CoverPlaceholder(story.title, Modifier.width(64.dp).height(86.dp))
            Spacer(Modifier.size(12.dp))
            Column(Modifier.weight(1f)) {
                Text(story.title, fontWeight = FontWeight.SemiBold, maxLines = 2, overflow = TextOverflow.Ellipsis)
                Text(story.author, style = MaterialTheme.typography.bodySmall)
                Text(
                    story.genres.joinToString(", ") { it.name },
                    style = MaterialTheme.typography.bodySmall,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
                Spacer(Modifier.height(6.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    StatusBadge(story.status)
                    Spacer(Modifier.width(8.dp))
                    Text("${story.storyChapterCount} chương · ${story.episodeCount.takeIf { it > 0 } ?: story.chapterCount} tập · ${story.viewCount} lượt đọc", style = MaterialTheme.typography.bodySmall)
                }
            }
        }
    }
}
