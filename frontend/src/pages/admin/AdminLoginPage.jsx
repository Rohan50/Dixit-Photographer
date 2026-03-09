import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/sonner";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { useSeo } from "@/hooks/useSeo";

const AdminLoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin@noirfolio.com");
  const [password, setPassword] = useState("Admin@12345");
  const [isLoading, setIsLoading] = useState(false);

  useSeo({
    title: "Admin Login | Shivi Pareek",
    description: "Secure admin login for gallery, blog, and enquiry management.",
  });

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      setIsLoading(true);
      const response = await api.adminLogin({ email, password });
      localStorage.setItem("admin_token", response.token);
      toast.success("Welcome back", { description: "Admin dashboard is ready." });
      navigate("/admin");
    } catch (error) {
      toast.error("Login failed", { description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="admin-auth-shell" data-testid="admin-login-page">
      <form className="admin-auth-card" onSubmit={handleSubmit} data-testid="admin-login-form">
        <p className="eyebrow" data-testid="admin-login-eyebrow">Secure Access</p>
        <h1 className="page-title" data-testid="admin-login-title">Admin Login</h1>
        <p className="body-text" data-testid="admin-login-helper-text">
          Use your admin credentials to manage galleries, blog posts, and enquiries.
        </p>

        <label className="form-label" data-testid="admin-login-email-label">
          Email
          <input
            data-testid="admin-login-email-input"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>

        <label className="form-label" data-testid="admin-login-password-label">
          Password
          <input
            data-testid="admin-login-password-input"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>

        <Button type="submit" disabled={isLoading} data-testid="admin-login-submit-button">
          {isLoading ? "Signing in..." : "Login to Dashboard"}
        </Button>
      </form>
    </div>
  );
};

export default AdminLoginPage;
