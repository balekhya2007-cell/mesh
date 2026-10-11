
import { useState } from "react";
import "./Login.css";

function Login({ onLogin, onSignup }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8080";
      const response = await fetch(
        `${apiUrl}/api/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Invalid email or password.");
        return;
      }

      localStorage.setItem("meshUser", JSON.stringify(data));

      onLogin(data);
    } catch (err) {
      setError("Unable to connect to MESH server.");
    }
  };

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
          An AI-powered interdisciplinary collaboration platform
          that helps students find the right teammates and turn
          ideas into projects.
        </p>
      </div>

      <div className="login-right">
        <div className="login-card">
          <h2>Welcome back</h2>

          <p className="login-subtitle">
            Sign in to continue to MESH
          </p>

          <form onSubmit={handleSubmit}>
            <label>Email address</label>

            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <label>Password</label>

            <div className="password-box">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <button
                type="button"
                className="show-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            {error && <p className="login-error">{error}</p>}

            <button type="submit" className="login-button">
              Log in
            </button>
          </form>

          <p className="signup-text">
            Don't have an account?{" "}
            <button onClick={onSignup} className="signup-link">
              Create account
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
