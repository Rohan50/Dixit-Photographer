import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { useSeo } from "@/hooks/useSeo";

const GalleriesPage = () => {
  const [galleries, setGalleries] = useState([]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useSeo({
    title: "Photography Galleries | Shivi Pareek",
    description: "Explore wedding, portrait, travel, fashion, street, and nature black and white photography galleries.",
  });

  const loadGalleries = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const items = await api.getGalleries();
      setGalleries(items);
    } catch (err) {
      setError(err?.message || "Unable to load galleries.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGalleries();
  }, [loadGalleries]);

  const categories = useMemo(() => {
    const uniqueCategories = new Set(galleries.map((gallery) => gallery.category));
    return ["All", ...uniqueCategories];
  }, [galleries]);

  const filteredGalleries = useMemo(() => {
    if (activeCategory === "All") {
      return galleries;
    }
    return galleries.filter((gallery) => gallery.category === activeCategory);
  }, [galleries, activeCategory]);

  return (
    <div className="content-wrap page-stack" data-testid="galleries-page">
      <section className="section-spacing" data-testid="galleries-header-section">
        <p className="eyebrow" data-testid="galleries-page-eyebrow">Collection Archive</p>
        <h1 className="page-title" data-testid="galleries-page-title">Photography Galleries</h1>
        <p className="body-text" data-testid="galleries-page-description">
          A curated archive of editorial black and white stories.
        </p>

        <div className="filter-row" data-testid="galleries-category-filter-row">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              className={activeCategory === category ? "filter-chip active" : "filter-chip"}
              onClick={() => setActiveCategory(category)}
              data-testid={`galleries-filter-${category.toLowerCase().replace(/\s+/g, "-")}`}
            >
              {category}
            </button>
          ))}
        </div>
      </section>

      <section className="gallery-grid section-spacing" data-testid="galleries-grid-section">
        {loading ? <p className="loading-text" data-testid="galleries-loading-text">Loading galleries...</p> : null}

        {filteredGalleries.map((gallery) => (
          <Link to={`/gallery/${gallery.slug}`} key={gallery.id} className="image-card" data-testid={`galleries-card-${gallery.id}`}>
            <img src={gallery.cover_image} alt={`${gallery.title} cover`} loading="lazy" data-testid={`galleries-image-${gallery.id}`} />
            <div className="card-overlay" data-testid={`galleries-overlay-${gallery.id}`}>
              <p className="card-category" data-testid={`galleries-category-${gallery.id}`}>{gallery.category}</p>
              <p className="card-title" data-testid={`galleries-title-${gallery.id}`}>{gallery.title}</p>
              <p className="card-meta" data-testid={`galleries-photo-count-${gallery.id}`}>{gallery.photo_count} photos</p>
            </div>
          </Link>
        ))}

        {!loading && filteredGalleries.length === 0 ? (
          <p className="body-text" data-testid="galleries-empty-state-text">No galleries available in this category yet.</p>
        ) : null}

        {error ? (
          <div className="panel" data-testid="galleries-error-panel">
            <p className="body-text" data-testid="galleries-error-message">{error}</p>
            <Button onClick={loadGalleries} data-testid="galleries-retry-button">Retry</Button>
          </div>
        ) : null}
      </section>
    </div>
  );
};

export default GalleriesPage;
