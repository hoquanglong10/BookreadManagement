package com.huflit.quanlydoctruyen.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
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
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.huflit.quanlydoctruyen.data.ApiClient
import com.huflit.quanlydoctruyen.data.ChapterCommentDto
import com.huflit.quanlydoctruyen.data.CreateCommentReportRequest
import com.huflit.quanlydoctruyen.data.CreateCommentRequest
import com.huflit.quanlydoctruyen.data.SessionManager
import com.huflit.quanlydoctruyen.data.toMessage
import kotlinx.coroutines.launch

@Composable
fun ChapterDiscussion(chapterId: Int, onLogin: () -> Unit) {
    val comments = remember(chapterId) { mutableStateListOf<ChapterCommentDto>() }
    var loading by remember(chapterId) { mutableStateOf(true) }
    var busy by remember { mutableStateOf(false) }
    var retry by remember { mutableIntStateOf(0) }
    var draft by rememberSaveable(chapterId) { mutableStateOf("") }
    var replyTo by remember { mutableStateOf<ChapterCommentDto?>(null) }
    var notice by remember { mutableStateOf("") }
    var error by remember { mutableStateOf("") }
    val scope = rememberCoroutineScope()

    suspend fun refresh() {
        loading = true
        try { comments.clear(); comments.addAll(ApiClient.api.chapterComments(chapterId).items); error = "" }
        catch (cause: Exception) { error = cause.toMessage() }
        finally { loading = false }
    }
    LaunchedEffect(chapterId, retry) { refresh() }

    val roots = comments.filter { it.parentCommentId == null }
    Column(Modifier.fillMaxWidth().padding(top = 24.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
        Text("Thảo luận tập này", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
        Text("${comments.size} bình luận", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
        if (SessionManager.user == null) {
            Text("Đăng nhập để chia sẻ suy nghĩ và trả lời độc giả khác.", color = MaterialTheme.colorScheme.onSurfaceVariant)
            TextButton(onClick = onLogin) { Text("Đăng nhập để bình luận") }
        } else {
            replyTo?.let { target ->
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text("Trả lời ${target.author}", color = MaterialTheme.colorScheme.primary)
                    TextButton(onClick = { replyTo = null }) { Text("Hủy") }
                }
            }
            OutlinedTextField(
                value = draft,
                onValueChange = { if (it.length <= 2000) draft = it },
                label = { Text(if (replyTo == null) "Viết bình luận" else "Viết câu trả lời") },
                minLines = 2,
                modifier = Modifier.fillMaxWidth()
            )
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text("${draft.length}/2000", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                Button(enabled = draft.isNotBlank() && !busy, onClick = {
                    scope.launch {
                        busy = true; error = ""; notice = ""
                        try {
                            ApiClient.api.createChapterComment(chapterId, CreateCommentRequest(draft.trim(), replyTo?.id))
                            draft = ""; replyTo = null; notice = "Đã đăng bình luận."; refresh()
                        } catch (cause: Exception) { error = cause.toMessage() }
                        finally { busy = false }
                    }
                }) { Text(if (busy) "Đang gửi…" else if (replyTo == null) "Đăng bình luận" else "Trả lời") }
            }
        }
        if (notice.isNotBlank()) Text(notice, color = MaterialTheme.colorScheme.primary)
        if (error.isNotBlank()) {
            Text(error, color = MaterialTheme.colorScheme.error)
            TextButton(onClick = { retry++ }) { Text("Thử tải lại") }
        }
        if (loading) Text("Đang tải thảo luận…", color = MaterialTheme.colorScheme.onSurfaceVariant)
        else if (roots.isEmpty()) Text("Chưa có bình luận. Hãy bắt đầu cuộc trò chuyện.", color = MaterialTheme.colorScheme.onSurfaceVariant)
        else roots.forEach { root ->
            CommentCard(root, onReply = { replyTo = root; draft = "" }, onReport = { comment ->
                scope.launch {
                    try {
                        ApiClient.api.reportComment(comment.id, CreateCommentReportRequest("Nội dung không phù hợp"))
                        notice = "Đã gửi báo cáo để quản trị viên xem xét."
                    } catch (cause: Exception) { error = cause.toMessage() }
                }
            })
            comments.filter { it.parentCommentId == root.id }.forEach { reply ->
                CommentCard(reply, isReply = true, onReply = {}, onReport = { comment ->
                    scope.launch {
                        try {
                            ApiClient.api.reportComment(comment.id, CreateCommentReportRequest("Nội dung không phù hợp"))
                            notice = "Đã gửi báo cáo để quản trị viên xem xét."
                        } catch (cause: Exception) { error = cause.toMessage() }
                    }
                })
            }
            Spacer(Modifier.height(4.dp))
        }
    }
}

@Composable
private fun CommentCard(
    comment: ChapterCommentDto,
    isReply: Boolean = false,
    onReply: () -> Unit,
    onReport: (ChapterCommentDto) -> Unit
) {
    val currentUserId = SessionManager.user?.id
    Card(Modifier.fillMaxWidth().padding(start = if (isReply) 20.dp else 0.dp)) {
        Column(Modifier.padding(12.dp)) {
            Text(comment.author, fontWeight = FontWeight.SemiBold)
            Text(comment.createdAt.take(10), style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
            Spacer(Modifier.height(6.dp))
            Text(comment.content)
            if (!comment.isHidden && !comment.isDeleted) {
                Row {
                    if (!isReply && currentUserId != null) TextButton(onClick = onReply) { Text("Trả lời") }
                    if (currentUserId != null && currentUserId != comment.userId) TextButton(onClick = { onReport(comment) }) { Text("Báo cáo") }
                }
            }
        }
    }
}
