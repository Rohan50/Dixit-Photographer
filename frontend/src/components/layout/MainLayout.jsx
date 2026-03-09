import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, Moon, Sun, X } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

const links = [
  { label: "Home", path: "/" },
  { label: "Galleries", path: "/gallery" },
  { label: "Blog", path: "/blog" },
  { label: "About", path: "/about" },
  { label: "Booking", path: "/booking" },
];

const MainLayout = ({ children }) => {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = theme === "dark";

  const toggleTheme = () => {
    setTheme(isDark ? "light" : "dark");
  };

  return (
    <div className="site-shell" data-testid="site-shell">
      <header className="site-header" data-testid="site-header">
        <div className="content-wrap header-inner" data-testid="site-header-inner">
          <Link to="/" className="brand-link" data-testid="site-brand-link">
            SHIVI PAREEK
          </Link>

          <nav className="desktop-nav" data-testid="desktop-navigation">
            {links.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={location.pathname === link.path ? "nav-link active" : "nav-link"}
                data-testid={`nav-link-${link.label.toLowerCase()}`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="header-actions" data-testid="site-header-actions">
            <Button
              variant="ghost"
              className="theme-toggle-btn"
              onClick={toggleTheme}
              data-testid="theme-toggle-button"
              aria-label="Toggle dark and light mode"
            >
              {mounted ? (
                isDark ? <Sun size={18} data-testid="theme-toggle-icon-sun" /> : <Moon size={18} data-testid="theme-toggle-icon-moon" />
              ) : (
                <Moon size={18} data-testid="theme-toggle-icon-default" />
              )}
            </Button>

            <Button
              variant="ghost"
              className="mobile-menu-btn"
              onClick={() => setIsMenuOpen((prev) => !prev)}
              data-testid="mobile-menu-toggle-button"
            >
              {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </Button>
          </div>
        </div>

        {isMenuOpen ? (
          <div className="mobile-menu" data-testid="mobile-navigation-menu">
            {links.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={location.pathname === link.path ? "mobile-nav-link active" : "mobile-nav-link"}
                onClick={() => setIsMenuOpen(false)}
                data-testid={`mobile-nav-link-${link.label.toLowerCase()}`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        ) : null}
      </header>

      <main className="site-main" data-testid="site-main-content">
        {children}
      </main>

      <footer className="site-footer" data-testid="site-footer">
        <div className="content-wrap footer-inner" data-testid="site-footer-inner">
          <div className="footer-column" data-testid="footer-brand-column">
            <p className="footer-brand" data-testid="footer-brand-name">
              SHIVI PAREEK
            </p>
            <p className="footer-text" data-testid="footer-tagline-text">
              Monochrome stories crafted with light and emotion.
            </p>
          </div>

          <div className="footer-column" data-testid="footer-links-column">
            <p className="footer-heading" data-testid="footer-navigation-heading">
              Navigation
            </p>
            {links.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className="footer-link"
                data-testid={`footer-link-${link.label.toLowerCase()}`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="footer-column" data-testid="footer-contact-column">
            <p className="footer-heading" data-testid="footer-contact-heading">
              Contact
            </p>
            <p className="footer-text" data-testid="footer-email-text">
              hello@shivipareek.studio
            </p>
            <div className="social-links" data-testid="footer-social-links">
              <a href="https://instagram.com" target="_blank" rel="noreferrer" data-testid="footer-social-instagram-link">
                Instagram
              </a>
              <a href="https://behance.net" target="_blank" rel="noreferrer" data-testid="footer-social-behance-link">
                Behance
              </a>
              <a href="https://vimeo.com" target="_blank" rel="noreferrer" data-testid="footer-social-vimeo-link">
                Vimeo
              </a>
            </div>
          </div>
        </div>

        <p className="copyright" data-testid="footer-copyright-text">
          © {new Date().getFullYear()} Shivi Pareek. All rights reserved.
        </p>
      </footer>
    </div>
  );
};

export default MainLayout;
