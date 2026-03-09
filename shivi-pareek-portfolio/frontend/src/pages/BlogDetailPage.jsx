import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "@/lib/api";
import { useSeo } from "@/hooks/useSeo";

const BlogDetailPage = () => {
  const { slug } = useParams();
  const [post, setPost] = useState(null);

  useSeo({
    title: `${post?.title || "Blog"} | Shivi Pareek`,
    description: post?.excerpt || "Photography journal entry from Shivi Pareek.",
  });

  useEffect(() => {
    const loadPost = async () => {
      const data = await api.getBlogBySlug(slug);
      setPost(data);
    };
    loadPost();
  }, [slug]);

  const paragraphs = useMemo(() => {
    if (!post?.content) {
      return [];
    }
    return post.content.split("\n\n");
  }, [post]);

  if (!post) {
    return (
      <div className="content-wrap section-spacing" data-testid="blog-detail-loading-state">
        <p className="loading-text" data-testid="blog-detail-loading-text">Loading article...</p>
      </div>
    );
  }

  return (
    <article className="content-wrap page-stack" data-testid="blog-detail-page">
      <header className="section-spacing" data-testid="blog-detail-header">
        <p className="eyebrow" data-testid="blog-detail-category">{post.category}</p>
        <h1 className="page-title" data-testid="blog-detail-title">{post.title}</h1>
        <p className="card-meta" data-testid="blog-detail-date">
          {new Date(post.published_at).toLocaleDateString()}
        </p>
      </header>

      <img
        src={post.cover_image}
        alt={`${post.title} hero`}
        className="detail-hero-image"
        loading="eager"
        data-testid="blog-detail-hero-image"
      />

      <section className="detail-content section-spacing" data-testid="blog-detail-content-section">
        {paragraphs.map((paragraph, index) => (
          <p className="body-text" key={`${post.id}-paragraph-${index}`} data-testid={`blog-detail-paragraph-${index}`}>
            {paragraph}
          </p>
        ))}

        {post.embedded_images?.map((image, index) => (
          <img
            key={`${post.id}-image-${index}`}
            src={image}
            alt={`${post.title} embedded ${index + 1}`}
            className="embedded-image"
            loading="lazy"
            data-testid={`blog-detail-embedded-image-${index}`}
          />
        ))}

        <blockquote className="feature-quote" data-testid="blog-detail-quote">
          “Photography is the quiet space where memory learns to breathe.”
        </blockquote>
      </section>
    </article>
  );
};

export default BlogDetailPage;
