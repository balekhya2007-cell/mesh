
import { useState } from "react";
import "./Login.css";

function Signup({ onLogin, onBack }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    department: "AI & ML",
    skills: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (form.password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    setLoading(true);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8080";
      const response = await fetch(
        `${apiUrl}/api/auth/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: form.name.trim(),
            email: form.email.trim(),
            department: form.department,
            skills: form.skills.trim(),
            password: form.password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Unable to create account.");
        return;
      }

      onLogin(data);
    } catch (error) {
      setError("Unable to connect to MESH server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-left">
        <div className="mesh-logo">M</div>
        <h1>MESH</h1>

        <p className="login-tagline">
          Connect skills.<br />
          Build together.
        </p>

        <p className="login-description">
          Connect with students from different departments,
          discover complementary skills, and turn your ideas
          into meaningful projects.
        </p>
      </div>

      <div className="login-right">
        <div className="login-card">
          <h2>Create your account</h2>

          <p className="login-subtitle">
            Join the MESH community
          </p>

          <form onSubmit={handleSubmit}>
            <label>Full name</label>
            <input
              name="name"
              type="text"
              placeholder="Enter your full name"
              value={form.name}
              onChange={handleChange}
              required
            />

            <label>Email address</label>
            <input
              name="email"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              required
            />

            <label>Department</label>
            <select
              name="department"
              value={form.department}
              onChange={handleChange}
              required
            >
              <option>AI & ML</option>
              <option>Computer Science</option>
              <option>Electronics & Communication</option>
              <option>Electrical Engineering</option>
              <option>Mechanical Engineering</option>
              <option>Civil Engineering</option>
              <option>Other</option>
            </select>

            <label>Skills</label>
            <input
              name="skills"
              type="text"
              placeholder="Python, Java, IoT"
              value={form.skills}
              onChange={handleChange}
            />

            <label>Password</label>
            <div className="password-box">
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="At least 8 characters"
                value={form.password}
                onChange={handleChange}
                minLength={8}
                required
              />

              <button
                type="button"
                className="show-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            {error && (
              <p className="login-error">{error}</p>
            )}

            <button
              type="submit"
              className="login-button"
              disabled={loading}
            >
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>

          <p className="signup-text">
            Already have an account?{" "}
            <button
              type="button"
              className="signup-link"
              onClick={onBack}
            >
              Log in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Signup;
