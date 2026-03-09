const DATA_BASE = "/data";

const loadJson = async (filename) => {
  const response = await fetch(`${DATA_BASE}/${filename}.json`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Unable to load ${filename}.json`);
  }

  return response.json();
};

export const api = {
  getHomeData: async () => {
    const galleries = await loadJson("galleries");
    const blogs = await loadJson("blogs");
    return {
      featured_galleries: galleries.filter((gallery) => gallery.is_featured).slice(0, 6),
      latest_posts: blogs
        .sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime())
        .slice(0, 3),
    };
  },
  getAboutData: async () => {
    const adminConfig = await loadJson("admin");
    return adminConfig.profile;
  },
  getGalleries: async (category = "") => {
    const data = await loadJson("galleries");
    if (!category) {
      return data;
    }
    return data.filter((gallery) => gallery.category === category);
  },
  getGalleryBySlug: async (slug) => {
    const galleries = await loadJson("galleries");
    const gallery = galleries.find((item) => item.slug === slug);
    if (!gallery) {
      throw new Error("Gallery not found");
    }
    return gallery;
  },
  getBlogs: async () => {
    return loadJson("blogs");
  },
  getBlogBySlug: async (slug) => {
    const blogs = await loadJson("blogs");
    const blog = blogs.find((item) => item.slug === slug);
    if (!blog) {
      throw new Error("Blog post not found");
    }
    return blog;
  },
  submitEnquiry: async (payload) => {
    const enquiry = {
      ...payload,
      id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`,
      status: "new",
      created_at: new Date().toISOString(),
    };

    const draftEnquiries = JSON.parse(localStorage.getItem("cms_draft_enquiries") || "[]");
    draftEnquiries.unshift(enquiry);
    localStorage.setItem("cms_draft_enquiries", JSON.stringify(draftEnquiries));
    return { enquiry, email_sent: false, stored_in_github: false };
  },
  adminLogin: async () => {
    throw new Error("Use /admin/index.html for static CMS admin login.");
  },
  getDashboardSummary: async () => {
    throw new Error("Use /admin/index.html for static CMS admin dashboard.");
  },
  getAdminGalleries: async () => {
    throw new Error("Use /admin/index.html for static CMS admin dashboard.");
  },
  createGallery: async () => {
    throw new Error("Use /admin/index.html for static CMS admin dashboard.");
  },
  updateGallery: async () => {
    throw new Error("Use /admin/index.html for static CMS admin dashboard.");
  },
  deleteGallery: async () => {
    throw new Error("Use /admin/index.html for static CMS admin dashboard.");
  },
  getAdminBlogs: async () => {
    throw new Error("Use /admin/index.html for static CMS admin dashboard.");
  },
  createBlog: async () => {
    throw new Error("Use /admin/index.html for static CMS admin dashboard.");
  },
  updateBlog: async () => {
    throw new Error("Use /admin/index.html for static CMS admin dashboard.");
  },
  deleteBlog: async () => {
    throw new Error("Use /admin/index.html for static CMS admin dashboard.");
  },
  getAdminEnquiries: async () => {
    throw new Error("Use /admin/index.html for static CMS admin dashboard.");
  },
  markEnquiryContacted: async () => {
    throw new Error("Use /admin/index.html for static CMS admin dashboard.");
  },
  deleteEnquiry: async () => {
    throw new Error("Use /admin/index.html for static CMS admin dashboard.");
  },
  parseError: (_error) => {
    try {
      return "Something went wrong.";
    } catch {
      return "Something went wrong.";
    }
  },
};
