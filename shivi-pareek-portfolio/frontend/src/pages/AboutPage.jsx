import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useSeo } from "@/hooks/useSeo";

const AboutPage = () => {
  const [about, setAbout] = useState(null);

  useSeo({
    title: "About the Photographer | Shivi Pareek",
    description: "Learn about Shivi Pareek's photography philosophy, journey, and editorial monochrome style.",
  });

  useEffect(() => {
    const loadData = async () => {
      const data = await api.getAboutData();
      setAbout(data);
    };

    loadData();
  }, []);

  if (!about) {
    return (
      <div className="content-wrap section-spacing" data-testid="about-loading-state">
        <p className="loading-text" data-testid="about-loading-text">Loading story...</p>
      </div>
    );
  }

  return (
    <div className="content-wrap page-stack" data-testid="about-page">
      <section className="split-section section-spacing" data-testid="about-main-section">
        <div className="split-image" data-testid="about-portrait-image-wrapper">
          <img src={about.portrait_image} alt="Portrait of Shivi Pareek" loading="lazy" data-testid="about-portrait-image" />
        </div>

        <div className="split-content" data-testid="about-main-content">
          <p className="eyebrow" data-testid="about-eyebrow">About</p>
          <h1 className="page-title" data-testid="about-page-title">{about.name}</h1>
          <p className="body-text" data-testid="about-tagline">{about.tagline}</p>
          <p className="body-text" data-testid="about-story-text">{about.story}</p>
        </div>
      </section>

      <section className="three-column section-spacing" data-testid="about-highlights-section">
        <article className="panel" data-testid="about-journey-panel">
          <h2 className="section-title" data-testid="about-journey-title">Photography Journey</h2>
          <p className="body-text" data-testid="about-journey-description">
            From documentary weddings to editorial campaigns, my approach stays rooted in emotional clarity and composition.
          </p>
        </article>

        <article className="panel" data-testid="about-achievements-panel">
          <h2 className="section-title" data-testid="about-achievements-title">Achievements</h2>
          <ul className="simple-list" data-testid="about-achievements-list">
            {about.achievements.map((item, index) => (
              <li key={`${item}-${index}`} data-testid={`about-achievement-item-${index}`}>{item}</li>
            ))}
          </ul>
        </article>

        <article className="panel" data-testid="about-testimonials-panel">
          <h2 className="section-title" data-testid="about-testimonials-title">Testimonials</h2>
          <ul className="simple-list" data-testid="about-testimonials-list">
            {about.testimonials.map((item, index) => (
              <li key={`${item}-${index}`} data-testid={`about-testimonial-item-${index}`}>{item}</li>
            ))}
          </ul>
        </article>
      </section>
    </div>
  );
};

export default AboutPage;
