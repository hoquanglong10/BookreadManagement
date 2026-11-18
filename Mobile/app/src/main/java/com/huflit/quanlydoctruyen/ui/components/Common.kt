package com.huflit.quanlydoctruyen.ui.components

import android.graphics.BitmapFactory
import android.util.LruCache
import androidx.compose.animation.Crossfade
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.produceState
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.drawscope.Stroke
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.net.HttpURLConnection
import java.net.URL

private object CoverImageCache {
    private val cache = object : LruCache<String, android.graphics.Bitmap>(24 * 1024) {
        override fun sizeOf(key: String, value: android.graphics.Bitmap): Int = value.byteCount / 1024
    }

    fun get(url: String) = cache.get(url)
    fun put(url: String, bitmap: android.graphics.Bitmap) { cache.put(url, bitmap) }
}

/** Hiển thị ảnh bìa từ API và dùng bìa chữ làm phương án dự phòng khi offline. */
@Composable
fun CoverPlaceholder(title: String, modifier: Modifier = Modifier, coverUrl: String? = null) {
    val image = produceState<android.graphics.Bitmap?>(null, coverUrl) {
        val source = coverUrl?.trim().orEmpty()
        if (source.isBlank()) {
            value = null
        } else {
            value = withContext(Dispatchers.IO) {
                val normalized = when {
                    source.startsWith("/") -> "http://127.0.0.1:5059$source"
                    source.startsWith("http://localhost:") -> source.replace("http://localhost:", "http://127.0.0.1:")
                    else -> source
                }
                CoverImageCache.get(normalized) ?: runCatching {
                    val connection = URL(normalized).openConnection() as HttpURLConnection
                    connection.connectTimeout = 4500
                    connection.readTimeout = 4500
                    connection.instanceFollowRedirects = true
                    try {
                        connection.connect()
                        if (connection.responseCode !in 200..299) null
                        else BitmapFactory.decodeStream(connection.inputStream)?.also { CoverImageCache.put(normalized, it) }
                    } finally {
                        connection.disconnect()
                    }
                }.getOrNull()
            }
        }
    }
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(6.dp))
            .background(Brush.linearGradient(listOf(Color(0xFF285F59), Color(0xFFB56B43)))),
        contentAlignment = Alignment.Center
    ) {
        Crossfade(targetState = image.value, animationSpec = tween(220), label = "cover-fade") { bitmap ->
            if (bitmap != null) {
                Image(
                    bitmap = bitmap.asImageBitmap(),
                    contentDescription = title,
                    contentScale = ContentScale.Crop,
                    modifier = Modifier.fillMaxSize().semantics { contentDescription = title }
                )
            } else {
                Text(
                    text = title,
                    color = Color.White,
                    fontWeight = FontWeight.SemiBold,
                    fontSize = 11.sp,
                    textAlign = TextAlign.Center,
                    maxLines = 4,
                    modifier = Modifier.padding(6.dp)
                )
            }
        }
    }
}

@Composable
@OptIn(ExperimentalMaterial3Api::class)
fun RootNavigationBar(selected: Int, onHome: () -> Unit, onLibrary: () -> Unit, onProfile: () -> Unit, libraryBadge: Int = 0) {
    NavigationBar(containerColor = MaterialTheme.colorScheme.surface) {
        NavigationBarItem(
            selected = selected == 0,
            onClick = onHome,
            icon = { RootNavigationIcon(kind = 0, selected = selected == 0) },
            label = { Text("Khám phá") },
            alwaysShowLabel = true
        )
        NavigationBarItem(
            selected = selected == 1,
            onClick = onLibrary,
            icon = {
                androidx.compose.material3.BadgedBox(
                    badge = { if (libraryBadge > 0) androidx.compose.material3.Badge { Text(if (libraryBadge > 99) "99+" else libraryBadge.toString()) } }
                ) { RootNavigationIcon(kind = 1, selected = selected == 1) }
            },
            label = { Text("Thư viện") },
            alwaysShowLabel = true
        )
        NavigationBarItem(
            selected = selected == 2,
            onClick = onProfile,
            icon = { RootNavigationIcon(kind = 2, selected = selected == 2) },
            label = { Text("Tài khoản") },
            alwaysShowLabel = true
        )
    }
}

@Composable
private fun RootNavigationIcon(kind: Int, selected: Boolean) {
    val tint = if (selected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurfaceVariant
    Canvas(Modifier.size(24.dp)) {
        val stroke = Stroke(width = 1.8.dp.toPx())
        when (kind) {
            0 -> {
                drawLine(tint, Offset(size.width * .12f, size.height * .46f), Offset(size.width * .5f, size.height * .14f), strokeWidth = stroke.width)
                drawLine(tint, Offset(size.width * .5f, size.height * .14f), Offset(size.width * .88f, size.height * .46f), strokeWidth = stroke.width)
                drawLine(tint, Offset(size.width * .24f, size.height * .41f), Offset(size.width * .24f, size.height * .86f), strokeWidth = stroke.width)
                drawLine(tint, Offset(size.width * .76f, size.height * .41f), Offset(size.width * .76f, size.height * .86f), strokeWidth = stroke.width)
                drawLine(tint, Offset(size.width * .24f, size.height * .86f), Offset(size.width * .76f, size.height * .86f), strokeWidth = stroke.width)
                drawLine(tint, Offset(size.width * .45f, size.height * .86f), Offset(size.width * .45f, size.height * .6f), strokeWidth = stroke.width)
                drawLine(tint, Offset(size.width * .55f, size.height * .86f), Offset(size.width * .55f, size.height * .6f), strokeWidth = stroke.width)
            }
            1 -> {
                drawRoundRect(tint, topLeft = Offset(size.width * .2f, size.height * .12f), size = androidx.compose.ui.geometry.Size(size.width * .6f, size.height * .76f), cornerRadius = androidx.compose.ui.geometry.CornerRadius(2.dp.toPx()), style = stroke)
                drawLine(tint, Offset(size.width * .34f, size.height * .34f), Offset(size.width * .66f, size.height * .34f), strokeWidth = stroke.width)
                drawLine(tint, Offset(size.width * .34f, size.height * .5f), Offset(size.width * .66f, size.height * .5f), strokeWidth = stroke.width)
                drawLine(tint, Offset(size.width * .34f, size.height * .66f), Offset(size.width * .6f, size.height * .66f), strokeWidth = stroke.width)
            }
            else -> {
                drawCircle(tint, radius = size.minDimension * .18f, center = Offset(size.width * .5f, size.height * .34f), style = stroke)
                drawArc(tint, startAngle = 200f, sweepAngle = 140f, useCenter = false, topLeft = Offset(size.width * .16f, size.height * .44f), size = androidx.compose.ui.geometry.Size(size.width * .68f, size.height * .48f), style = stroke)
            }
        }
    }
}

@Composable
fun Badge(text: String, background: Color, foreground: Color) {
    Text(
        text = text,
        color = foreground,
        fontSize = 11.sp,
        fontWeight = FontWeight.Medium,
        modifier = Modifier
            .clip(RoundedCornerShape(4.dp))
            .background(background)
            .padding(horizontal = 6.dp, vertical = 2.dp)
    )
}

@Composable
fun StatusBadge(status: String) {
    if (status == "Completed") Badge("Hoàn thành", Color(0xFFDCFCE7), Color(0xFF15803D))
    else Badge("Đang ra", Color(0xFFFEF3C7), Color(0xFFB45309))
}

@Composable
fun LoadingBox(modifier: Modifier = Modifier) {
    Box(modifier.fillMaxSize(), contentAlignment = Alignment.Center) { CircularProgressIndicator() }
}

@Composable
fun ErrorBox(message: String, modifier: Modifier = Modifier, onRetry: (() -> Unit)? = null) {
    Column(
        modifier = modifier.fillMaxSize().padding(24.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(message, color = MaterialTheme.colorScheme.error, textAlign = TextAlign.Center)
        if (onRetry != null) {
            Button(onClick = onRetry, modifier = Modifier.padding(top = 12.dp)) { Text("Thử lại") }
        }
    }
}
