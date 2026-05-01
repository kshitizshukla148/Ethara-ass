import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const api = axios.create({ baseURL: API_BASE_URL });

function App() {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState("login");
  const [authForm, setAuthForm] = useState({ name: "", email: "", password: "", role: "member" });
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [projectForm, setProjectForm] = useState({ name: "", description: "", members: "" });
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    project: "",
    assignedTo: "",
    dueDate: "",
    status: "todo",
  });
  const [error, setError] = useState("");

  const isAdmin = useMemo(() => user?.role === "admin", [user]);

  const logout = useCallback(() => {
    setToken("");
    setUser(null);
    setProjects([]);
    setTasks([]);
    setUsers([]);
    setDashboard(null);
    localStorage.removeItem("token");
    delete api.defaults.headers.common.Authorization;
  }, []);

  const hydrateData = useCallback(async () => {
    try {
      setError("");
      const meRes = await api.get("/auth/me");
      setUser(meRes.data);
      const [projectRes, taskRes, dashboardRes] = await Promise.all([
        api.get("/projects"),
        api.get("/tasks"),
        api.get("/dashboard"),
      ]);
      setProjects(projectRes.data);
      setTasks(taskRes.data);
      setDashboard(dashboardRes.data);

      if (meRes.data.role === "admin") {
        const usersRes = await api.get("/auth/users");
        setUsers(usersRes.data);
      } else {
        const userMap = new Map();
        projectRes.data.forEach((project) => {
          project.members?.forEach((member) => userMap.set(member._id, member));
          if (project.createdBy?._id) userMap.set(project.createdBy._id, project.createdBy);
        });
        setUsers(Array.from(userMap.values()));
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load data");
      logout();
    }
  }, [logout]);

  useEffect(() => {
    if (!token) return;
    localStorage.setItem("token", token);
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
    Promise.resolve().then(hydrateData);
  }, [token, hydrateData]);

  const handleAuth = async (e) => {
    e.preventDefault();
    try {
      setError("");
      const endpoint = authMode === "login" ? "/auth/login" : "/auth/signup";
      const payload = authMode === "login" ? { email: authForm.email, password: authForm.password } : authForm;
      const res = await api.post(endpoint, payload);
      setToken(res.data.token);
    } catch (err) {
      setError(err.response?.data?.message || "Authentication failed");
    }
  };

  const createProject = async (e) => {
    e.preventDefault();
    try {
      const members = projectForm.members.split(",").map((v) => v.trim()).filter(Boolean);
      await api.post("/projects", { ...projectForm, members });
      setProjectForm({ name: "", description: "", members: "" });
      hydrateData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create project");
    }
  };

  const createTask = async (e) => {
    e.preventDefault();
    try {
      await api.post("/tasks", taskForm);
      setTaskForm({ title: "", description: "", project: "", assignedTo: "", dueDate: "", status: "todo" });
      hydrateData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create task");
    }
  };

  const updateTaskStatus = async (taskId, status) => {
    try {
      await api.put(`/tasks/${taskId}`, { status });
      hydrateData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update task");
    }
  };

  if (!token) {
    return (
      <div className="auth-shell">
        <div className="card auth-card fade-in">
          <h1>Team Task Manager</h1>
          <p className="muted">{authMode === "login" ? "Login to continue" : "Create your account"}</p>
          {error && <p className="error">{error}</p>}
          <form onSubmit={handleAuth} className="grid">
            {authMode === "signup" && (
              <>
                <input placeholder="Name" value={authForm.name} onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })} required />
                <select value={authForm.role} onChange={(e) => setAuthForm({ ...authForm, role: e.target.value })}>
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
              </>
            )}
            <input type="email" placeholder="Email" value={authForm.email} onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })} required />
            <input type="password" placeholder="Password" value={authForm.password} onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })} required />
            <button type="submit">{authMode === "login" ? "Login" : "Sign up"}</button>
          </form>
          <button className="secondary" onClick={() => setAuthMode(authMode === "login" ? "signup" : "login")}>
            {authMode === "login" ? "Need an account? Sign up" : "Already have an account? Login"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="layout">
      <section className="header-row card fade-in">
        <div>
          <h1>Team Task Manager</h1>
          <p className="muted">Logged in as <strong>{user?.name}</strong> ({user?.role})</p>
        </div>
        <button onClick={logout}>Logout</button>
      </section>

      {error && <p className="error">{error}</p>}

      {dashboard && (
        <section className="grid grid-5">
          {Object.entries(dashboard).map(([key, value], index) => (
            <article className="card stat-card fade-in-up" style={{ animationDelay: `${index * 80}ms` }} key={key}>
              <h3>{key}</h3>
              <p>{value}</p>
            </article>
          ))}
        </section>
      )}

      {isAdmin && (
        <section className="card fade-in-up">
          <h2>Create Project (Admin)</h2>
          <form className="grid" onSubmit={createProject}>
            <input placeholder="Project name" value={projectForm.name} onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })} required />
            <input placeholder="Description" value={projectForm.description} onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })} />
            <input placeholder="Member emails (comma-separated)" value={projectForm.members} onChange={(e) => setProjectForm({ ...projectForm, members: e.target.value })} />
            <button type="submit">Create Project</button>
          </form>
        </section>
      )}

      {isAdmin ? (
        <section className="card fade-in-up">
          <h2>Create Task</h2>
          <form className="grid" onSubmit={createTask}>
            <input placeholder="Task title" value={taskForm.title} onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} required />
            <input placeholder="Description" value={taskForm.description} onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })} />
            <select value={taskForm.project} onChange={(e) => setTaskForm({ ...taskForm, project: e.target.value })} required>
              <option value="">Select project</option>
              {projects.map((project) => (
                <option value={project._id} key={project._id}>{project.name}</option>
              ))}
            </select>
            <select value={taskForm.assignedTo} onChange={(e) => setTaskForm({ ...taskForm, assignedTo: e.target.value })} required>
              <option value="">Assign to</option>
              {users.map((member) => (
                <option value={member._id} key={member._id}>{member.name} ({member.role})</option>
              ))}
            </select>
            <input type="date" value={taskForm.dueDate} onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })} required />
            <select value={taskForm.status} onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value })}>
              <option value="todo">Todo</option>
              <option value="in-progress">In Progress</option>
              <option value="done">Done</option>
            </select>
            <button type="submit">Create Task</button>
          </form>
        </section>
      ) : (
        <section className="card fade-in-up">
          <h2>Member Panel</h2>
          <p className="muted">
            Tasks are assigned by admins. You can update your task status from the list below.
          </p>
        </section>
      )}

      <section className="card fade-in-up">
        <h2>Tasks</h2>
        <div className="task-list">
          {tasks.map((task) => (
            <article key={task._id} className="task-item">
              <div>
                <h3>{task.title}</h3>
                <p>{task.description || "No description"}</p>
                <p>Project: {task.project?.name}</p>
                <p>Assigned To: {task.assignedTo?.name}</p>
                <p>Due: {new Date(task.dueDate).toLocaleDateString()}</p>
                <span className={`status-chip status-${task.status}`}>{task.status}</span>
              </div>
              <select value={task.status} onChange={(e) => updateTaskStatus(task._id, e.target.value)}>
                <option value="todo">Todo</option>
                <option value="in-progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </article>
          ))}
          {tasks.length === 0 && <p>No tasks yet.</p>}
        </div>
      </section>
    </main>
  );
}

export default App;
