const state = {
  adminConfig: null,
  galleries: [],
  blogs: [],
  enquiries: [],
};

const el = {
  loginSection: document.getElementById("loginSection"),
  dashboardSection: document.getElementById("dashboardSection"),
  loginForm: document.getElementById("loginForm"),
  logoutBtn: document.getElementById("logoutBtn"),
  message: document.getElementById("message"),
  summaryGalleries: document.getElementById("summaryGalleries"),
  summaryBlogs: document.getElementById("summaryBlogs"),
  summaryEnquiries: document.getElementById("summaryEnquiries"),
  galleryList: document.getElementById("galleryList"),
  blogList: document.getElementById("blogList"),
  enquiryList: document.getElementById("enquiryList"),
  galleryForm: document.getElementById("galleryForm"),
  blogForm: document.getElementById("blogForm"),
  enquiryForm: document.getElementById("enquiryForm"),
  galleryResetBtn: document.getElementById("galleryResetBtn"),
  blogResetBtn: document.getElementById("blogResetBtn"),
  enquiryResetBtn: document.getElementById("enquiryResetBtn"),
  downloadGalleriesBtn: document.getElementById("downloadGalleriesBtn"),
  downloadBlogsBtn: document.getElementById("downloadBlogsBtn"),
  downloadEnquiriesBtn: document.getElementById("downloadEnquiriesBtn"),
};

const DRAFT_KEYS = {
  galleries: "cms_draft_galleries",
  blogs: "cms_draft_blogs",
  enquiries: "cms_draft_enquiries",
};

const SESSION_KEY = "cms_admin_session";

const showMessage = (text, isError = false) => {
  el.message.classList.add("show");
  el.message.style.borderColor = isError ? "#d84b4b" : "#ddd";
  el.message.textContent = text;
};

const clearMessage = () => {
  el.message.classList.remove("show");
  el.message.textContent = "";
};

const jsonFetch = async (name) => {
  const response = await fetch(`/data/${name}.json`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Unable to load ${name}.json`);
  }
  return response.json();
};

const slugify = (value) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_-]+/g, "-");

const makeId = () => (window.crypto?.randomUUID ? window.crypto.randomUUID() : `${Date.now()}`);

const createSessionHash = async (email, password) => {
  const raw = `${email}:${password}:shivi-cms-static`;
  const data = new TextEncoder().encode(raw);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
};

const saveDraft = (name, data) => {
  localStorage.setItem(DRAFT_KEYS[name], JSON.stringify(data));
};

const getDraftOrDefault = (name, fallback) => {
  const raw = localStorage.getItem(DRAFT_KEYS[name]);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
};

const downloadJson = (filename, data) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
};

const renderSummary = () => {
  el.summaryGalleries.textContent = String(state.galleries.length);
  el.summaryBlogs.textContent = String(state.blogs.length);
  el.summaryEnquiries.textContent = String(state.enquiries.length);
};

const galleryFormToPayload = () => {
  const images = document
    .getElementById("galleryImages")
    .value.split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const title = document.getElementById("galleryTitle").value.trim();
  const id = document.getElementById("galleryId").value || makeId();
  const createdAt = state.galleries.find((item) => item.id === id)?.created_at || new Date().toISOString();

  return {
    id,
    slug: slugify(title),
    title,
    category: document.getElementById("galleryCategory").value.trim(),
    description: document.getElementById("galleryDescription").value.trim(),
    location: document.getElementById("galleryLocation").value.trim(),
    shoot_date: document.getElementById("galleryShootDate").value.trim(),
    cover_image: document.getElementById("galleryCoverImage").value.trim(),
    images,
    is_featured: document.getElementById("galleryFeatured").checked,
    photo_count: images.length,
    created_at: createdAt,
    updated_at: new Date().toISOString(),
  };
};

const blogFormToPayload = () => {
  const embeddedImages = document
    .getElementById("blogEmbeddedImages")
    .value.split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const title = document.getElementById("blogTitle").value.trim();
  const id = document.getElementById("blogId").value || makeId();
  const publishedAt = state.blogs.find((item) => item.id === id)?.published_at || new Date().toISOString();

  return {
    id,
    slug: slugify(title),
    title,
    category: document.getElementById("blogCategory").value.trim(),
    excerpt: document.getElementById("blogExcerpt").value.trim(),
    content: document.getElementById("blogContent").value.trim(),
    cover_image: document.getElementById("blogCoverImage").value.trim(),
    embedded_images: embeddedImages,
    is_featured: document.getElementById("blogFeatured").checked,
    published_at: publishedAt,
    updated_at: new Date().toISOString(),
  };
};

const enquiryFormToPayload = () => {
  const id = document.getElementById("enquiryId").value || makeId();
  const createdAt = state.enquiries.find((item) => item.id === id)?.created_at || new Date().toISOString();
  return {
    id,
    name: document.getElementById("enquiryName").value.trim(),
    email: document.getElementById("enquiryEmail").value.trim(),
    phone: document.getElementById("enquiryPhone").value.trim(),
    event_type: document.getElementById("enquiryEventType").value.trim(),
    event_date: document.getElementById("enquiryEventDate").value.trim(),
    location: document.getElementById("enquiryLocation").value.trim(),
    budget_range: document.getElementById("enquiryBudget").value.trim(),
    status: document.getElementById("enquiryStatus").value,
    message: document.getElementById("enquiryMessage").value.trim(),
    created_at: createdAt,
  };
};

const resetGalleryForm = () => {
  el.galleryForm.reset();
  document.getElementById("galleryId").value = "";
};

const resetBlogForm = () => {
  el.blogForm.reset();
  document.getElementById("blogId").value = "";
};

const resetEnquiryForm = () => {
  el.enquiryForm.reset();
  document.getElementById("enquiryId").value = "";
  document.getElementById("enquiryStatus").value = "new";
};

const renderGalleries = () => {
  el.galleryList.innerHTML = "";
  state.galleries
    .slice()
    .sort((a, b) => a.title.localeCompare(b.title))
    .forEach((gallery) => {
      const item = document.createElement("article");
      item.className = "item";
      item.setAttribute("data-testid", `vanilla-admin-gallery-item-${gallery.id}`);
      item.innerHTML = `
        <div class="item-top">
          <div>
            <h4>${gallery.title}</h4>
            <p>${gallery.category} · ${gallery.photo_count || (gallery.images || []).length} photos</p>
          </div>
          <div class="inline-actions">
            <button type="button" class="ghost-btn" data-action="edit">Edit</button>
            <button type="button" data-action="delete">Delete</button>
          </div>
        </div>
      `;

      item.querySelector('[data-action="edit"]').addEventListener("click", () => {
        document.getElementById("galleryId").value = gallery.id;
        document.getElementById("galleryTitle").value = gallery.title || "";
        document.getElementById("galleryCategory").value = gallery.category || "";
        document.getElementById("galleryDescription").value = gallery.description || "";
        document.getElementById("galleryLocation").value = gallery.location || "";
        document.getElementById("galleryShootDate").value = gallery.shoot_date || "";
        document.getElementById("galleryCoverImage").value = gallery.cover_image || "";
        document.getElementById("galleryImages").value = (gallery.images || []).join("\n");
        document.getElementById("galleryFeatured").checked = Boolean(gallery.is_featured);
      });

      item.querySelector('[data-action="delete"]').addEventListener("click", () => {
        if (!window.confirm(`Delete gallery: ${gallery.title}?`)) return;
        state.galleries = state.galleries.filter((entry) => entry.id !== gallery.id);
        saveDraft("galleries", state.galleries);
        renderSummary();
        renderGalleries();
        showMessage("Gallery updated in browser. Download galleries.json to save changes.");
      });

      el.galleryList.appendChild(item);
    });
};

const renderBlogs = () => {
  el.blogList.innerHTML = "";
  state.blogs
    .slice()
    .sort((a, b) => a.title.localeCompare(b.title))
    .forEach((blog) => {
      const item = document.createElement("article");
      item.className = "item";
      item.setAttribute("data-testid", `vanilla-admin-blog-item-${blog.id}`);
      item.innerHTML = `
        <div class="item-top">
          <div>
            <h4>${blog.title}</h4>
            <p>${blog.category} · ${new Date(blog.published_at).toLocaleDateString()}</p>
          </div>
          <div class="inline-actions">
            <button type="button" class="ghost-btn" data-action="edit">Edit</button>
            <button type="button" data-action="delete">Delete</button>
          </div>
        </div>
      `;

      item.querySelector('[data-action="edit"]').addEventListener("click", () => {
        document.getElementById("blogId").value = blog.id;
        document.getElementById("blogTitle").value = blog.title || "";
        document.getElementById("blogCategory").value = blog.category || "";
        document.getElementById("blogExcerpt").value = blog.excerpt || "";
        document.getElementById("blogContent").value = blog.content || "";
        document.getElementById("blogCoverImage").value = blog.cover_image || "";
        document.getElementById("blogEmbeddedImages").value = (blog.embedded_images || []).join("\n");
        document.getElementById("blogFeatured").checked = Boolean(blog.is_featured);
      });

      item.querySelector('[data-action="delete"]').addEventListener("click", () => {
        if (!window.confirm(`Delete blog: ${blog.title}?`)) return;
        state.blogs = state.blogs.filter((entry) => entry.id !== blog.id);
        saveDraft("blogs", state.blogs);
        renderSummary();
        renderBlogs();
        showMessage("Blog updated in browser. Download blogs.json to save changes.");
      });

      el.blogList.appendChild(item);
    });
};

const renderEnquiries = () => {
  el.enquiryList.innerHTML = "";
  if (!state.enquiries.length) {
    const empty = document.createElement("article");
    empty.className = "item";
    empty.innerHTML = "<p>No enquiries yet.</p>";
    el.enquiryList.appendChild(empty);
    return;
  }

  state.enquiries.forEach((enquiry) => {
    const item = document.createElement("article");
    item.className = "item";
    item.setAttribute("data-testid", `vanilla-admin-enquiry-item-${enquiry.id}`);
    item.innerHTML = `
      <div class="item-top">
        <div>
          <h4>${enquiry.name} · ${enquiry.event_type}</h4>
          <p>${enquiry.email} · ${enquiry.phone}</p>
          <p>${enquiry.event_date} · ${enquiry.location}</p>
          <p>Status: ${enquiry.status}</p>
        </div>
        <div class="inline-actions">
          <button type="button" class="ghost-btn" data-action="edit">Edit</button>
          <button type="button" data-action="delete">Delete</button>
        </div>
      </div>
      <p>Message: ${enquiry.message}</p>
    `;

    item.querySelector('[data-action="edit"]').addEventListener("click", () => {
      document.getElementById("enquiryId").value = enquiry.id;
      document.getElementById("enquiryName").value = enquiry.name || "";
      document.getElementById("enquiryEmail").value = enquiry.email || "";
      document.getElementById("enquiryPhone").value = enquiry.phone || "";
      document.getElementById("enquiryEventType").value = enquiry.event_type || "";
      document.getElementById("enquiryEventDate").value = enquiry.event_date || "";
      document.getElementById("enquiryLocation").value = enquiry.location || "";
      document.getElementById("enquiryBudget").value = enquiry.budget_range || "";
      document.getElementById("enquiryStatus").value = enquiry.status || "new";
      document.getElementById("enquiryMessage").value = enquiry.message || "";
    });

    item.querySelector('[data-action="delete"]').addEventListener("click", () => {
      if (!window.confirm(`Delete enquiry from ${enquiry.name}?`)) return;
      state.enquiries = state.enquiries.filter((entry) => entry.id !== enquiry.id);
      saveDraft("enquiries", state.enquiries);
      renderSummary();
      renderEnquiries();
      showMessage("Enquiry updated in browser. Download enquiries.json to save changes.");
    });

    el.enquiryList.appendChild(item);
  });
};

const openSection = (name) => {
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.section === name);
  });
  document.getElementById("galleriesPanel").classList.toggle("hidden", name !== "galleries");
  document.getElementById("blogsPanel").classList.toggle("hidden", name !== "blogs");
  document.getElementById("enquiriesPanel").classList.toggle("hidden", name !== "enquiries");
};

const loadData = async () => {
  const [adminConfig, galleries, blogs, enquiries] = await Promise.all([
    jsonFetch("admin"),
    jsonFetch("galleries"),
    jsonFetch("blogs"),
    jsonFetch("enquiries"),
  ]);

  state.adminConfig = adminConfig;
  state.galleries = getDraftOrDefault("galleries", galleries);
  state.blogs = getDraftOrDefault("blogs", blogs);
  state.enquiries = getDraftOrDefault("enquiries", enquiries);

  renderSummary();
  renderGalleries();
  renderBlogs();
  renderEnquiries();
};

const bootstrapDashboard = async () => {
  el.loginSection.classList.add("hidden");
  el.dashboardSection.classList.remove("hidden");
  await loadData();
};

const wireEvents = () => {
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", () => openSection(tab.dataset.section));
  });

  el.loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearMessage();
    try {
      const adminData = await jsonFetch("admin");
      const email = document.getElementById("adminEmail").value.trim().toLowerCase();
      const password = document.getElementById("adminPassword").value;
      const found = adminData.admins.find((admin) => admin.email.toLowerCase() === email && admin.password === password);

      if (!found) {
        throw new Error("Invalid admin email or password.");
      }

      const sessionHash = await createSessionHash(email, password);
      localStorage.setItem(
        SESSION_KEY,
        JSON.stringify({
          email,
          session_hash: sessionHash,
          created_at: new Date().toISOString(),
        }),
      );
      await bootstrapDashboard();
      showMessage("Logged in. Changes are kept in browser until you download JSON files.");
    } catch (error) {
      showMessage(error.message, true);
    }
  });

  el.galleryForm.addEventListener("submit", (event) => {
    event.preventDefault();
    clearMessage();
    const payload = galleryFormToPayload();
    const hasExisting = state.galleries.some((entry) => entry.id === payload.id);
    state.galleries = hasExisting
      ? state.galleries.map((entry) => (entry.id === payload.id ? payload : entry))
      : [payload, ...state.galleries];

    saveDraft("galleries", state.galleries);
    renderSummary();
    renderGalleries();
    resetGalleryForm();
    showMessage("Gallery updated in browser. Download galleries.json to save changes.");
  });

  el.blogForm.addEventListener("submit", (event) => {
    event.preventDefault();
    clearMessage();
    const payload = blogFormToPayload();
    const hasExisting = state.blogs.some((entry) => entry.id === payload.id);
    state.blogs = hasExisting
      ? state.blogs.map((entry) => (entry.id === payload.id ? payload : entry))
      : [payload, ...state.blogs];

    saveDraft("blogs", state.blogs);
    renderSummary();
    renderBlogs();
    resetBlogForm();
    showMessage("Blog updated in browser. Download blogs.json to save changes.");
  });

  el.enquiryForm.addEventListener("submit", (event) => {
    event.preventDefault();
    clearMessage();
    const payload = enquiryFormToPayload();
    const hasExisting = state.enquiries.some((entry) => entry.id === payload.id);
    state.enquiries = hasExisting
      ? state.enquiries.map((entry) => (entry.id === payload.id ? payload : entry))
      : [payload, ...state.enquiries];

    saveDraft("enquiries", state.enquiries);
    renderSummary();
    renderEnquiries();
    resetEnquiryForm();
    showMessage("Enquiry updated in browser. Download enquiries.json to save changes.");
  });

  el.galleryResetBtn.addEventListener("click", resetGalleryForm);
  el.blogResetBtn.addEventListener("click", resetBlogForm);
  el.enquiryResetBtn.addEventListener("click", resetEnquiryForm);

  el.downloadGalleriesBtn.addEventListener("click", () => downloadJson("galleries.json", state.galleries));
  el.downloadBlogsBtn.addEventListener("click", () => downloadJson("blogs.json", state.blogs));
  el.downloadEnquiriesBtn.addEventListener("click", () => downloadJson("enquiries.json", state.enquiries));

  el.logoutBtn.addEventListener("click", () => {
    localStorage.removeItem(SESSION_KEY);
    window.location.reload();
  });
};

const init = async () => {
  wireEvents();
  const sessionRaw = localStorage.getItem(SESSION_KEY);

  if (sessionRaw) {
    try {
      const session = JSON.parse(sessionRaw);
      const adminData = await jsonFetch("admin");
      const matchedAdmin = adminData.admins.find((admin) => admin.email.toLowerCase() === session.email?.toLowerCase());
      if (!matchedAdmin) {
        throw new Error("Saved admin session is invalid.");
      }

      const expectedHash = await createSessionHash(session.email.toLowerCase(), matchedAdmin.password);
      if (expectedHash !== session.session_hash) {
        throw new Error("Saved admin session is invalid.");
      }

      await bootstrapDashboard();
      showMessage("Session restored.");
      return;
    } catch (error) {
      localStorage.removeItem(SESSION_KEY);
      showMessage(error.message, true);
    }
  }
};

init();
