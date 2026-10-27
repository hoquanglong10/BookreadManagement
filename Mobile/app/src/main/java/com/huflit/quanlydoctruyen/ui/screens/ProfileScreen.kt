package com.huflit.quanlydoctruyen.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.Checkbox
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import com.huflit.quanlydoctruyen.data.ApiClient
import com.huflit.quanlydoctruyen.data.ChangePasswordRequest
import com.huflit.quanlydoctruyen.data.SessionManager
import com.huflit.quanlydoctruyen.data.PaymentRequest
import com.huflit.quanlydoctruyen.data.PaymentHistoryDto
import com.huflit.quanlydoctruyen.data.SubscriptionPlanDto
import com.huflit.quanlydoctruyen.data.UpdateProfileRequest
import com.huflit.quanlydoctruyen.data.toMessage
import kotlinx.coroutines.launch
import java.util.UUID

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProfileScreen(onBack: () -> Unit) {
    val user = SessionManager.user
    var displayName by remember { mutableStateOf(user?.displayName?.ifBlank { user.username } ?: "") }
    var avatarUrl by remember { mutableStateOf(user?.avatarUrl.orEmpty()) }
    var currentPassword by remember { mutableStateOf("") }
    var newPassword by remember { mutableStateOf("") }
    var confirmPassword by remember { mutableStateOf("") }
    var message by remember { mutableStateOf("") }
    var error by remember { mutableStateOf("") }
    var busy by remember { mutableStateOf(false) }
    var plans by remember { mutableStateOf<List<SubscriptionPlanDto>>(emptyList()) }
    var payments by remember { mutableStateOf<List<PaymentHistoryDto>>(emptyList()) }
    var simulateFailure by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScope()

    LaunchedEffect(user?.id) {
        runCatching { ApiClient.api.availablePlans() }.onSuccess { plans = it }
        if (SessionManager.token != null) runCatching { ApiClient.api.paymentHistory() }.onSuccess { payments = it }
    }

    Scaffold(topBar = {
        TopAppBar(title = { Text("Hồ sơ độc giả") }, navigationIcon = { TextButton(onClick = onBack) { Text("‹ Quay lại") } })
    }) { padding ->
        Column(
            Modifier.padding(padding).fillMaxSize().verticalScroll(rememberScrollState()).padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Text("Thông tin cá nhân", style = MaterialTheme.typography.titleLarge)
            OutlinedTextField(value = user?.username.orEmpty(), onValueChange = {}, readOnly = true, label = { Text("Tên đăng nhập") }, modifier = Modifier.fillMaxWidth())
            OutlinedTextField(value = user?.email.orEmpty(), onValueChange = {}, readOnly = true, label = { Text("Email") }, modifier = Modifier.fillMaxWidth())
            OutlinedTextField(value = displayName, onValueChange = { displayName = it }, label = { Text("Tên hiển thị") }, singleLine = true, modifier = Modifier.fillMaxWidth())
            OutlinedTextField(value = avatarUrl, onValueChange = { avatarUrl = it }, label = { Text("URL ảnh đại diện") }, singleLine = true, modifier = Modifier.fillMaxWidth())
            Button(enabled = !busy, onClick = {
                scope.launch {
                    busy = true; error = ""; message = ""
                    try {
                        val updated = ApiClient.api.updateProfile(UpdateProfileRequest(displayName.trim(), avatarUrl.trim().ifBlank { null }))
                        SessionManager.updateUser(updated)
                        message = "Đã lưu hồ sơ."
                    } catch (cause: Exception) { error = cause.toMessage() }
                    finally { busy = false }
                }
            }, modifier = Modifier.fillMaxWidth()) { Text(if (busy) "Đang lưu…" else "Lưu hồ sơ") }

            Text("Bảo mật", style = MaterialTheme.typography.titleLarge, modifier = Modifier.padding(top = 16.dp))
            OutlinedTextField(value = currentPassword, onValueChange = { currentPassword = it }, label = { Text("Mật khẩu hiện tại") }, visualTransformation = PasswordVisualTransformation(), singleLine = true, modifier = Modifier.fillMaxWidth())
            OutlinedTextField(value = newPassword, onValueChange = { newPassword = it }, label = { Text("Mật khẩu mới (8–128 ký tự)") }, visualTransformation = PasswordVisualTransformation(), singleLine = true, modifier = Modifier.fillMaxWidth())
            OutlinedTextField(value = confirmPassword, onValueChange = { confirmPassword = it }, label = { Text("Nhập lại mật khẩu mới") }, visualTransformation = PasswordVisualTransformation(), singleLine = true, modifier = Modifier.fillMaxWidth())
            Button(enabled = !busy, onClick = {
                error = ""; message = ""
                if (newPassword.length !in 8..128) { error = "Mật khẩu mới cần từ 8 đến 128 ký tự."; return@Button }
                if (newPassword != confirmPassword) { error = "Mật khẩu nhập lại chưa khớp."; return@Button }
                scope.launch {
                    busy = true
                    try {
                        ApiClient.api.changePassword(ChangePasswordRequest(currentPassword, newPassword))
                        currentPassword = ""; newPassword = ""; confirmPassword = ""
                        message = "Đã đổi mật khẩu."
                    } catch (cause: Exception) { error = cause.toMessage() }
                    finally { busy = false }
                }
            }, modifier = Modifier.fillMaxWidth()) { Text("Đổi mật khẩu") }

            Text("Gói đọc và gia hạn", style = MaterialTheme.typography.titleLarge, modifier = Modifier.padding(top = 20.dp))
            Text("Thanh toán minh họa, không kết nối ngân hàng và không trừ tiền thật.", style = MaterialTheme.typography.bodySmall)
            if (SessionManager.token != null) {
                androidx.compose.foundation.layout.Row(verticalAlignment = androidx.compose.ui.Alignment.CenterVertically) {
                    Checkbox(checked = simulateFailure, onCheckedChange = { simulateFailure = it })
                    Text("Mô phỏng giao dịch thất bại")
                }
                plans.forEach { plan ->
                    androidx.compose.material3.Card(Modifier.fillMaxWidth()) {
                        Column(Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                            Text(plan.name, style = MaterialTheme.typography.titleMedium)
                            Text("${plan.durationDays} ngày · ${plan.price.toLong().toString().reversed().chunked(3).joinToString(".").reversed()} ₫")
                            Button(enabled = !busy, onClick = {
                                scope.launch {
                                    busy = true; error = ""; message = ""
                                    try {
                                        val result = ApiClient.api.subscribe(plan.id, PaymentRequest(UUID.randomUUID().toString(), simulateFailure))
                                        message = if (result.status == "Success") "Đã đăng ký/gia hạn ${plan.name}." else result.failureReason ?: "Giao dịch thất bại, chưa cấp quyền."
                                        payments = ApiClient.api.paymentHistory()
                                    } catch (cause: Exception) { error = cause.toMessage() }
                                    finally { busy = false }
                                }
                            }, modifier = Modifier.fillMaxWidth()) { Text(if (busy) "Đang xử lý…" else "Đăng ký / Gia hạn") }
                        }
                    }
                }
                Text("Lịch sử thanh toán", style = MaterialTheme.typography.titleLarge, modifier = Modifier.padding(top = 8.dp))
                if (payments.isEmpty()) Text("Chưa có giao dịch.", style = MaterialTheme.typography.bodySmall)
                payments.forEach { payment ->
                    Text(
                        "${if (payment.type == "Plan") payment.planName ?: "Gói đọc" else payment.storyTitle ?: "Truyện"} · ${payment.status} · ${payment.amount.toLong()} ₫" +
                            if (payment.reconciledAt != null) " · Đã đối soát/cấp quyền" else if (payment.failureReason != null) " · ${payment.failureReason}" else "",
                        style = MaterialTheme.typography.bodySmall,
                        modifier = Modifier.padding(vertical = 4.dp)
                    )
                }
            } else {
                Text("Đăng nhập để đăng ký gói, gia hạn và xem lịch sử giao dịch.", color = MaterialTheme.colorScheme.error)
            }
            if (message.isNotBlank()) Text(message, color = MaterialTheme.colorScheme.primary)
            if (error.isNotBlank()) Text(error, color = MaterialTheme.colorScheme.error)
        }
    }
}
