"use client";

import { useState } from "react";

export default function AuthPage() {
  const [mode, setMode] = useState("login");
  const [formState, setFormState] = useState({
    email: "",
    password: "",
    name: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormState({
      ...formState,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Basic fake submit logic (replace with real API calls)
    setTimeout(() => {
      setLoading(false);
      if (!formState.email || !formState.password || (mode === "register" && !formState.name)) {
        setError("Please fill all required fields.");
        return;
      }
      // Mock error for tutorial
      if (formState.email === "test@example.com") {
        setError("This email is already in use.");
        return;
      }
      alert(
        mode === "login"
          ? "Logged in! (replace with redirect)"
          : "Registered! (replace with redirect)"
      );
    }, 1000);
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#f6f8fa"
    }}>
      <div style={{
        maxWidth: 400,
        width: "100%",
        padding: 32,
        background: "black",
        borderRadius: 10,
        boxShadow: "0 2px 12px rgba(0,0,0,0.06)"
      }}>
        <h2 style={{ textAlign: "center", marginBottom: 20 }}>
          {mode === "login" ? "Sign In" : "Register"}
        </h2>
        <form onSubmit={handleSubmit}>
          {mode === "register" && (
            <div style={{ marginBottom: 16 }}>
              <label>
                Name
                <input
                  name="name"
                  value={formState.name}
                  onChange={handleChange}
                  required
                  style={{ width: "100%", marginTop: 4, padding: 8, marginBottom: 4 }}
                />
              </label>
            </div>
          )}
          <div style={{ marginBottom: 16 }}>
            <label>
              Email
              <input
                type="email"
                name="email"
                value={formState.email}
                onChange={handleChange}
                required
                style={{ width: "100%", marginTop: 4, padding: 8, marginBottom: 4 }}
              />
            </label>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label>
              Password
              <input
                type="password"
                name="password"
                value={formState.password}
                onChange={handleChange}
                required
                style={{ width: "100%", marginTop: 4, padding: 8, marginBottom: 4 }}
              />
            </label>
          </div>
          {error && (
            <div style={{ color: "red", marginBottom: 12, textAlign: "center" }}>{error}</div>
          )}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: 10,
              background: "#282a36",
              color: "white",
              border: "none",
              borderRadius: 4,
              cursor: loading ? "wait" : "pointer",
              fontWeight: "bold"
            }}
          >
            {loading
              ? mode === "login"
                ? "Logging in..."
                : "Registering..."
              : mode === "login"
                ? "Sign In"
                : "Register"}
          </button>
        </form>
        <div style={{ marginTop: 18, textAlign: "center" }}>
          {mode === "login" ? (
            <>
              {"Don't have an account?"}
              <button
                style={{ background: "none", border: "none", color: "#4f7cac", cursor: "pointer" }}
                onClick={() => {
                  setMode("register");
                  setError("");
                }}
              >
                Register
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                style={{ background: "none", border: "none", color: "#4f7cac", cursor: "pointer" }}
                onClick={() => {
                  setMode("login");
                  setError("");
                }}
              >
                Sign In
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}