import axios from "axios";

const API_BASE = `${process.env.REACT_APP_BACKEND_URL}/api`;

const publicApi = axios.create({
  baseURL: API_BASE,
});

const adminApi = axios.create({
  baseURL: API_BASE,
});

adminApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("admin_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const parseError = (error) => {
  return error?.response?.data?.detail || "Something went wrong. Please try again.";
};

export const api = {
  getHomeData: async () => {
    const { data } = await publicApi.get("/public/home");
    return data;
  },
  getAboutData: async () => {
    const { data } = await publicApi.get("/public/about");
    return data;
  },
  getGalleries: async (category = "") => {
    const { data } = await publicApi.get("/public/galleries", {
      params: category ? { category } : {},
    });
    return data;
  },
  getGalleryBySlug: async (slug) => {
    const { data } = await publicApi.get(`/public/galleries/${slug}`);
    return data;
  },
  getBlogs: async () => {
    const { data } = await publicApi.get("/public/blogs");
    return data;
  },
  getBlogBySlug: async (slug) => {
    const { data } = await publicApi.get(`/public/blogs/${slug}`);
    return data;
  },
  submitEnquiry: async (payload) => {
    const { data } = await publicApi.post("/public/enquiries", payload);
    return data;
  },
  adminLogin: async (payload) => {
    try {
      const { data } = await publicApi.post("/admin/login", payload);
      return data;
    } catch (error) {
      throw new Error(parseError(error));
    }
  },
  getDashboardSummary: async () => {
    const { data } = await adminApi.get("/admin/dashboard-summary");
    return data;
  },
  getAdminGalleries: async () => {
    const { data } = await adminApi.get("/admin/galleries");
    return data;
  },
  createGallery: async (payload) => {
    const { data } = await adminApi.post("/admin/galleries", payload);
    return data;
  },
  updateGallery: async (galleryId, payload) => {
    const { data } = await adminApi.put(`/admin/galleries/${galleryId}`, payload);
    return data;
  },
  deleteGallery: async (galleryId) => {
    const { data } = await adminApi.delete(`/admin/galleries/${galleryId}`);
    return data;
  },
  getAdminBlogs: async () => {
    const { data } = await adminApi.get("/admin/blogs");
    return data;
  },
  createBlog: async (payload) => {
    const { data } = await adminApi.post("/admin/blogs", payload);
    return data;
  },
  updateBlog: async (blogId, payload) => {
    const { data } = await adminApi.put(`/admin/blogs/${blogId}`, payload);
    return data;
  },
  deleteBlog: async (blogId) => {
    const { data } = await adminApi.delete(`/admin/blogs/${blogId}`);
    return data;
  },
  getAdminEnquiries: async () => {
    const { data } = await adminApi.get("/admin/enquiries");
    return data;
  },
  markEnquiryContacted: async (enquiryId) => {
    const { data } = await adminApi.patch(`/admin/enquiries/${enquiryId}/contacted`);
    return data;
  },
  deleteEnquiry: async (enquiryId) => {
    const { data } = await adminApi.delete(`/admin/enquiries/${enquiryId}`);
    return data;
  },
};
