"use client";

import { useState } from "react";
import { authAPI, setToken, setUser } from "../lib/api";

export default function AuthModal({ onSuccess, onClose }) {
  const [tab,      setTab]      = useState("login");   // "login" or "register"
  const [username, setUsername] = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  function switchTab(t) {
    setTab(t);
    setError("");
    setUsername("");
    setEmail("");
    setPassword("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!username || !password) { setError("Fill in all fields"); return; }
    if (tab === "register" && !email) { setError("Email is required"); return; }

    setLoading(true);
    setError("");

    try {
      let res;
      if (tab === "login") {
        res = await authAPI.login({ username, password });
      } else {
        res = await authAPI.register({ username, email, password });
      }
      setToken(res.access_token);
      setUser(res.user);
      onSuccess(res.user);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>

        {/* Tabs */}
        <div className="tabs">
          <button
            className={`tab ${tab === "login" ? "active" : ""}`}
            onClick={() => switchTab("login")}
          >
            Login
          </button>
          <button
            className={`tab ${tab === "register" ? "active" : ""}`}
            onClick={() => switchTab("register")}
          >
            Register
          </button>
        </div>

        {error && <div className="error-box">{error}</div>}

        <form onSubmit={handleSubmit}>

          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              placeholder="your_username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
            />
          </div>

          {tab === "register" && (
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          )}

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="form-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Please wait..." : tab === "login" ? "Login" : "Register"}
            </button>
          </div>

        </form>

        <p style={{ marginTop: 16, fontSize: 13, color: "#888", textAlign: "center" }}>
          Or{" "}
          <button
            style={{ background: "none", border: "none", color: "#2563eb", cursor: "pointer", fontSize: 13, textDecoration: "underline" }}
            onClick={onClose}
          >
            continue as guest
          </button>
        </p>

      </div>
    </div>
  );
}
