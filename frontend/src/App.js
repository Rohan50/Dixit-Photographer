import "@/App.css";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import MainLayout from "@/components/layout/MainLayout";
import HomePage from "@/pages/HomePage";
import GalleriesPage from "@/pages/GalleriesPage";
import GalleryDetailPage from "@/pages/GalleryDetailPage";
import BlogListPage from "@/pages/BlogListPage";
import BlogDetailPage from "@/pages/BlogDetailPage";
import AboutPage from "@/pages/AboutPage";
import BookingPage from "@/pages/BookingPage";

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={
              <MainLayout>
                <HomePage />
              </MainLayout>
            }
          />
          <Route
            path="/gallery"
            element={
              <MainLayout>
                <GalleriesPage />
              </MainLayout>
            }
          />
          <Route
            path="/gallery/:slug"
            element={
              <MainLayout>
                <GalleryDetailPage />
              </MainLayout>
            }
          />
          <Route
            path="/blog"
            element={
              <MainLayout>
                <BlogListPage />
              </MainLayout>
            }
          />
          <Route
            path="/blog/:slug"
            element={
              <MainLayout>
                <BlogDetailPage />
              </MainLayout>
            }
          />
          <Route
            path="/about"
            element={
              <MainLayout>
                <AboutPage />
              </MainLayout>
            }
          />
          <Route
            path="/booking"
            element={
              <MainLayout>
                <BookingPage />
              </MainLayout>
            }
          />
          <Route path="/admin" element={<Navigate to="/admin/index.html" replace />} />
          <Route path="/admin/login" element={<Navigate to="/admin/index.html" replace />} />
          <Route path="/admin/*" element={<Navigate to="/admin/index.html" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" />
    </ThemeProvider>
  );
}

export default App;
