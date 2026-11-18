package com.huflit.quanlydoctruyen.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.background
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.HorizontalDivider
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
import androidx.compose.ui.Alignment
import androidx.compose.ui.draw.clip
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
    var reportTarget by remember { mutableStateOf<ChapterCommentDto?>(null) }
    var reportReason by remember { mutableStateOf("Nội dung không phù hợp") }
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
                reportTarget = comment
            })
            comments.filter { it.parentCommentId == root.id }.forEach { reply ->
                CommentCard(reply, isReply = true, onReply = {}, onReport = { comment ->
                    reportTarget = comment
                })
            }
            HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.65f))
        }
    }
    reportTarget?.let { target ->
        AlertDialog(
            onDismissRequest = { reportTarget = null },
            title = { Text("Báo cáo bình luận") },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("Cho chúng tôi biết lý do để quản trị viên xem xét.", style = MaterialTheme.typography.bodyMedium)
                    OutlinedTextField(value = reportReason, onValueChange = { reportReason = it }, label = { Text("Lý do") }, minLines = 2)
                }
            },
            confirmButton = {
                TextButton(enabled = reportReason.isNotBlank(), onClick = {
                    scope.launch {
                        try {
                            ApiClient.api.reportComment(target.id, CreateCommentReportRequest(reportReason.trim()))
                            notice = "Đã gửi báo cáo để quản trị viên xem xét."
                            reportTarget = null
                        } catch (cause: Exception) { error = cause.toMessage() }
                    }
                }) { Text("Gửi báo cáo") }
            },
            dismissButton = { TextButton(onClick = { reportTarget = null }) { Text("Hủy") } }
        )
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
    Row(
        Modifier.fillMaxWidth().padding(start = if (isReply) 18.dp else 0.dp, top = 8.dp, bottom = 8.dp),
        horizontalArrangement = Arrangement.spacedBy(10.dp),
        verticalAlignment = Alignment.Top
    ) {
        Box(
            Modifier.size(if (isReply) 30.dp else 36.dp).clip(CircleShape).background(MaterialTheme.colorScheme.primaryContainer),
            contentAlignment = Alignment.Center
        ) {
            Text(comment.author.firstOrNull()?.uppercase() ?: "Đ", color = MaterialTheme.colorScheme.onPrimaryContainer, fontWeight = FontWeight.Bold, style = MaterialTheme.typography.labelMedium)
        }
        Column(Modifier.weight(1f)) {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                Text(comment.author, fontWeight = FontWeight.SemiBold, style = MaterialTheme.typography.bodyMedium)
                Text(comment.createdAt.take(10), style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
            Spacer(Modifier.height(4.dp))
            Text(comment.content, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurface)
            if (!comment.isHidden && !comment.isDeleted) {
                Row {
                    if (!isReply && currentUserId != null) TextButton(onClick = onReply) { Text("Trả lời") }
                    if (currentUserId != null && currentUserId != comment.userId) TextButton(onClick = { onReport(comment) }) { Text("Báo cáo") }
                }
            }
        }
    }
}
