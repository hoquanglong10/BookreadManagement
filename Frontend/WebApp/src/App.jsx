import { useEffect } from "react";
import { BrowserRouter, Link, Navigate, Outlet, Route, Routes, useNavigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import AdminLayout from "./layouts/AdminLayout.jsx";
import AdminCustomersPage from "./pages/AdminCustomersPage.jsx";
import AdminDashboardPage from "./pages/AdminDashboardPage.jsx";
import AdminGenresPage from "./pages/AdminGenresPage.jsx";
import AdminStoriesPage from "./pages/AdminStoriesPage.jsx";
import AuthPage from "./pages/AuthPage.jsx";
import HomePage from "./pages/HomePage.jsx";
import NotFoundPage from "./pages/NotFoundPage.jsx";
import ReaderPage from "./pages/ReaderPage.jsx";
import ReadingHistoryPage from "./pages/ReadingHistoryPage.jsx";
import StoryPage from "./pages/StoryPage.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import SiteHeader from "./components/SiteHeader.jsx";

function PublicLayout() {
  return <><SiteHeader /><main className="page-frame"><Outlet /></main><footer className="site-footer"><div className="page-frame site-footer__inner"><Link className="brand brand--footer" to="/"><span className="brand__name">Đọc<span>Truyện</span></span></Link><span>Thư viện để mỗi câu chuyện tìm được người đọc của mình.</span><Link to="/">Về trang khám phá ↑</Link></div></footer></>;
}

function UnauthorizedRedirect() {
  const navigate = useNavigate();
  useEffect(() => {
    const redirect = () => navigate("/account", { replace: true, state: { expired: true } });
    window.addEventListener("bookread:unauthorized", redirect);
    return () => window.removeEventListener("bookread:unauthorized", redirect);
  }, [navigate]);
  return null;
}

function AppRoutes() {
  return <>
    <UnauthorizedRedirect />
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<HomePage />} />
        <Route path="history" element={<ReadingHistoryPage />} />
        <Route path="story/:id" element={<StoryPage />} />
        <Route path="account" element={<AuthPage />} />
      </Route>
      <Route path="read/:storyId/:chapterNumber" element={<ReaderPage />} />
      <Route path="admin" element={<ProtectedRoute role="Admin"><AdminLayout /></ProtectedRoute>}>
        <Route index element={<AdminDashboardPage />} />
        <Route path="stories" element={<AdminStoriesPage />} />
        <Route path="genres" element={<AdminGenresPage />} />
        <Route path="customers" element={<AdminCustomersPage />} />
      </Route>
      <Route path="404" element={<NotFoundPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  </>;
}

export default function App() {
  return <BrowserRouter basename="/app"><AuthProvider><AppRoutes /></AuthProvider></BrowserRouter>;
}
