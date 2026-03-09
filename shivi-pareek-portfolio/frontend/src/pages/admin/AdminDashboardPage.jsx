import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { useSeo } from "@/hooks/useSeo";

const initialGalleryForm = {
  title: "",
  category: "",
  description: "",
  location: "",
  shoot_date: "",
  cover_image: "",
  images_text: "",
  is_featured: false,
};

const initialBlogForm = {
  title: "",
  category: "",
  excerpt: "",
  content: "",
  cover_image: "",
  embedded_images_text: "",
  is_featured: false,
};

const AdminDashboardPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("galleries");
  const [summary, setSummary] = useState(null);
  const [galleries, setGalleries] = useState([]);
  const [blogs, setBlogs] = useState([]);
  const [enquiries, setEnquiries] = useState([]);
  const [galleryForm, setGalleryForm] = useState(initialGalleryForm);
  const [blogForm, setBlogForm] = useState(initialBlogForm);
  const [editingGalleryId, setEditingGalleryId] = useState(null);
  const [editingBlogId, setEditingBlogId] = useState(null);

  useSeo({
    title: "Admin Dashboard | Shivi Pareek",
    description: "Manage galleries, blog content, and booking enquiries from one dashboard.",
  });

  const loadDashboard = async () => {
    try {
      const [summaryData, galleryData, blogData, enquiryData] = await Promise.all([
        api.getDashboardSummary(),
        api.getAdminGalleries(),
        api.getAdminBlogs(),
        api.getAdminEnquiries(),
      ]);
      setSummary(summaryData);
      setGalleries(galleryData);
      setBlogs(blogData);
      setEnquiries(enquiryData);
    } catch (error) {
      localStorage.removeItem("admin_token");
      toast.error("Session expired", { description: "Please login again." });
      navigate("/admin/login");
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const summaryCards = useMemo(() => {
    if (!summary) {
      return [];
    }
    return [
      { key: "galleries", label: "Galleries", value: summary.galleries },
      { key: "blog_posts", label: "Blog Posts", value: summary.blog_posts },
      { key: "enquiries", label: "Enquiries", value: summary.enquiries },
      { key: "pending_enquiries", label: "Pending", value: summary.pending_enquiries },
    ];
  }, [summary]);

  const logout = () => {
    localStorage.removeItem("admin_token");
    navigate("/admin/login");
  };

  const parseLines = (text) => text.split("\n").map((line) => line.trim()).filter(Boolean);

  const handleGallerySubmit = async (event) => {
    event.preventDefault();
    const payload = {
      title: galleryForm.title,
      category: galleryForm.category,
      description: galleryForm.description,
      location: galleryForm.location,
      shoot_date: galleryForm.shoot_date,
      cover_image: galleryForm.cover_image,
      images: parseLines(galleryForm.images_text),
      is_featured: galleryForm.is_featured,
    };

    try {
      if (editingGalleryId) {
        await api.updateGallery(editingGalleryId, payload);
        toast.success("Gallery updated successfully.");
      } else {
        await api.createGallery(payload);
        toast.success("Gallery created successfully.");
      }
      setGalleryForm(initialGalleryForm);
      setEditingGalleryId(null);
      await loadDashboard();
    } catch (error) {
      toast.error("Failed to save gallery.");
    }
  };

  const handleBlogSubmit = async (event) => {
    event.preventDefault();
    const payload = {
      title: blogForm.title,
      category: blogForm.category,
      excerpt: blogForm.excerpt,
      content: blogForm.content,
      cover_image: blogForm.cover_image,
      embedded_images: parseLines(blogForm.embedded_images_text),
      is_featured: blogForm.is_featured,
    };

    try {
      if (editingBlogId) {
        await api.updateBlog(editingBlogId, payload);
        toast.success("Blog post updated successfully.");
      } else {
        await api.createBlog(payload);
        toast.success("Blog post published successfully.");
      }
      setBlogForm(initialBlogForm);
      setEditingBlogId(null);
      await loadDashboard();
    } catch (error) {
      toast.error("Failed to save blog post.");
    }
  };

  return (
    <div className="admin-dashboard-shell" data-testid="admin-dashboard-page">
      <header className="admin-dashboard-header" data-testid="admin-dashboard-header">
        <div>
          <p className="eyebrow" data-testid="admin-dashboard-eyebrow">Content Management</p>
          <h1 className="page-title" data-testid="admin-dashboard-title">Admin Dashboard</h1>
        </div>
        <Button variant="outline" onClick={logout} data-testid="admin-logout-button">Logout</Button>
      </header>

      <section className="admin-summary-grid" data-testid="admin-summary-grid">
        {summaryCards.map((item) => (
          <article key={item.key} className="panel" data-testid={`admin-summary-card-${item.key}`}>
            <p className="card-category" data-testid={`admin-summary-label-${item.key}`}>{item.label}</p>
            <p className="summary-value" data-testid={`admin-summary-value-${item.key}`}>{item.value}</p>
          </article>
        ))}
      </section>

      <section className="admin-tab-row" data-testid="admin-tab-row">
        {[
          { key: "galleries", label: "Galleries" },
          { key: "blogs", label: "Blog" },
          { key: "enquiries", label: "Enquiries" },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={activeTab === tab.key ? "filter-chip active" : "filter-chip"}
            onClick={() => setActiveTab(tab.key)}
            data-testid={`admin-tab-${tab.key}`}
          >
            {tab.label}
          </button>
        ))}
      </section>

      {activeTab === "galleries" ? (
        <section className="admin-content-grid" data-testid="admin-galleries-section">
          <form className="panel admin-form" onSubmit={handleGallerySubmit} data-testid="admin-gallery-form">
            <h2 className="section-title" data-testid="admin-gallery-form-title">
              {editingGalleryId ? "Edit Gallery" : "Create Gallery"}
            </h2>

            <input
              value={galleryForm.title}
              onChange={(event) => setGalleryForm((prev) => ({ ...prev, title: event.target.value }))}
              placeholder="Title"
              required
              data-testid="admin-gallery-title-input"
            />
            <input
              value={galleryForm.category}
              onChange={(event) => setGalleryForm((prev) => ({ ...prev, category: event.target.value }))}
              placeholder="Category"
              required
              data-testid="admin-gallery-category-input"
            />
            <textarea
              value={galleryForm.description}
              onChange={(event) => setGalleryForm((prev) => ({ ...prev, description: event.target.value }))}
              placeholder="Description"
              rows={3}
              required
              data-testid="admin-gallery-description-input"
            />
            <input
              value={galleryForm.location}
              onChange={(event) => setGalleryForm((prev) => ({ ...prev, location: event.target.value }))}
              placeholder="Location"
              data-testid="admin-gallery-location-input"
            />
            <input
              value={galleryForm.shoot_date}
              onChange={(event) => setGalleryForm((prev) => ({ ...prev, shoot_date: event.target.value }))}
              placeholder="Shoot Date"
              data-testid="admin-gallery-shoot-date-input"
            />
            <input
              value={galleryForm.cover_image}
              onChange={(event) => setGalleryForm((prev) => ({ ...prev, cover_image: event.target.value }))}
              placeholder="Cover Image URL"
              required
              data-testid="admin-gallery-cover-image-input"
            />
            <textarea
              value={galleryForm.images_text}
              onChange={(event) => setGalleryForm((prev) => ({ ...prev, images_text: event.target.value }))}
              placeholder="Image URLs (one per line)"
              rows={4}
              required
              data-testid="admin-gallery-images-textarea"
            />

            <label className="checkbox-row" data-testid="admin-gallery-featured-checkbox-row">
              <input
                type="checkbox"
                checked={galleryForm.is_featured}
                onChange={(event) => setGalleryForm((prev) => ({ ...prev, is_featured: event.target.checked }))}
                data-testid="admin-gallery-featured-checkbox"
              />
              Featured gallery
            </label>

            <div className="inline-actions" data-testid="admin-gallery-form-actions">
              <Button type="submit" data-testid="admin-gallery-save-button">
                {editingGalleryId ? "Update Gallery" : "Create Gallery"}
              </Button>
              {editingGalleryId ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditingGalleryId(null);
                    setGalleryForm(initialGalleryForm);
                  }}
                  data-testid="admin-gallery-cancel-edit-button"
                >
                  Cancel
                </Button>
              ) : null}
            </div>
          </form>

          <div className="panel" data-testid="admin-gallery-list-panel">
            <h2 className="section-title" data-testid="admin-gallery-list-title">Existing Galleries</h2>
            <div className="admin-list" data-testid="admin-gallery-list">
              {galleries.map((gallery) => (
                <article className="admin-list-item" key={gallery.id} data-testid={`admin-gallery-item-${gallery.id}`}>
                  <div>
                    <p className="card-title" data-testid={`admin-gallery-item-title-${gallery.id}`}>{gallery.title}</p>
                    <p className="card-meta" data-testid={`admin-gallery-item-meta-${gallery.id}`}>
                      {gallery.category} · {gallery.photo_count} photos
                    </p>
                  </div>

                  <div className="inline-actions" data-testid={`admin-gallery-item-actions-${gallery.id}`}>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setEditingGalleryId(gallery.id);
                        setGalleryForm({
                          title: gallery.title,
                          category: gallery.category,
                          description: gallery.description,
                          location: gallery.location || "",
                          shoot_date: gallery.shoot_date || "",
                          cover_image: gallery.cover_image,
                          images_text: gallery.images.join("\n"),
                          is_featured: gallery.is_featured,
                        });
                      }}
                      data-testid={`admin-gallery-edit-button-${gallery.id}`}
                    >
                      Edit
                    </Button>

                    <Button
                      type="button"
                      variant="destructive"
                      onClick={async () => {
                        await api.deleteGallery(gallery.id);
                        toast.success("Gallery deleted.");
                        await loadDashboard();
                      }}
                      data-testid={`admin-gallery-delete-button-${gallery.id}`}
                    >
                      Delete
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {activeTab === "blogs" ? (
        <section className="admin-content-grid" data-testid="admin-blogs-section">
          <form className="panel admin-form" onSubmit={handleBlogSubmit} data-testid="admin-blog-form">
            <h2 className="section-title" data-testid="admin-blog-form-title">
              {editingBlogId ? "Edit Blog Post" : "Publish Blog Post"}
            </h2>

            <input
              value={blogForm.title}
              onChange={(event) => setBlogForm((prev) => ({ ...prev, title: event.target.value }))}
              placeholder="Title"
              required
              data-testid="admin-blog-title-input"
            />
            <input
              value={blogForm.category}
              onChange={(event) => setBlogForm((prev) => ({ ...prev, category: event.target.value }))}
              placeholder="Category"
              required
              data-testid="admin-blog-category-input"
            />
            <textarea
              value={blogForm.excerpt}
              onChange={(event) => setBlogForm((prev) => ({ ...prev, excerpt: event.target.value }))}
              placeholder="Excerpt"
              rows={2}
              required
              data-testid="admin-blog-excerpt-input"
            />
            <textarea
              value={blogForm.content}
              onChange={(event) => setBlogForm((prev) => ({ ...prev, content: event.target.value }))}
              placeholder="Content"
              rows={6}
              required
              data-testid="admin-blog-content-input"
            />
            <input
              value={blogForm.cover_image}
              onChange={(event) => setBlogForm((prev) => ({ ...prev, cover_image: event.target.value }))}
              placeholder="Cover Image URL"
              required
              data-testid="admin-blog-cover-image-input"
            />
            <textarea
              value={blogForm.embedded_images_text}
              onChange={(event) => setBlogForm((prev) => ({ ...prev, embedded_images_text: event.target.value }))}
              placeholder="Embedded image URLs (one per line)"
              rows={4}
              data-testid="admin-blog-embedded-images-input"
            />

            <label className="checkbox-row" data-testid="admin-blog-featured-checkbox-row">
              <input
                type="checkbox"
                checked={blogForm.is_featured}
                onChange={(event) => setBlogForm((prev) => ({ ...prev, is_featured: event.target.checked }))}
                data-testid="admin-blog-featured-checkbox"
              />
              Feature on homepage
            </label>

            <div className="inline-actions" data-testid="admin-blog-form-actions">
              <Button type="submit" data-testid="admin-blog-save-button">
                {editingBlogId ? "Update Blog" : "Publish Blog"}
              </Button>
              {editingBlogId ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditingBlogId(null);
                    setBlogForm(initialBlogForm);
                  }}
                  data-testid="admin-blog-cancel-edit-button"
                >
                  Cancel
                </Button>
              ) : null}
            </div>
          </form>

          <div className="panel" data-testid="admin-blog-list-panel">
            <h2 className="section-title" data-testid="admin-blog-list-title">Published Posts</h2>
            <div className="admin-list" data-testid="admin-blog-list">
              {blogs.map((blog) => (
                <article className="admin-list-item" key={blog.id} data-testid={`admin-blog-item-${blog.id}`}>
                  <div>
                    <p className="card-title" data-testid={`admin-blog-item-title-${blog.id}`}>{blog.title}</p>
                    <p className="card-meta" data-testid={`admin-blog-item-meta-${blog.id}`}>
                      {blog.category} · {new Date(blog.published_at).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="inline-actions" data-testid={`admin-blog-item-actions-${blog.id}`}>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setEditingBlogId(blog.id);
                        setBlogForm({
                          title: blog.title,
                          category: blog.category,
                          excerpt: blog.excerpt,
                          content: blog.content,
                          cover_image: blog.cover_image,
                          embedded_images_text: blog.embedded_images.join("\n"),
                          is_featured: blog.is_featured,
                        });
                      }}
                      data-testid={`admin-blog-edit-button-${blog.id}`}
                    >
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={async () => {
                        await api.deleteBlog(blog.id);
                        toast.success("Blog post deleted.");
                        await loadDashboard();
                      }}
                      data-testid={`admin-blog-delete-button-${blog.id}`}
                    >
                      Delete
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {activeTab === "enquiries" ? (
        <section className="panel" data-testid="admin-enquiries-section">
          <h2 className="section-title" data-testid="admin-enquiries-title">Booking Enquiries</h2>
          <div className="admin-list" data-testid="admin-enquiries-list">
            {enquiries.map((enquiry) => (
              <article className="admin-list-item vertical" key={enquiry.id} data-testid={`admin-enquiry-item-${enquiry.id}`}>
                <div className="enquiry-grid" data-testid={`admin-enquiry-info-${enquiry.id}`}>
                  <p data-testid={`admin-enquiry-name-${enquiry.id}`}><strong>Name:</strong> {enquiry.name}</p>
                  <p data-testid={`admin-enquiry-email-${enquiry.id}`}><strong>Email:</strong> {enquiry.email}</p>
                  <p data-testid={`admin-enquiry-phone-${enquiry.id}`}><strong>Phone:</strong> {enquiry.phone}</p>
                  <p data-testid={`admin-enquiry-event-type-${enquiry.id}`}><strong>Event:</strong> {enquiry.event_type}</p>
                  <p data-testid={`admin-enquiry-event-date-${enquiry.id}`}><strong>Date:</strong> {enquiry.event_date}</p>
                  <p data-testid={`admin-enquiry-location-${enquiry.id}`}><strong>Location:</strong> {enquiry.location}</p>
                  <p data-testid={`admin-enquiry-budget-${enquiry.id}`}><strong>Budget:</strong> {enquiry.budget_range}</p>
                  <p data-testid={`admin-enquiry-status-${enquiry.id}`}><strong>Status:</strong> {enquiry.status}</p>
                </div>
                <p className="body-text" data-testid={`admin-enquiry-message-${enquiry.id}`}>{enquiry.message}</p>

                <div className="inline-actions" data-testid={`admin-enquiry-actions-${enquiry.id}`}>
                  {enquiry.status !== "contacted" ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={async () => {
                        await api.markEnquiryContacted(enquiry.id);
                        toast.success("Enquiry marked as contacted.");
                        await loadDashboard();
                      }}
                      data-testid={`admin-enquiry-mark-contacted-button-${enquiry.id}`}
                    >
                      Mark as Contacted
                    </Button>
                  ) : null}

                  <Button
                    type="button"
                    variant="destructive"
                    onClick={async () => {
                      await api.deleteEnquiry(enquiry.id);
                      toast.success("Enquiry deleted.");
                      await loadDashboard();
                    }}
                    data-testid={`admin-enquiry-delete-button-${enquiry.id}`}
                  >
                    Delete
                  </Button>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
};

export default AdminDashboardPage;
