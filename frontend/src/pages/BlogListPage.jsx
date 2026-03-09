import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { useSeo } from "@/hooks/useSeo";
import { Button } from "@/components/ui/button";

const BlogListPage = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useSeo({
    title: "Photography Journal | Shivi Pareek",
    description: "Stories behind black and white shoots, travel frames, and photography insights.",
  });

  const loadPosts = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await api.getBlogs();
      setPosts(data);
    } catch (err) {
      setError(err?.message || "Unable to load blog posts.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  return (
    <div className="content-wrap page-stack" data-testid="blog-list-page">
      <section className="section-spacing" data-testid="blog-list-header-section">
        <p className="eyebrow" data-testid="blog-list-eyebrow">Field Notes</p>
        <h1 className="page-title" data-testid="blog-list-title">Photography Journal</h1>
        <p className="body-text" data-testid="blog-list-description">
          Stories behind each frame — practical insights, travel notes, and visual essays.
        </p>
      </section>

      <section className="blog-grid section-spacing" data-testid="blog-list-grid-section">
        {loading ? <p className="loading-text" data-testid="blog-list-loading-text">Loading posts...</p> : null}

        {posts.map((post) => (
          <Link to={`/blog/${post.slug}`} className="blog-card" key={post.id} data-testid={`blog-list-card-${post.id}`}>
            <img src={post.cover_image} alt={`${post.title} cover`} loading="lazy" data-testid={`blog-list-cover-${post.id}`} />
            <div className="blog-content" data-testid={`blog-list-content-${post.id}`}>
              <p className="card-category" data-testid={`blog-list-category-${post.id}`}>{post.category}</p>
              <h2 className="blog-title" data-testid={`blog-list-post-title-${post.id}`}>{post.title}</h2>
              <p className="card-meta" data-testid={`blog-list-date-${post.id}`}>
                {new Date(post.published_at).toLocaleDateString()}
              </p>
              <p className="body-text" data-testid={`blog-list-excerpt-${post.id}`}>{post.excerpt}</p>
            </div>
          </Link>
        ))}

        {!loading && posts.length === 0 ? (
          <p className="body-text" data-testid="blog-list-empty-state">No blog posts found.</p>
        ) : null}

        {error ? (
          <div className="panel" data-testid="blog-list-error-panel">
            <p className="body-text" data-testid="blog-list-error-message">{error}</p>
            <Button onClick={loadPosts} data-testid="blog-list-retry-button">Retry</Button>
          </div>
        ) : null}
      </section>
    </div>
  );
};

export default BlogListPage;
