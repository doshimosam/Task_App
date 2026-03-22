"use client";

import { useState, useEffect } from "react";
import { taskAPI, getUser, removeToken, removeUser } from "./lib/api";
import TaskForm from "./components/TaskForm";
import AuthModal from "./components/AuthModal";

export default function Dashboard() {
  // ── State ─────────────────────────────────────────────────────
  const [tasks,       setTasks]       = useState([]);
  const [summary,     setSummary]     = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState("");

  const [showForm,    setShowForm]    = useState(false);
  const [editTask,    setEditTask]    = useState(null);   // task being edited
  const [showAuth,    setShowAuth]    = useState(false);

  const [user,        setUser]        = useState(null);
  const [statusFilter,   setStatusFilter]   = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");

  // ── Load on mount ──────────────────────────────────────────────
  useEffect(() => {
    setUser(getUser());
    loadAll();
  }, []);

  // Reload when filters change
  useEffect(() => {
    loadAll();
  }, [statusFilter, priorityFilter]);

  // ── Functions ──────────────────────────────────────────────────
  async function loadAll() {
    setLoading(true);
    setError("");
    try {
      const [taskList, taskSummary] = await Promise.all([
        taskAPI.getAll(statusFilter, priorityFilter),
        taskAPI.getSummary(),
      ]);
      setTasks(taskList);
      setSummary(taskSummary);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(data) {
    await taskAPI.create(data);
    setShowForm(false);
    loadAll();
  }

  async function handleUpdate(data) {
    await taskAPI.update(editTask.id, data);
    setEditTask(null);
    setShowForm(false);
    loadAll();
  }

  async function handleDelete(id) {
    if (!confirm("Delete this task?")) return;
    await taskAPI.delete(id);
    loadAll();
  }

  async function handleStatusChange(id, status) {
    await taskAPI.update(id, { status });
    loadAll();
  }

  function openEdit(task) {
    setEditTask(task);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditTask(null);
  }

  function handleLogout() {
    removeToken();
    removeUser();
    setUser(null);
    loadAll();
  }

  function handleAuthSuccess(userData) {
    setUser(userData);
    setShowAuth(false);
    loadAll();
  }

  // ── Render ─────────────────────────────────────────────────────
  return (
    <div className="container">

      {/* ── Header ── */}
      <div className="header">
        <h1>TaskFlow</h1>
        <div className="auth-bar">
          {user ? (
            <>
              <span className="user-info">👤 {user.username}</span>
              <button className="btn-secondary" onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <button className="btn-secondary" onClick={() => setShowAuth(true)}>Login / Register</button>
          )}
          <button className="btn-primary" onClick={() => { setEditTask(null); setShowForm(true); }}>
            + New Task
          </button>
        </div>
      </div>

      {/* ── Summary Cards ── */}
      <div className="cards">
        <div className="card">
          <div className="num">{summary?.total ?? "—"}</div>
          <div className="lbl">Total</div>
        </div>
        <div className="card">
          <div className="num">{summary?.pending ?? "—"}</div>
          <div className="lbl">Pending</div>
        </div>
        <div className="card">
          <div className="num">{summary?.in_progress ?? "—"}</div>
          <div className="lbl">In Progress</div>
        </div>
        <div className="card">
          <div className="num">{summary?.completed ?? "—"}</div>
          <div className="lbl">Completed</div>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="filters">
        <label>Status:</label>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>

        <label>Priority:</label>
        <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
          <option value="">All</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>

        {(statusFilter || priorityFilter) && (
          <button
            className="btn-secondary"
            style={{ padding: "5px 10px", fontSize: 13 }}
            onClick={() => { setStatusFilter(""); setPriorityFilter(""); }}
          >
            Clear
          </button>
        )}
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="error-box" style={{ marginBottom: 16 }}>
          {error} — <button style={{ background:"none", border:"none", color:"#991b1b", cursor:"pointer", textDecoration:"underline" }} onClick={loadAll}>Retry</button>
        </div>
      )}

      {/* ── Task Table ── */}
      {loading ? (
        <div className="loading">Loading tasks...</div>
      ) : tasks.length === 0 ? (
        <div className="empty">No tasks found. Click "+ New Task" to create one.</div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Task</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr key={task.id}>

                  {/* Title + Description */}
                  <td>
                    <div className="task-title">{task.title}</div>
                    {task.description && (
                      <div className="task-desc">{task.description}</div>
                    )}
                  </td>

                  {/* Priority badge */}
                  <td>
                    <span className={`badge badge-${task.priority}`}>
                      {task.priority}
                    </span>
                  </td>

                  {/* Status dropdown — change inline */}
                  <td>
                    <select
                      className="status-select"
                      value={task.status}
                      onChange={(e) => handleStatusChange(task.id, e.target.value)}
                    >
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  </td>

                  {/* Date */}
                  <td style={{ color: "#888", whiteSpace: "nowrap" }}>
                    {new Date(task.created_at).toLocaleDateString("en-IN", {
                      day: "numeric", month: "short", year: "numeric"
                    })}
                  </td>

                  {/* Edit + Delete */}
                  <td>
                    <div className="actions">
                      <button className="btn-edit" onClick={() => openEdit(task)}>Edit</button>
                      <button className="btn-danger" onClick={() => handleDelete(task.id)}>Delete</button>
                    </div>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Modals ── */}
      {showForm && (
        <TaskForm
          task={editTask}
          onSubmit={editTask ? handleUpdate : handleCreate}
          onClose={closeForm}
        />
      )}

      {showAuth && (
        <AuthModal
          onSuccess={handleAuthSuccess}
          onClose={() => setShowAuth(false)}
        />
      )}

    </div>
  );
}
