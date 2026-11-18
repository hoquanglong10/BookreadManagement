package com.huflit.quanlydoctruyen.ui.screens

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Tab
import androidx.compose.material3.SecondaryTabRow
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
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.huflit.quanlydoctruyen.data.ApiClient
import com.huflit.quanlydoctruyen.data.FollowedStoryItem
import com.huflit.quanlydoctruyen.data.ReaderNotificationItem
import com.huflit.quanlydoctruyen.data.SessionManager
import com.huflit.quanlydoctruyen.data.toMessage
import com.huflit.quanlydoctruyen.ui.components.ErrorBox
import com.huflit.quanlydoctruyen.ui.components.LoadingBox
import com.huflit.quanlydoctruyen.ui.components.RootNavigationBar
import com.huflit.quanlydoctruyen.ui.components.CoverPlaceholder
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LibraryScreen(onOpenStory: (Int) -> Unit, onRead: (Int, Int) -> Unit, onHome: () -> Unit, onProfile: () -> Unit, onLogin: () -> Unit) {
    var tab by remember { mutableIntStateOf(0) }
    val follows = remember { mutableStateListOf<FollowedStoryItem>() }
    val notifications = remember { mutableStateListOf<ReaderNotificationItem>() }
    var loading by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf<String?>(null) }
    var unreadCount by remember { mutableIntStateOf(0) }
    val scope = rememberCoroutineScope()
    val listState = rememberLazyListState()

    suspend fun refresh() {
        loading = true
        try {
            val followed = ApiClient.api.followedStories()
            val alerts = ApiClient.api.notifications()
            follows.clear(); follows.addAll(followed.items)
            notifications.clear(); notifications.addAll(alerts.items)
            unreadCount = alerts.unreadCount
            error = null
        } catch (cause: Exception) { error = cause.toMessage() }
        finally { loading = false }
    }
    val user = SessionManager.user
    LaunchedEffect(user?.id) {
        if (user != null) refresh()
        else {
            follows.clear()
            notifications.clear()
            unreadCount = 0
            loading = false
            error = null
        }
    }

    Scaffold(topBar = {
        TopAppBar(
            title = { Text("Thư viện", fontWeight = FontWeight.Bold) },
            actions = { TextButton(onClick = { scope.launch { refresh() } }, enabled = user != null && !loading) { Text("Làm mới") } }
        )
    }, bottomBar = {
        RootNavigationBar(selected = 1, onHome = onHome, onLibrary = { scope.launch { listState.animateScrollToItem(0) } }, onProfile = onProfile, libraryBadge = unreadCount)
    }) { padding ->
        Column(Modifier.padding(padding).fillMaxSize()) {
            if (user == null) {
                Column(Modifier.fillMaxSize().padding(horizontal = 28.dp), verticalArrangement = Arrangement.Center) {
                    Text("Truyện bạn theo dõi, ở cùng một nơi.", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
                    Text("Đăng nhập để đồng bộ thư viện và nhận tin khi có chương mới.", style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.padding(top = 8.dp))
                    Button(onClick = onLogin, modifier = Modifier.fillMaxWidth().padding(top = 20.dp)) { Text("Đăng nhập") }
                }
            } else {
            SecondaryTabRow(selectedTabIndex = tab) {
                Tab(selected = tab == 0, onClick = { tab = 0 }, text = { Text("Theo dõi · ${follows.size}") })
                Tab(selected = tab == 1, onClick = { tab = 1 }, text = { Text("Thông báo${if (unreadCount > 0) " · $unreadCount" else ""}") })
            }
            if (error != null) ErrorBox(error!!, Modifier.padding(16.dp).height(220.dp), onRetry = { scope.launch { refresh() } })
            else if (loading) LoadingBox()
            else if (tab == 0) {
                LazyColumn(state = listState, contentPadding = androidx.compose.foundation.layout.PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    if (follows.isEmpty()) item {
                        Column(Modifier.fillMaxWidth().padding(vertical = 32.dp), horizontalAlignment = androidx.compose.ui.Alignment.CenterHorizontally) {
                            Text("Thư viện đang chờ bạn", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                            Text("Theo dõi truyện để nhận chương mới và lưu lại những gì bạn muốn đọc.", style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.padding(top = 6.dp))
                        }
                    }
                    items(follows, key = { it.storyId }) { item ->
                        Column {
                            Row(Modifier.fillMaxWidth().padding(vertical = 8.dp), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                                CoverPlaceholder(item.story.title, Modifier.width(58.dp).height(78.dp).clickable { onOpenStory(item.story.id) }, item.story.coverUrl)
                                Column(Modifier.weight(1f).clickable { onOpenStory(item.story.id) }) {
                                    Text(item.story.title, fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleMedium, maxLines = 2)
                                    Text(item.story.author, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                    Text("${item.story.chapterCount} tập · ${item.story.status}", style = MaterialTheme.typography.bodySmall)
                                }
                                TextButton(onClick = {
                                    scope.launch {
                                        try { ApiClient.api.unfollowStory(item.storyId); follows.removeAll { it.storyId == item.storyId } }
                                        catch (cause: Exception) { error = cause.toMessage() }
                                    }
                                }) { Text("Bỏ theo dõi") }
                            }
                            HorizontalDivider()
                        }
                    }
                }
            } else {
                Row(Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 8.dp), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text(if (unreadCount > 0) "$unreadCount thông báo chưa đọc" else "Đã xem hết thông báo mới", color = MaterialTheme.colorScheme.onSurfaceVariant)
                    if (unreadCount > 0) TextButton(onClick = {
                        scope.launch {
                            try {
                                ApiClient.api.markAllNotificationsRead()
                                unreadCount = 0
                                notifications.indices.forEach { index -> notifications[index] = notifications[index].copy(readAt = "read") }
                            } catch (cause: Exception) { error = cause.toMessage() }
                        }
                    }) { Text("Đọc tất cả") }
                }
                if (notifications.isEmpty()) Text("Chưa có thông báo chương mới.", Modifier.padding(20.dp), color = MaterialTheme.colorScheme.onSurfaceVariant)
                LazyColumn(state = listState, contentPadding = androidx.compose.foundation.layout.PaddingValues(horizontal = 16.dp, vertical = 4.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    items(notifications, key = { it.id }) { item ->
                        Card(Modifier.fillMaxWidth().clickable {
                            scope.launch {
                                if (item.readAt == null) {
                                    val marked = runCatching { ApiClient.api.markNotificationRead(item.id) }
                                    if (marked.isSuccess) {
                                        notifications.indexOfFirst { it.id == item.id }.takeIf { it >= 0 }?.let { index -> notifications[index] = item.copy(readAt = "read") }
                                        unreadCount = (unreadCount - 1).coerceAtLeast(0)
                                    } else error = marked.exceptionOrNull()?.toMessage() ?: "Không thể cập nhật thông báo."
                                }
                                onRead(item.storyId, item.chapterNumber)
                            }
                        }) {
                            Column(Modifier.fillMaxWidth().padding(14.dp)) {
                                Text(item.storyTitle, fontWeight = FontWeight.Bold)
                                Text("Chương ${item.storyChapterNumber}: ${item.storyChapterTitle} · Tập ${item.chapterNumber}: ${item.chapterTitle}")
                                Spacer(Modifier.height(4.dp))
                                Text(if (item.readAt == null) "Mới · ${item.createdAt.take(10)}" else item.createdAt.take(10), style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.primary)
                            }
                        }
                    }
                }
            }
            }
        }
    }
}
