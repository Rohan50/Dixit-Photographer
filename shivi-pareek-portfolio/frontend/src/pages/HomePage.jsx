import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { useSeo } from "@/hooks/useSeo";

const HomePage = () => {
  const [loading, setLoading] = useState(true);
  const [homeData, setHomeData] = useState({ featured_galleries: [], latest_posts: [] });
  const [about, setAbout] = useState(null);
  const [error, setError] = useState("");

  useSeo({
    title: "Shivi Pareek | Editorial Black & White Photography",
    description: "Premium black & white photography portfolio featuring wedding, portrait, travel and editorial visual stories.",
  });

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      const [home, aboutData] = await Promise.all([api.getHomeData(), api.getAboutData()]);
      setHomeData(home);
      setAbout(aboutData);
    } catch (err) {
      setError(err?.message || "Unable to load portfolio content.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const heroImage = homeData.featured_galleries?.[0]?.cover_image;

  return (
    <div className="page-stack" data-testid="home-page">
      <section className="hero-section" data-testid="home-hero-section">
        <div className="hero-image-wrap" data-testid="home-hero-image-wrapper">
          <img
            src={heroImage || "https://images.unsplash.com/photo-1718123793344-060675cd9eef?auto=format&fit=crop&w=1600&q=80"}
            alt="Editorial black and white hero photograph"
            className="hero-image"
            loading="eager"
            data-testid="home-hero-image"
          />
          <div className="hero-overlay" data-testid="home-hero-overlay" />
        </div>

        <div className="content-wrap hero-content" data-testid="home-hero-content">
          <p className="eyebrow" data-testid="home-hero-eyebrow">Editorial Monochrome Photography</p>
          <h1 className="display-title" data-testid="home-hero-title">Capturing timeless moments through light and emotion.</h1>
          <p className="hero-description" data-testid="home-hero-description">
            A curated visual narrative of weddings, portraits, travel, and poetic urban frames.
          </p>

          <div className="hero-actions" data-testid="home-hero-actions">
            <Button asChild data-testid="home-view-galleries-button">
              <Link to="/gallery">View Galleries</Link>
            </Button>
            <Button variant="outline" asChild data-testid="home-book-session-button">
              <Link to="/booking">Book a Session</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="content-wrap section-spacing" data-testid="home-featured-galleries-section">
        <div className="section-head" data-testid="home-featured-galleries-header">
          <h2 className="section-title" data-testid="home-featured-galleries-title">Featured Galleries</h2>
          <Link to="/gallery" className="text-link" data-testid="home-featured-galleries-link">
            Explore all <ArrowRight size={16} />
          </Link>
        </div>

        <div className="gallery-grid" data-testid="home-featured-galleries-grid">
          {homeData.featured_galleries.map((gallery) => (
            <Link
              key={gallery.id}
              to={`/gallery/${gallery.slug}`}
              className="image-card"
              data-testid={`home-featured-gallery-card-${gallery.id}`}
            >
              <img src={gallery.cover_image} alt={`${gallery.title} cover`} loading="lazy" data-testid={`home-featured-gallery-image-${gallery.id}`} />
              <div className="card-overlay" data-testid={`home-featured-gallery-overlay-${gallery.id}`}>
                <p className="card-category" data-testid={`home-featured-gallery-category-${gallery.id}`}>{gallery.category}</p>
                <p className="card-title" data-testid={`home-featured-gallery-title-${gallery.id}`}>{gallery.title}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="content-wrap section-spacing split-section" data-testid="home-about-preview-section">
        <div className="split-image" data-testid="home-about-preview-image-wrapper">
          <img
            src={about?.portrait_image}
            alt="Portrait of photographer Shivi Pareek"
            loading="lazy"
            data-testid="home-about-preview-image"
          />
        </div>
        <div className="split-content" data-testid="home-about-preview-content">
          <h2 className="section-title" data-testid="home-about-preview-title">About the Photographer</h2>
          <p className="body-text" data-testid="home-about-preview-text">
            {about?.story || "Building visual stories with cinematic black and white aesthetics."}
          </p>
          <Button asChild variant="outline" data-testid="home-read-full-story-button">
            <Link to="/about">Read Full Story</Link>
          </Button>
        </div>
      </section>

      <section className="content-wrap section-spacing" data-testid="home-latest-blog-section">
        <div className="section-head" data-testid="home-latest-blog-header">
          <h2 className="section-title" data-testid="home-latest-blog-title">Latest Blog Posts</h2>
          <Link to="/blog" className="text-link" data-testid="home-latest-blog-link">
            Read journal <ArrowRight size={16} />
          </Link>
        </div>

        <div className="blog-grid" data-testid="home-latest-blog-grid">
          {homeData.latest_posts.map((post) => (
            <Link to={`/blog/${post.slug}`} className="blog-card" key={post.id} data-testid={`home-blog-card-${post.id}`}>
              <img src={post.cover_image} alt={`${post.title} cover`} loading="lazy" data-testid={`home-blog-cover-image-${post.id}`} />
              <div className="blog-content" data-testid={`home-blog-content-${post.id}`}>
                <p className="card-category" data-testid={`home-blog-category-${post.id}`}>{post.category}</p>
                <h3 className="blog-title" data-testid={`home-blog-title-${post.id}`}>{post.title}</h3>
                <p className="body-text" data-testid={`home-blog-excerpt-${post.id}`}>{post.excerpt}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="content-wrap cta-strip" data-testid="home-booking-cta-section">
        <h2 className="section-title" data-testid="home-booking-cta-title">Let’s create something beautiful together.</h2>
        <Button asChild data-testid="home-booking-cta-button">
          <Link to="/booking">Book a Session</Link>
        </Button>
      </section>

      {loading ? (
        <p className="loading-text content-wrap" data-testid="home-loading-text">Loading visual stories...</p>
      ) : null}

      {error ? (
        <div className="content-wrap panel" data-testid="home-error-panel">
          <p className="body-text" data-testid="home-error-message">{error}</p>
          <Button onClick={loadData} data-testid="home-retry-button">Retry</Button>
        </div>
      ) : null}
    </div>
  );
};

export default HomePage;
