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
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.Card
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.HorizontalDivider
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
import com.huflit.quanlydoctruyen.ui.components.RootNavigationBar
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
fun HomeScreen(onOpenStory: (Int) -> Unit, onLogin: () -> Unit, onProfile: () -> Unit, onLibrary: () -> Unit) {
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
    val listState = rememberLazyListState()
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

    val discoveryMode = keyword.isBlank() && selectedGenreId == null
    val featuredStoryIds = remember(updatedStories.toList(), newestStories.toList(), popularStories.toList()) {
        (updatedStories + newestStories + popularStories).mapTo(mutableSetOf()) { it.id }
    }
    val visibleStories = if (discoveryMode) stories.filterNot { it.id in featuredStoryIds } else stories
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Đọc Truyện", fontWeight = FontWeight.Bold) },
                actions = { if (user == null) TextButton(onClick = onLogin) { Text("Đăng nhập") } }
            )
        },
        bottomBar = {
            RootNavigationBar(selected = 0, onHome = { scope.launch { listState.animateScrollToItem(0) } }, onLibrary = onLibrary, onProfile = onProfile)
        },
        containerColor = MaterialTheme.colorScheme.background
    ) { padding ->
        LazyColumn(
            state = listState,
            modifier = Modifier.padding(padding).fillMaxSize(),
            contentPadding = androidx.compose.foundation.layout.PaddingValues(bottom = 24.dp),
            verticalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            item {
                Column(Modifier.fillMaxWidth().padding(horizontal = 20.dp, vertical = 12.dp)) {
                    Text(
                        if (user == null) "KHÔNG GIAN ĐỌC CỦA BẠN" else "XIN CHÀO, ${user.displayName.ifBlank { user.username }.uppercase()}",
                        style = MaterialTheme.typography.labelMedium,
                        color = MaterialTheme.colorScheme.primary,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        if (discoveryMode) "Hôm nay đọc gì?" else "Tìm câu chuyện tiếp theo",
                        style = MaterialTheme.typography.headlineSmall,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(top = 4.dp)
                    )
                    Text(
                        "Khám phá những câu chuyện hợp gu của bạn.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.padding(top = 3.dp)
                    )
                }
            }
            item {
                OutlinedTextField(
                    value = input,
                    onValueChange = { input = it },
                    placeholder = { Text("Tìm truyện, tác giả…") },
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(imeAction = ImeAction.Search),
                    keyboardActions = KeyboardActions(onSearch = { keyword = input.trim() }),
                    trailingIcon = { TextButton(onClick = { keyword = input.trim() }) { Text("Tìm") } },
                    modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 4.dp)
                )
            }
            if (!discoveryMode) {
                item {
                    Row(
                        Modifier.horizontalScroll(rememberScrollState()).padding(horizontal = 16.dp),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        SORTS.forEach { (value, label) ->
                            FilterChip(selected = sort == value, onClick = { sort = value }, label = { Text(label) })
                        }
                    }
                }
            }
            item {
                Row(
                    Modifier.horizontalScroll(rememberScrollState()).padding(horizontal = 16.dp),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    FilterChip(selected = selectedGenreId == null, onClick = { selectedGenreId = null }, label = { Text("Tất cả") })
                    genres.forEach { genre ->
                        FilterChip(selected = selectedGenreId == genre.id, onClick = { selectedGenreId = if (selectedGenreId == genre.id) null else genre.id }, label = { Text(genre.name) })
                    }
                }
            }
            if (keyword.isNotBlank()) {
                item {
                    Text(
                        "Kết quả cho “$keyword”",
                        style = MaterialTheme.typography.titleSmall,
                        fontWeight = FontWeight.SemiBold,
                        modifier = Modifier.padding(horizontal = 20.dp, vertical = 8.dp)
                    )
                }
            }
            if (error != null && stories.isEmpty()) {
                item { ErrorBox(error!!, Modifier.height(220.dp), onRetry = { reloadKey++ }) }
            } else {
                if (discoveryMode) {
                    if (user != null && readingProgress.isNotEmpty()) {
                        item { ReadingProgressShelf(readingProgress, onOpenStory) }
                    }
                    item { StoryShelf("Mới cập nhật", updatedStories, onOpenStory) }
                    item { StoryShelf("Mới phát hành", newestStories, onOpenStory) }
                    item { StoryShelf("Đọc nhiều", popularStories, onOpenStory) }
                    item {
                        Text(
                            "Khám phá thêm",
                            style = MaterialTheme.typography.titleLarge,
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier.padding(start = 20.dp, end = 20.dp, top = 18.dp, bottom = 4.dp)
                        )
                    }
                }
                if (!loading && stories.isEmpty()) {
                    item {
                        Column(Modifier.fillMaxWidth().padding(horizontal = 28.dp, vertical = 32.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                            Text("Chưa tìm thấy truyện phù hợp", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold, textAlign = TextAlign.Center)
                            Text("Thử từ khóa khác hoặc bỏ bớt bộ lọc.", style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant, textAlign = TextAlign.Center, modifier = Modifier.padding(top = 6.dp))
                        }
                    }
                }
                items(visibleStories, key = { it.id }) { story ->
                    StoryRow(story, onClick = { onOpenStory(story.id) })
                }
                item {
                    Column(Modifier.fillMaxWidth().padding(vertical = 16.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                        if (loading) CircularProgressIndicator(Modifier.padding(8.dp))
                        else if (page < totalPages) OutlinedButton(onClick = { loadMore() }) { Text("Xem thêm truyện") }
                    }
                }
            }
        }
    }
}

@Composable
private fun ReadingProgressShelf(progress: List<ReadingProgressItem>, onOpenStory: (Int) -> Unit) {
    Column(Modifier.padding(horizontal = 20.dp, vertical = 10.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Text("Đọc tiếp", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
        LazyRow(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            items(progress, key = { "progress-${it.storyId}" }) { item ->
                Row(Modifier.width(248.dp).clickable { onOpenStory(item.storyId) }.padding(vertical = 4.dp), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    CoverPlaceholder(item.storyTitle, Modifier.width(48.dp).height(66.dp), item.coverUrl)
                    Column(Modifier.weight(1f).align(Alignment.CenterVertically), verticalArrangement = Arrangement.spacedBy(5.dp)) {
                        Text(item.storyTitle, maxLines = 2, overflow = TextOverflow.Ellipsis, fontWeight = FontWeight.SemiBold)
                        Text("Chương ${item.storyChapterNumber} · Tập ${item.episodeNumber}", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        Text("Đọc tiếp  →", style = MaterialTheme.typography.labelLarge, color = MaterialTheme.colorScheme.primary)
                    }
                }
            }
        }
    }
}

@Composable
private fun StoryShelf(title: String, stories: List<StoryListItem>, onOpenStory: (Int) -> Unit) {
    if (stories.isEmpty()) return
    Column(Modifier.padding(horizontal = 20.dp, vertical = 10.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Text(title, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
        LazyRow(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            items(stories, key = { "${title}-${it.id}" }) { story ->
                Column(Modifier.width(118.dp).clickable { onOpenStory(story.id) }, verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    CoverPlaceholder(story.title, Modifier.fillMaxWidth().height(152.dp), story.coverUrl)
                    Text(story.title, maxLines = 2, overflow = TextOverflow.Ellipsis, fontWeight = FontWeight.SemiBold, style = MaterialTheme.typography.bodySmall)
                    Text("${story.storyChapterCount} chương", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            }
        }
    }
}

@Composable
private fun StoryRow(story: StoryListItem, onClick: () -> Unit) {
    Column(Modifier.fillMaxWidth().clickable(onClick = onClick)) {
        Row(Modifier.padding(horizontal = 20.dp, vertical = 12.dp)) {
            CoverPlaceholder(story.title, Modifier.width(68.dp).height(92.dp), story.coverUrl)
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
        HorizontalDivider(Modifier.padding(start = 20.dp, end = 20.dp))
    }
}
