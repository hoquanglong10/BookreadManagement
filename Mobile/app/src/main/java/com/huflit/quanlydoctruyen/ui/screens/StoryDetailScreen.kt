package com.huflit.quanlydoctruyen.ui.screens

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Button
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.produceState
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.huflit.quanlydoctruyen.data.ApiClient
import com.huflit.quanlydoctruyen.data.StoryDetail
import com.huflit.quanlydoctruyen.data.PaymentRequest
import com.huflit.quanlydoctruyen.data.SessionManager
import com.huflit.quanlydoctruyen.data.toMessage
import com.huflit.quanlydoctruyen.data.UiState
import com.huflit.quanlydoctruyen.data.load
import com.huflit.quanlydoctruyen.ui.components.Badge
import com.huflit.quanlydoctruyen.ui.components.CoverPlaceholder
import com.huflit.quanlydoctruyen.ui.components.ErrorBox
import com.huflit.quanlydoctruyen.ui.components.LoadingBox
import com.huflit.quanlydoctruyen.ui.components.StatusBadge
import kotlinx.coroutines.launch

// PB13: thông tin truyện + danh sách chương kèm trạng thái truy cập
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun StoryDetailScreen(storyId: Int, onRead: (Int) -> Unit, onBack: () -> Unit, onLogin: () -> Unit, onPlans: () -> Unit) {
    var retry by remember { mutableIntStateOf(0) }
    val state by produceState<UiState<StoryDetail>>(UiState.Loading, storyId, retry, SessionManager.readProgressRevision) {
        value = UiState.Loading
        value = load { ApiClient.api.storyDetail(storyId) }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text((state as? UiState.Success)?.data?.title ?: "Chi tiết truyện", maxLines = 1, overflow = TextOverflow.Ellipsis) },
                navigationIcon = { TextButton(onClick = onBack) { Text("‹ Quay lại") } }
            )
        }
    ) { padding ->
        when (val s = state) {
            is UiState.Loading -> LoadingBox(Modifier.padding(padding))
            is UiState.Error -> ErrorBox(s.message, Modifier.padding(padding), onRetry = { retry++ })
            is UiState.Success -> StoryDetailContent(s.data, onRead, onLogin, onPlans, { retry++ }, Modifier.padding(padding))
        }
    }
}

@Composable
private fun StoryDetailContent(story: StoryDetail, onRead: (Int) -> Unit, onLogin: () -> Unit, onPlans: () -> Unit, onPurchaseSuccess: () -> Unit, modifier: Modifier) {
    val published = story.chapters.filter { it.isPublished }
    val readable = published.filter { it.hasContent && it.canRead }
    val lastReadEpisode = story.lastReadNumber?.let { lastNumber -> readable.find { it.number == lastNumber } }
    val continueEpisode = lastReadEpisode ?: readable.firstOrNull()
    val grouped = published.groupBy { it.storyChapterNumber.takeIf { number -> number > 0 } ?: it.number }.toSortedMap()
    var purchaseBusy by remember(story.id) { mutableStateOf(false) }
    var paymentMessage by remember(story.id) { mutableStateOf("") }
    var simulateFailure by remember(story.id) { mutableStateOf(false) }
    val scope = rememberCoroutineScope()

    LazyColumn(modifier.fillMaxSize()) {
        item {
            Row(Modifier.padding(16.dp)) {
                CoverPlaceholder(story.title, Modifier.width(110.dp).height(150.dp))
                Spacer(Modifier.width(16.dp))
                Column(Modifier.weight(1f)) {
                    Text(story.title, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                    Spacer(Modifier.height(6.dp))
                    Text("Tác giả: ${story.author}", style = MaterialTheme.typography.bodyMedium)
                    Text("Thể loại: ${story.genres.joinToString(", ") { it.name }}", style = MaterialTheme.typography.bodyMedium)
                    Text("${grouped.size} chương · ${published.size} tập", style = MaterialTheme.typography.bodyMedium)
                    Text("Lượt đọc: ${story.viewCount}", style = MaterialTheme.typography.bodyMedium)
                    Text(
                        when (story.accessType) {
                            "Paid" -> "Trả phí · ${story.price.toLong()} ₫"
                            "Mixed" -> "Kết hợp · ${story.freeChapterCount} chương đầu miễn phí"
                            else -> "Miễn phí"
                        },
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.primary
                    )
                    Spacer(Modifier.height(6.dp))
                    StatusBadge(story.status)
                }
            }
        }

        item {
            Column(Modifier.padding(horizontal = 16.dp)) {
                if (continueEpisode != null) {
                    Button(onClick = { onRead(continueEpisode.number) }, modifier = Modifier.fillMaxWidth()) {
                        Text(if (lastReadEpisode != null) "Đọc tiếp" else "Đọc từ đầu")
                    }
                }
                if (!story.description.isNullOrBlank()) {
                    Text(story.description, style = MaterialTheme.typography.bodyMedium, modifier = Modifier.padding(vertical = 12.dp))
                }
                if (story.accessType != "Free" && !story.hasPurchase) {
                    Button(enabled = !purchaseBusy, onClick = {
                        if (SessionManager.token == null) { onLogin(); return@Button }
                        scope.launch {
                            purchaseBusy = true; paymentMessage = ""
                            try {
                                val requestScope = "story:${story.id}:$simulateFailure"
                                val requestId = SessionManager.paymentRequestId(requestScope)
                                val result = ApiClient.api.buyStory(story.id, PaymentRequest(requestId, simulateFailure))
                                SessionManager.completePaymentRequest(requestScope)
                                if (result.status == "Success") { paymentMessage = "Đã mở quyền đọc truyện."; onPurchaseSuccess() }
                                else paymentMessage = result.failureReason ?: "Giao dịch thất bại, chưa cấp quyền."
                            } catch (cause: Exception) { paymentMessage = cause.toMessage() }
                            finally { purchaseBusy = false }
                        }
                    }, modifier = Modifier.fillMaxWidth()) {
                        Text(if (purchaseBusy) "Đang xử lý…" else "Mua truyện · ${story.price.toLong()} ₫")
                    }
                    TextButton(onClick = { simulateFailure = !simulateFailure }) { Text(if (simulateFailure) "Đang mô phỏng giao dịch thất bại" else "Dùng thử trạng thái giao dịch thất bại") }
                }
                if (story.hasPurchase) Text("Đã sở hữu quyền đọc trọn truyện.", color = MaterialTheme.colorScheme.primary)
                if (story.hasPlanAccess && !story.hasPurchase) TextButton(onClick = onPlans) { Text("Gói đọc đang cấp quyền · Xem gói và gia hạn") }
                if (paymentMessage.isNotBlank()) Text(paymentMessage, color = MaterialTheme.colorScheme.primary)
                Text(
                    "Mục lục chương & tập",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.SemiBold,
                    modifier = Modifier.padding(top = 8.dp, bottom = 4.dp)
                )
            }
        }

        if (published.isEmpty()) {
            item { Text("Truyện chưa có chương nào", Modifier.padding(16.dp)) }
        }

        items(grouped.entries.toList(), key = { it.key }) { (groupNumber, episodes) ->
            Column(Modifier.fillMaxWidth()) {
                val groupTitle = episodes.firstOrNull()?.storyChapterTitle?.takeIf(String::isNotBlank)
                Text("Chương $groupNumber${groupTitle?.let { ": $it" }.orEmpty()}", Modifier.padding(start = 16.dp, end = 16.dp, top = 18.dp, bottom = 6.dp), style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Bold)
                episodes.sortedBy { it.episodeNumber }.forEach { episode ->
                    Row(
                        Modifier.fillMaxWidth()
                            .clickable(enabled = episode.hasContent && episode.canRead) { onRead(episode.number) }
                            .padding(horizontal = 16.dp, vertical = 12.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("Tập ${episode.episodeNumber}: ${episode.title}", Modifier.weight(1f), maxLines = 2, overflow = TextOverflow.Ellipsis)
                        val isRead = episode.isRead || SessionManager.isEpisodeRead(story.id, episode.number)
                        Column(horizontalAlignment = Alignment.End, verticalArrangement = Arrangement.spacedBy(4.dp)) {
                            Badge(
                                if (isRead) "Đã đọc" else "Chưa đọc",
                                if (isRead) Color(0xFFDCFCE7) else Color(0xFFF3F4F6),
                                if (isRead) Color(0xFF15803D) else Color(0xFF6B7280)
                            )
                            if (!episode.hasContent) Badge("Đang biên soạn", Color(0xFFF3F4F6), Color(0xFF6B7280))
                            else if (episode.canRead && episode.accessLabel == "Đã mở khóa") Badge("Đã mở khóa", Color(0xFFDBEAFE), Color(0xFF1D4ED8))
                            else if (episode.canRead || episode.isFree) Badge("Miễn phí", Color(0xFFDCFCE7), Color(0xFF15803D))
                            else Badge("Trả phí", Color(0xFFFFEDD5), Color(0xFFC2410C))
                        }
                    }
                    HorizontalDivider(Modifier.padding(horizontal = 16.dp))
                }
            }
        }
    }
}
