const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Auth token helpers
export function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

export function setToken(token) {
  localStorage.setItem("token", token);
}

export function removeToken() {
  localStorage.removeItem("token");
}

export function getUser() {
  if (typeof window === "undefined") return null;
  const u = localStorage.getItem("user");
  return u ? JSON.parse(u) : null;
}

export function setUser(user) {
  localStorage.setItem("user", JSON.stringify(user));
}

export function removeUser() {
  localStorage.removeItem("user");
}

// Base fetch function
async function request(path, options = {}) {
  const token = getToken();

  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Something went wrong" }));
    throw new Error(err.detail || "Request failed");
  }

  if (res.status === 204) return null;
  return res.json();
}

// ── Tasks ──────────────────────────────────────────────────────
export const taskAPI = {
  getAll(status = "", priority = "") {
    let query = "";
    if (status)   query += `?status=${status}`;
    if (priority) query += `${query ? "&" : "?"}priority=${priority}`;
    return request(`/api/tasks/${query}`);
  },

  getSummary() {
    return request("/api/tasks/summary");
  },

  create(data) {
    return request("/api/tasks/", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  update(id, data) {
    return request(`/api/tasks/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  delete(id) {
    return request(`/api/tasks/${id}`, { method: "DELETE" });
  },
};

// ── Auth ───────────────────────────────────────────────────────
export const authAPI = {
  register(data) {
    return request("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  login(data) {
    return request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
};
