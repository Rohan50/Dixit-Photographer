import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { useSeo } from "@/hooks/useSeo";

const GalleryDetailPage = () => {
  const { slug } = useParams();
  const [gallery, setGallery] = useState(null);
  const [activeIndex, setActiveIndex] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useSeo({
    title: `${gallery?.title || "Gallery"} | Shivi Pareek`,
    description: gallery?.description || "A high-resolution monochrome gallery by Shivi Pareek.",
  });

  const loadGallery = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const item = await api.getGalleryBySlug(slug);
      setGallery(item);
    } catch (err) {
      setError(err?.message || "Unable to load gallery.");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    loadGallery();
  }, [loadGallery]);

  useEffect(() => {
    if (activeIndex === null) {
      return undefined;
    }

    const handler = (event) => {
      if (!gallery) return;

      if (event.key === "Escape") {
        setActiveIndex(null);
      }
      if (event.key === "ArrowRight") {
        setActiveIndex((prev) => (prev + 1) % gallery.images.length);
      }
      if (event.key === "ArrowLeft") {
        setActiveIndex((prev) => (prev - 1 + gallery.images.length) % gallery.images.length);
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [activeIndex, gallery]);

  const openLightbox = (index) => setActiveIndex(index);
  const closeLightbox = () => setActiveIndex(null);

  const showNext = () => {
    if (!gallery) return;
    setActiveIndex((prev) => (prev + 1) % gallery.images.length);
  };

  const showPrevious = () => {
    if (!gallery) return;
    setActiveIndex((prev) => (prev - 1 + gallery.images.length) % gallery.images.length);
  };

  if (loading) {
    return (
      <div className="content-wrap section-spacing" data-testid="gallery-detail-loading-state">
        <p className="loading-text" data-testid="gallery-detail-loading-text">Loading gallery...</p>
      </div>
    );
  }

  if (!gallery || error) {
    return (
      <div className="content-wrap section-spacing" data-testid="gallery-detail-error-state">
        <div className="panel" data-testid="gallery-detail-error-panel">
          <p className="body-text" data-testid="gallery-detail-error-message">{error || "Gallery unavailable."}</p>
          <Button onClick={loadGallery} data-testid="gallery-detail-retry-button">Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="content-wrap page-stack" data-testid="gallery-detail-page">
      <section className="section-spacing" data-testid="gallery-detail-header-section">
        <p className="eyebrow" data-testid="gallery-detail-category">{gallery.category}</p>
        <h1 className="page-title" data-testid="gallery-detail-title">{gallery.title}</h1>
        <p className="body-text" data-testid="gallery-detail-description">{gallery.description}</p>
        <p className="card-meta" data-testid="gallery-detail-meta">
          {gallery.shoot_date} {gallery.location ? `| ${gallery.location}` : ""}
        </p>
      </section>

      <section className="masonry-grid section-spacing" data-testid="gallery-detail-masonry-grid">
        {gallery.images.map((image, index) => (
          <button
            key={image}
            type="button"
            className="masonry-item"
            onClick={() => openLightbox(index)}
            data-testid={`gallery-detail-image-button-${index}`}
          >
            <img src={image} alt={`${gallery.title} photograph ${index + 1}`} loading="lazy" data-testid={`gallery-detail-image-${index}`} />
          </button>
        ))}
      </section>

      {activeIndex !== null ? (
        <div className="lightbox" data-testid="gallery-detail-lightbox">
          <button className="lightbox-close" onClick={closeLightbox} data-testid="gallery-detail-lightbox-close-button">
            <X size={24} />
          </button>

          <button className="lightbox-nav left" onClick={showPrevious} data-testid="gallery-detail-lightbox-prev-button">
            <ChevronLeft size={24} />
          </button>

          <img
            src={gallery.images[activeIndex]}
            alt={`${gallery.title} lightbox ${activeIndex + 1}`}
            className="lightbox-image"
            data-testid="gallery-detail-lightbox-image"
          />

          <button className="lightbox-nav right" onClick={showNext} data-testid="gallery-detail-lightbox-next-button">
            <ChevronRight size={24} />
          </button>

          <p className="lightbox-count" data-testid="gallery-detail-lightbox-count">
            {activeIndex + 1} / {gallery.images.length}
          </p>
        </div>
      ) : null}

      <section className="cta-strip" data-testid="gallery-detail-booking-cta-section">
        <h2 className="section-title" data-testid="gallery-detail-booking-cta-title">Loved this story? Let’s craft yours.</h2>
        <Button asChild data-testid="gallery-detail-booking-cta-button">
          <Link to="/booking">Book a Session</Link>
        </Button>
      </section>
    </div>
  );
};

export default GalleryDetailPage;
