package com.huflit.quanlydoctruyen.ui

import androidx.compose.runtime.Composable
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.huflit.quanlydoctruyen.ui.screens.HomeScreen
import com.huflit.quanlydoctruyen.ui.screens.LoginScreen
import com.huflit.quanlydoctruyen.ui.screens.ReadChapterScreen
import com.huflit.quanlydoctruyen.ui.screens.ProfileScreen
import com.huflit.quanlydoctruyen.ui.screens.RegisterScreen
import com.huflit.quanlydoctruyen.ui.screens.StoryDetailScreen
import com.huflit.quanlydoctruyen.ui.screens.LibraryScreen
import com.huflit.quanlydoctruyen.data.SessionManager

private const val READ_ROUTE = "story/{id}/chapter/{number}"

@Composable
fun AppNavigation() {
    val nav = rememberNavController()
    fun goToRoot(route: String) {
        nav.navigate(route) {
            popUpTo("home") { inclusive = false }
            launchSingleTop = true
        }
    }

    NavHost(nav, startDestination = "home") {
        composable("home") {
            HomeScreen(
                onOpenStory = { id -> nav.navigate("story/$id") },
                onLogin = { nav.navigate("login") },
                onProfile = { if (SessionManager.user != null) goToRoot("profile") else nav.navigate("login") },
                onLibrary = { goToRoot("library") }
            )
        }

        composable("library") {
            LibraryScreen(
                onOpenStory = { id -> nav.navigate("story/$id") },
                onRead = { id, number -> nav.navigate("story/$id/chapter/$number") },
                onHome = { goToRoot("home") },
                onProfile = { if (SessionManager.user != null) goToRoot("profile") else nav.navigate("login") },
                onLogin = { nav.navigate("login") }
            )
        }

        composable("story/{id}", arguments = listOf(navArgument("id") { type = NavType.IntType })) { entry ->
            val id = entry.arguments?.getInt("id") ?: 0
            StoryDetailScreen(
                storyId = id,
                onRead = { number -> nav.navigate("story/$id/chapter/$number") },
                onBack = { nav.popBackStack() },
                onLogin = { nav.navigate("login") },
                onPlans = { if (SessionManager.user != null) nav.navigate("profile") else nav.navigate("login") }
            )
        }

        composable(
            READ_ROUTE,
            arguments = listOf(
                navArgument("id") { type = NavType.IntType },
                navArgument("number") { type = NavType.IntType }
            )
        ) { entry ->
            val id = entry.arguments?.getInt("id") ?: 0
            ReadChapterScreen(
                storyId = id,
                number = entry.arguments?.getInt("number") ?: 1,
                // Chuyển chương: thay màn hình đọc hiện tại, bấm Quay lại sẽ về mục lục
                onGoTo = { n ->
                    nav.navigate("story/$id/chapter/$n") {
                        popUpTo(READ_ROUTE) { inclusive = true }
                    }
                },
                onBack = { nav.popBackStack() },
                onPlans = { if (SessionManager.user != null) nav.navigate("profile") else nav.navigate("login") },
                onLogin = { nav.navigate("login") }
            )
        }

        composable("login") {
            LoginScreen(
                onSuccess = { nav.popBackStack() },
                onRegister = { nav.navigate("register") },
                onBack = { nav.popBackStack() }
            )
        }

        composable("register") {
            RegisterScreen(
                onSuccess = { nav.popBackStack("login", inclusive = false) },
                onBack = { nav.popBackStack() }
            )
        }

        composable("profile") {
            ProfileScreen(
                onBack = { nav.popBackStack() },
                onHome = { goToRoot("home") },
                onLibrary = { goToRoot("library") }
            )
        }
    }
}
