import { useEffect, useState } from "react";
import "./App.css";
import Login from "./Login";
import Signup from "./Signup";
const API = "http://localhost:8080/api";
const AI_API = "http://localhost:8000";



const departments = [
  "AI & ML",
  "Computer Science",
  "Electronics & Communication",
  "Electrical Engineering",
  "Mechanical Engineering",
  "Civil Engineering",
  "Other",
];

function App() {
  // =========================
  // LOGIN / SESSION
  // =========================

  const [loggedInUser, setLoggedInUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem("meshUser");
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [page, setPage] = useState("Discover");

  const [databaseStudents, setDatabaseStudents] = useState([]);
  const [studentApiStatus, setStudentApiStatus] =
    useState("Connecting...");

  const [databaseProjects, setDatabaseProjects] = useState([]);
  const [projectApiStatus, setProjectApiStatus] =
    useState("Connecting...");

  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(false);

  const [requests, setRequests] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [closureNotifications, setClosureNotifications] = useState([]);
const [closureLoading, setClosureLoading] = useState(false);

  const [saved, setSaved] = useState([]);
  const [notice, setNotice] = useState("");

  const [analysis, setAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [requestLoading, setRequestLoading] = useState(null);

  const [selectedMatchProject, setSelectedMatchProject] = useState("");
  const [matchedStudents, setMatchedStudents] = useState([]);
  const [matchingStatus, setMatchingStatus] = useState("idle");

  const [form, setForm] = useState({
    title: "",
    description: "",
    department: "AI & ML",
  });

  // Logged-in user is now the current student.
  // This replaces the old databaseStudents[0] logic.
  const currentStudent = loggedInUser;

  // =========================
  // LOGIN FUNCTIONS
  // =========================

  function handleLogin(user) {
    localStorage.setItem("meshUser", JSON.stringify(user));
    setLoggedInUser(user);
    setPage("Discover");
  }

  
  function handleLogout() {
    localStorage.removeItem("meshUser");
    setLoggedInUser(null);
    setPage("Discover");
  }


  // =========================
  // NOTIFICATION
  // =========================

  function showNotice(message) {
    setNotice(message);

    setTimeout(() => {
      setNotice("");
    }, 3500);
  }

  // =========================
  // LOAD PROJECTS
  // =========================

  async function loadProjects() {
    const response = await fetch(`${API}/projects`);

    if (!response.ok) {
      throw new Error("Could not load projects");
    }

    const data = await response.json();

    setDatabaseProjects(data);
    setProjectApiStatus("Connected");
  }

  // =========================
  // LOAD JOIN REQUESTS
  // =========================
  
  async function refreshRequests(studentId = currentStudent?.id) {
    if (!studentId) return;

    try {
      const [sentResponse, incomingResponse] = await Promise.all([
        fetch(`${API}/join-requests/student/${studentId}`),
        fetch(`${API}/join-requests/owner/${studentId}`),
      ]);

      if (!sentResponse.ok || !incomingResponse.ok) {
        throw new Error("Could not load join requests");
      }

      const [sentData, incomingData] = await Promise.all([
        sentResponse.json(),
        incomingResponse.json(),
      ]);

      setRequests(sentData);
      setIncomingRequests(incomingData);
    } catch (error) {
      console.error("Join request loading error:", error);
    }
  }


  async function refreshClosureNotifications(
    studentId = currentStudent?.id
  ) {
    if (!studentId) return;

    try {
      const response = await fetch(
        `${API}/project-closures/student/${studentId}`
      );

      if (!response.ok) {
        throw new Error("Could not load closure notifications.");
      }

      const data = await response.json();
      setClosureNotifications(data);
    } catch (error) {
      console.error("Closure notification error:", error);
    }
  }



async function requestProjectClosure(project) {
  console.log("CLOSURE BUTTON CLICKED", project);

  if (!currentStudent?.id) {
    showNotice("Please log in first.");
    return;
  }

  const confirmed = window.confirm(
    `Request closure of "${project.title}"? All active members must approve. One rejection cancels the request.`
  );

  if (!confirmed) return;

  setClosureLoading(true);

  try {
    const response = await fetch(
      `${API}/projects/${project.id}/closure`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ownerId: currentStudent.id,
        }),
      }
    );

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        data.message || "Could not request project closure."
      );
    }

    await loadProjects();
    await refreshRequests();
    await refreshClosureNotifications();

    showNotice(data.message || "Closure request submitted.");
  } catch (error) {
    console.error("Project closure error:", error);
    showNotice(error.message || "Could not request project closure.");
  } finally {
    setClosureLoading(false);
  }
}

async function respondToClosure(notification, status) {
  if (!currentStudent?.id) return;

  setClosureLoading(true);

  try {
    const response = await fetch(
      `${API}/project-closures/votes/${notification.voteId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          studentId: currentStudent.id,
          status,
        }),
      }
    );

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        data.message || "Could not submit your decision."
      );
    }

    await refreshClosureNotifications();
    await loadProjects();
    await refreshRequests();

    showNotice(data.message || "Your decision was recorded.");
  } catch (error) {
    console.error("Closure response error:", error);
    showNotice(error.message || "Could not submit your decision.");
  } finally {
    setClosureLoading(false);
  }
}

async function leaveProject(project) {
  if (!currentStudent?.id) return;

  const confirmed = window.confirm(
    `Leave "${project.title}"? You will no longer be an active member.`
  );

  if (!confirmed) return;

  setClosureLoading(true);

  try {
    const response = await fetch(
      `${API}/projects/${project.id}/leave`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          studentId: currentStudent.id,
        }),
      }
    );

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        data.message || "Could not leave the project."
      );
    }

    await refreshRequests();
    await loadProjects();

    showNotice(data.message || "You left the project.");
  } catch (error) {
    console.error("Leave project error:", error);
    showNotice(error.message || "Could not leave the project.");
  } finally {
    setClosureLoading(false);
  }
}



  // =========================
  // LOAD STUDENTS
  // =========================

  useEffect(() => {
    async function loadStudents() {
      try {
        const response = await fetch(`${API}/students`);

        if (!response.ok) {
          throw new Error("Could not load students");
        }

        const data = await response.json();

        setDatabaseStudents(data);
        setStudentApiStatus("Connected");
      } catch (error) {
        setStudentApiStatus("Disconnected");
        console.error("Student API error:", error);
      }
    }

    loadStudents();
  }, []);

  // =========================
  // LOAD PROJECTS ON START
  // =========================

  useEffect(() => {
    if (!loggedInUser) return;

    loadProjects().catch((error) => {
      setProjectApiStatus("Disconnected");
      console.error("Project API error:", error);
    });
  }, [loggedInUser]);

  // =========================
  // LOAD REQUESTS FOR USER
  // =========================

 useEffect(() => {
  if (currentStudent?.id) {
    refreshRequests(currentStudent.id);
    refreshClosureNotifications(currentStudent.id);
  }
}, [currentStudent?.id]);

  // =========================
  // PROJECT DATA
  // =========================

  const projects = databaseProjects;
  const matchProjects = databaseProjects;

  const filteredProjects = projects.filter((project) => {
    const text = [
      project.title,
      project.description,
      project.department,
      project.category,
      ...(project.skills || []),
    ]
      .join(" ")
      .toLowerCase();

    if (
      page === "My Projects" &&
      !databaseProjects.some(
        (item) => String(item.id) === String(project.id)
      )
    ) {
      return false;
    }

    if (
      page === "My Projects" &&
      String(project.ownerId) !== String(currentStudent?.id)
    ) {
      return false;
    }

    if (
      page === "Saved" &&
      !saved.includes(String(project.id))
    ) {
      return false;
    }

    return text.includes(search.toLowerCase());
  });

  // =========================
  // SELECT MATCH PROJECT
  // =========================

  useEffect(() => {
    if (matchProjects.length === 0) return;

    const exists = matchProjects.some(
      (project) =>
        String(project.id) === selectedMatchProject
    );

    if (!selectedMatchProject || !exists) {
      setSelectedMatchProject(String(matchProjects[0].id));
    }
  }, [databaseProjects, selectedMatchProject]);

  // =========================
  // FIND TEAMMATES
  // =========================

  useEffect(() => {
    if (page !== "Find Teammates") return;

    const project = matchProjects.find(
      (item) =>
        String(item.id) === selectedMatchProject
    );

    if (!project || !project.skills?.length) {
      setMatchedStudents([]);
      setMatchingStatus("empty");
      return;
    }

    let cancelled = false;

    async function loadMatches() {
      setMatchingStatus("loading");
      setMatchedStudents([]);

      try {
        const skills = encodeURIComponent(
          project.skills.join(",")
        );

        const response = await fetch(
          `${API}/students/match?skills=${skills}`
        );

        if (!response.ok) {
          throw new Error("Could not load matches");
        }

        const data = await response.json();

        if (!cancelled) {
          setMatchedStudents(
            data.filter(
              (student) =>
                String(student.id) !==
                String(currentStudent?.id)
            )
          );

          setMatchingStatus("success");
        }
      } catch (error) {
        console.error(
          "Teammate matching error:",
          error
        );

        if (!cancelled) {
          setMatchingStatus("error");
        }
      }
    }

    loadMatches();

    return () => {
      cancelled = true;
    };
  }, [
    page,
    selectedMatchProject,
    databaseProjects,
    databaseStudents,
    currentStudent?.id,
  ]);

  // =========================
  // AI PROJECT ANALYSIS
  // =========================

  async function analyzeProject() {
    if (
      !form.title.trim() ||
      !form.description.trim()
    ) {
      showNotice(
        "Add a title and description first."
      );
      return;
    }

    setAnalyzing(true);
    setAnalysis(null);

    try {
      const response = await fetch(
        `${AI_API}/analyze-project`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: form.title.trim(),
            description: form.description.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "AI analysis failed."
        );
      }

      if (
        !Array.isArray(data.required_skills) ||
        !Array.isArray(data.suggested_roles)
      ) {
        throw new Error(
          "AI returned an unexpected response."
        );
      }

      setAnalysis({
        skills: data.required_skills,
        roles: data.suggested_roles,
        domain: data.domain,
        difficulty: data.difficulty,
        feasibility: data.feasibility,
        suggestions: Array.isArray(data.suggestions)
          ? data.suggestions
          : [],
      });

      showNotice(
        "AI project analysis completed!"
      );
    } catch (error) {
      console.error(
        "AI analysis error:",
        error
      );

      showNotice(
        error.message ||
          "Could not connect to the AI service."
      );
    } finally {
      setAnalyzing(false);
    }
  }

  // =========================
  // CREATE PROJECT
  // =========================

  async function createProject(event) {
    event.preventDefault();

    if (!currentStudent?.id) {
      showNotice(
        "Student profile not loaded. Check the backend."
      );
      return;
    }

    if (
      !form.title.trim() ||
      !form.description.trim()
    ) {
      showNotice(
        "Please complete the required fields."
      );
      return;
    }

    if (!analysis) {
      showNotice(
        "Analyze your project with AI before saving."
      );
      return;
    }

    const skills = analysis.skills.length
      ? analysis.skills
      : ["Research", "Problem Solving"];

    const newProject = {
      title: form.title.trim(),
      description: form.description.trim(),
      category:
        analysis.domain || "Interdisciplinary",
      department: form.department,
      members: 1,
      needed:
        analysis.roles[0] || skills[0],
      color: "green",
      skills,
      ownerId: currentStudent.id,
    };

    setLoading(true);

    try {
      const response = await fetch(
        `${API}/projects`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(newProject),
        }
      );

      if (!response.ok) {
        throw new Error(
          await response.text()
        );
      }

      await loadProjects();

      setPage("My Projects");
      setModal(false);

      setForm({
        title: "",
        description: "",
        department:
          currentStudent.department ||
          "AI & ML",
      });

      setAnalysis(null);
      setSearch("");

      showNotice(
        "Project saved to PostgreSQL!"
      );
    } catch (error) {
      console.error(
        "Project creation error:",
        error
      );

      showNotice(
        "Could not save project. Check the backend and database."
      );
    } finally {
      setLoading(false);
    }
  }

  // =========================
  // SAVE PROJECT
  // =========================

  function toggleSave(id) {
    const key = String(id);

    setSaved((current) =>
      current.includes(key)
        ? current.filter(
            (item) => item !== key
          )
        : [...current, key]
    );
  }

  // =========================
  // REQUEST TO JOIN
  // =========================

  async function requestToJoin(project) {
    if (!currentStudent?.id) {
      showNotice(
        "Your student profile has not loaded yet."
      );
      return;
    }

    const isDatabaseProject =
      databaseProjects.some(
        (item) =>
          String(item.id) ===
          String(project.id)
      );

    if (!isDatabaseProject) {
      showNotice(
        "This is a demo project. Request to join a project saved in the database."
      );
      return;
    }

    if (
      String(project.ownerId) ===
      String(currentStudent.id)
    ) {
      showNotice(
        "You cannot request to join your own project."
      );
      return;
    }

    const existing = requests.find(
      (request) =>
        String(request.projectId) ===
          String(project.id) &&
        request.status === "PENDING"
    );

    if (existing) {
      showNotice(
        "You already have a pending request for this project."
      );
      return;
    }

    setRequestLoading(
      String(project.id)
    );

    try {
      const response = await fetch(
        `${API}/join-requests`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
       body: JSON.stringify({
  projectId: String(project.id),
  projectTitle: project.title,
  studentId: currentStudent.id
}),
        }
      );

      const data =
        await response.json().catch(
          () => ({})
        );

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Could not send join request."
        );
      }

      await refreshRequests();

      showNotice(
        `Join request sent for ${project.title}!`
      );
    } catch (error) {
      showNotice(error.message);
    } finally {
      setRequestLoading(null);
    }
  }

  // =========================
  // WITHDRAW REQUEST
  // =========================

  async function withdrawRequest(request) {
    setRequestLoading(request.id);

    try {
      const response = await fetch(
        `${API}/join-requests/${request.id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error(
          "Could not withdraw this request."
        );
      }

      await refreshRequests();

      showNotice(
        "Join request withdrawn."
      );
    } catch (error) {
      showNotice(error.message);
    } finally {
      setRequestLoading(null);
    }
  }

  // =========================
  // ACCEPT / REJECT REQUEST
  // =========================

  async function reviewRequest(
    request,
    status
  ) {
    setRequestLoading(request.id);

    try {
      const response = await fetch(
        `${API}/join-requests/${request.id}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status,
          }),
        }
      );

      const data =
        await response.json().catch(
          () => ({})
        );

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Could not update the request."
        );
      }

    await refreshRequests();

if (status === "ACCEPTED") {
  await loadProjects();
}

showNotice(
  status === "ACCEPTED"
    ? "Join request accepted!"
    : "Join request rejected."
); 
    } catch (error) {
      showNotice(error.message);
    } finally {
      setRequestLoading(null);
    }
  }

  // =========================
  // NAVIGATION
  // =========================

  const navItems = [
    {
      name: "Discover",
      icon: "◈",
    },
    {
      name: "My Projects",
      icon: "▤",
    },
    {
      name: "Find Teammates",
      icon: "♧",
    },
    {
      name: "Join Requests",
      icon: "↗",
    },
    {
  name: "Notifications",
  icon: "♧",
},
    {
      name: "Saved",
      icon: "♡",
    },
  ];

  const pendingSent = requests.filter(
    (request) =>
      request.status === "PENDING"
  ).length;

  const pendingIncoming =
    incomingRequests.filter(
      (request) =>
        request.status === "PENDING"
    ).length;

  function requestStatusClass(status) {
    return `request-status ${String(
      status || "PENDING"
    ).toLowerCase()}`;
  }

  // =========================
  // SHOW LOGIN PAGE
  // =========================
if (!loggedInUser) {
  return page === "Signup" ? (
    <Signup
      onLogin={handleLogin}
      onBack={() => setPage("Login")}
    />
  ) : (
    <Login
      onLogin={handleLogin}
      onSignup={() => setPage("Signup")}
    />
  );
}
 

  // =========================
  // MAIN APP
  // =========================

  return (
    <div className="app-shell">

      {/* SIDEBAR */}

      <aside className="sidebar">

        <a
          className="brand"
          href="#home"
          onClick={(event) => {
            event.preventDefault();
            setPage("Discover");
          }}
        >
          <span className="brand-mark">
            m.
          </span>

          <span>
            MESH
            <span className="brand-period">
              .
            </span>
          </span>
        </a>

        

        <nav className="nav-list">
          {navItems.map((item) => (
            <button
              key={item.name}
              className={`nav-item ${
                page === item.name
                  ? "active"
                  : ""
              }`}
              onClick={() => {
                setPage(item.name);

                if (
                  item.name ===
                  "Join Requests"
                ) {
                  refreshRequests();
                }
              }}
              
            >
              <span className="nav-icon">
                {item.icon}
              </span>

              {item.name}

              {item.name === "Saved" &&
                saved.length > 0 && (
                  <span className="nav-count">
                    {saved.length}
                  </span>
                )}

              {item.name ===
                "Join Requests" &&
                pendingIncoming +
                  pendingSent >
                  0 && (
                  <span className="nav-count">
                    {pendingIncoming +
                      pendingSent}
                  </span>
                )}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">

          <div className="sidebar-tip">
            <div className="tip-icon">
              ✳
            </div>

            <strong>
              Great things happen together.
            </strong>

            <p>
              Your next breakthrough might
              come from a different department.
            </p>

            <button
              onClick={() =>
                setPage("Find Teammates")
              }
            >
              Find your people →
            </button>
          </div>

         
<div className="profile">

  <div className="avatar avatar-user">
    {(currentStudent?.name || "A")
      .charAt(0)
      .toUpperCase()}
  </div>

  <div className="profile-info">
    <strong>
      {currentStudent?.name || "Student User"}
    </strong>

    <span>
      {currentStudent?.department || "AI & ML"} · Student
    </span>
  </div>

</div>

<button
  className="logout-button"
  onClick={handleLogout}
  title="Log out"
>
  ↪ &nbsp; Log out
</button>

        </div>
      </aside>

      {/* MAIN AREA */}

      <main className="main-area">

        <header className="topbar">

        <div className="breadcrumb">
  <strong>{page}</strong>
</div>

          <div className="topbar-right">

            <span className="status-dot" />

            <span className="online-label">
              {projectApiStatus ===
              "Connected"
                ? "Database connected"
                : projectApiStatus}
            </span>

            <div className="avatar avatar-user small-avatar">
              {(
                currentStudent?.name || "A"
              )
                .charAt(0)
                .toUpperCase()}
            </div>

          </div>
        </header>

        <div className="page-content">

          {/* WELCOME */}

          <section className="welcome-row">

            <div>

              <div className="eyebrow">
                <span className="sparkle">
                  ✳
                </span>{" "}
                YOUR IDEAS, CONNECTED
              </div>

              <h1>
                Build beyond{" "}
                <span>boundaries.</span>
              </h1>

              <p className="subtitle">
                Great ideas need different
                perspectives. Find your people
                and make something meaningful.
              </p>

            </div>

            <button
              className="primary-button"
              onClick={() =>
                setModal(true)
              }
            >
              <span>＋</span>{" "}
              Create a project
            </button>

          </section>

          {/* STATS */}

          <section className="stats-grid">

            <div className="stat-card">

              <div className="stat-top">
                <span>
                  Discoverable projects
                </span>

                <span className="stat-icon green-icon">
                  ◈
                </span>
              </div>

              <div className="stat-number">
                {projects.length}
              </div>

              <div className="stat-foot">
                Ideas looking for
                collaborators
              </div>

            </div>

            <div className="stat-card">

              <div className="stat-top">
                <span>
                  Saved projects
                </span>

                <span className="stat-icon purple-icon">
                  ♡
                </span>
              </div>

              <div className="stat-number">
                {saved.length}
              </div>

              <div className="stat-foot">
                Ideas on your shortlist
              </div>

            </div>

            <div className="stat-card">

              <div className="stat-top">
                <span>
                  Pending join requests
                </span>

                <span className="stat-icon orange-icon">
                  ↗
                </span>
              </div>

              <div className="stat-number">
                {pendingSent +
                  pendingIncoming}
              </div>

              <div className="stat-foot">
                Sent: {pendingSent} ·
                Received:{" "}
                {pendingIncoming}
              </div>

            </div>

          </section>

          {/* JOIN REQUESTS */}

          {page === "Notifications" ? (
  <section className="section-block">
    <div className="section-heading">
      <div>
        <div className="eyebrow">PROJECT UPDATES</div>
        <h2>Closure notifications</h2>
        <p>Review project closure requests and make your decision.</p>
      </div>

      <button
        className="filter-button"
        onClick={() => refreshClosureNotifications()}
      >
        ↻ Refresh
      </button>
    </div>

    {closureNotifications.length === 0 ? (
      <div className="empty-state">
        <h3>You're all caught up!</h3>
        <p>Project closure requests sent to you will appear here.</p>
      </div>
    ) : (
      closureNotifications.map((notification) => (
        <article className="request-card" key={notification.voteId}>
          <h3>{notification.projectTitle}</h3>
          <p>
            Closure request status: {notification.closureStatus}
          </p>
          <p>Your response: {notification.voteStatus}</p>

          {notification.closureStatus === "PENDING" &&
            notification.voteStatus === "PENDING" && (
              <div className="request-actions">
                <button
                  className="primary-button"
                  disabled={closureLoading}
                  onClick={() =>
                    respondToClosure(notification, "APPROVED")
                  }
                >
                  Approve closure
                </button>

                <button
                  className="cancel-button"
                  disabled={closureLoading}
                  onClick={() =>
                    respondToClosure(notification, "REJECTED")
                  }
                >
                  Reject closure
                </button>
              </div>
            )}
        </article>
      ))
    )}
  </section>
) : page === "Join Requests" ? (

            <section className="section-block">

              <div className="section-heading">

                <div>

                  <div className="eyebrow">
                    TEAM FORMATION
                  </div>

                  <h2>
                    Your join requests
                  </h2>

                  <p>
                    Track projects you've
                    requested to join and
                    review requests for your
                    own projects.
                  </p>

                </div>

                <button
                  className="filter-button"
                  onClick={() =>
                    refreshRequests()
                  }
                >
                  ↻ Refresh
                </button>

              </div>

              <div className="request-columns">

                {/* SENT */}

                <div className="request-section">

                  <h3>
                    Requests you've sent
                  </h3>

                  <p className="request-help">
                    Withdraw a request while
                    it is still pending.
                  </p>

                  {requests.length === 0 ? (

                    <div className="empty-state">

                      <h3>
                        No sent requests yet
                      </h3>

                      <p>
                        Find a database project
                        and request to join its
                        team.
                      </p>

                      <button
                        className="secondary-button"
                        onClick={() =>
                          setPage("Discover")
                        }
                      >
                        Discover projects
                      </button>

                    </div>

                  ) : (

                    requests.map(
                      (request) => (

                        <article
                          className="request-card"
                          key={request.id}
                        >

                          <div className="request-card-top">

                            <div>

                              <span className="request-label">
                                PROJECT
                              </span>

                              <h4>
                                {
                                  request.projectTitle
                                }
                              </h4>

                                                        </div>

                            <p className="request-owner">
                              Project owner: {request.projectOwnerName || "Unknown"}
                              {request.projectOwnerName &&
                              request.projectOwnerName === currentStudent?.name
                                ? " (You)"
                                : ""}
                            </p>

                            <span
                              className={requestStatusClass(
                                request.status
                              )}
                              >
                            
                              {request.status}
                            </span>

                          </div>

                          <div className="request-actions">

                            {request.status ===
                              "PENDING" && (

                              <button
                                className="cancel-button"
                                disabled={
                                  requestLoading ===
                                  request.id
                                }
                                onClick={() =>
                                  withdrawRequest(
                                    request
                                  )
                                }
                              >
                                {requestLoading ===
                                request.id
                                  ? "Withdrawing..."
                                  : "Withdraw request"}
                              </button>

                            )}

                          </div>

                        </article>

                      )
                    )

                  )}

                </div>

                {/* RECEIVED */}

                <div className="request-section">

                  <h3>
                    Requests received
                  </h3>

                  <p className="request-help">
                    Review students who want
                    to join your projects.
                  </p>

                  {incomingRequests.length ===
                  0 ? (

                    <div className="empty-state">

                      <h3>
                        No incoming requests
                      </h3>

                      <p>
                        Requests for projects
                        you own will appear
                        here.
                      </p>

                    </div>

                  ) : (

                    incomingRequests.map(
                      (request) => (

                        <article
                          className="request-card"
                          key={request.id}
                        >

                          <div className="request-card-top">

                            <div>

                              <span className="request-label">
                                PROJECT
                              </span>

                              <h4>
                                {
                                  request.projectTitle
                                }
                              </h4>
                              <p className="request-owner">
  Project owner: {request.projectOwnerName || "Unknown"}
  {request.projectOwnerName &&
  request.projectOwnerName === currentStudent?.name
    ? " (You)"
    : ""}
</p>


                            </div>

                            <span
                              className={requestStatusClass(
                                request.status
                              )}
                            >
                              {request.status}
                            </span>

                          </div>

                          <p className="request-student">

                            <strong>
                              {request.studentName ||
                                "Student"}
                            </strong>

                            {request.studentDepartment
                              ? ` · ${request.studentDepartment}`
                              : ""}

                          </p>

                          {request.status ===
                            "PENDING" && (

                            <div className="request-actions">

                              <button
                                className="primary-button"
                                disabled={
                                  requestLoading ===
                                  request.id
                                }
                                onClick={() =>
                                  reviewRequest(
                                    request,
                                    "ACCEPTED"
                                  )
                                }
                              >
                                Accept
                              </button>

                              <button
                                className="cancel-button"
                                disabled={
                                  requestLoading ===
                                  request.id
                                }
                                onClick={() =>
                                  reviewRequest(
                                    request,
                                    "REJECTED"
                                  )
                                }
                              >
                                Reject
                              </button>

                            </div>

                          )}

                        </article>

                      )
                    )

                  )}

                </div>

              </div>

            </section>

          ) : page === "Find Teammates" ? (

            /* FIND TEAMMATES */

            <section className="section-block">

              <div className="section-heading">

                <div>

                  <div className="eyebrow">
                    CROSS-DEPARTMENT
                    CONNECTIONS
                  </div>

                  <h2>
                    Meet your future
                    teammates
                  </h2>

                  <p>
                    Discover people with
                    skills that complement
                    your ideas.
                  </p>

                </div>

              </div>

              <div className="filter-row">

                <div>

                  <label htmlFor="match-project">
                    Find teammates for:{" "}
                  </label>

                  <select
                    id="match-project"
                    className="filter-button"
                    value={
                      selectedMatchProject
                    }
                    onChange={(event) =>
                      setSelectedMatchProject(
                        event.target.value
                      )
                    }
                  >

                    {matchProjects.map(
                      (project) => (

                        <option
                          key={project.id}
                          value={String(
                            project.id
                          )}
                        >
                          {project.title}
                        </option>

                      )
                    )}

                  </select>

                </div>

              </div>

              {matchingStatus ===
                "loading" && (

                <div className="empty-state">

                  <h3>
                    Finding your teammates...
                  </h3>

                  <p>
                    Comparing project
                    requirements with
                    student skills.
                  </p>

                </div>

              )}

              {matchingStatus ===
                "error" && (

                <div className="empty-state">

                  <h3>
                    Couldn't load
                    recommendations
                  </h3>

                  <p>
                    Check that your Spring
                    Boot backend is running.
                  </p>

                  <button
                    className="secondary-button"
                    onClick={() =>
                      setPage("Discover")
                    }
                  >
                    Back to projects
                  </button>

                </div>

              )}

              {matchingStatus ===
                "success" &&
                matchedStudents.length >
                  0 && (

                  <div className="student-grid">

                    {matchedStudents.map(
                      (student, index) => {

                        const initials =
                          (
                            student.name ||
                            "ST"
                          )
                            .split(" ")
                            .map(
                              (part) =>
                                part[0]
                            )
                            .join("")
                            .slice(0, 2)
                            .toUpperCase();

                        const studentSkills =
                          Array.isArray(
                            student.skills
                          )
                            ? student.skills
                            : (
                                student.skills ||
                                ""
                              )
                                .split(",")
                                .map(
                                  (skill) =>
                                    skill.trim()
                                )
                                .filter(
                                  Boolean
                                );

                        const matchedSkills =
                          student.matchedSkills ||
                          [];

                        return (
                          <article
                            className="student-card"
                            key={
                              student.id
                            }
                          >

                            <div
                              className={`avatar student-avatar ${
                                [
                                  "peach",
                                  "lavender",
                                  "mint",
                                ][
                                  index % 3
                                ]
                              }`}
                            >
                              {initials}
                            </div>

                            <div
                              style={{
                                marginTop:
                                  "12px",
                                fontWeight:
                                  700,
                                color:
                                  "#287a52",
                              }}
                            >
                              {
                                student.matchPercentage ??
                                0
                              }
                              % skill match
                            </div>

                            <h3>
                              {student.name}
                            </h3>

                            <p>
                              {
                                student.department
                              }
                            </p>

                            <div className="skill-list">

                              {studentSkills.map(
                                (skill) => {

                                  const isMatched =
                                    matchedSkills.some(
                                      (matched) =>
                                        matched.toLowerCase() ===
                                        skill.toLowerCase()
                                    );

                                  return (
                                    <span
                                      className="skill-tag"
                                      key={
                                        skill
                                      }
                                      style={
                                        isMatched
                                          ? {
                                              background:
                                                "#e4f5e9",
                                              color:
                                                "#217346",
                                              border:
                                                "1px solid #b9e3c6",
                                            }
                                          : {}
                                      }
                                    >
                                      {isMatched
                                        ? "✓ "
                                        : ""}
                                      {skill}
                                    </span>
                                  );
                                }
                              )}

                            </div>

                            <p
                              style={{
                                marginTop:
                                  "12px",
                              }}
                            >
                              <strong>
                                Why recommended?
                              </strong>

                              <br />

                              {student.reason ||
                                "Skills complement this project."}
                            </p>

                          </article>
                        );
                      }
                    )}

                  </div>

                )}

              {matchingStatus ===
                "success" &&
                matchedStudents.length ===
                  0 && (

                  <div className="empty-state">

                    <h3>
                      No matching teammates yet
                    </h3>

                    <p>
                      Add student profiles with
                      complementary skills to see
                      recommendations.
                    </p>

                  </div>

                )}

            </section>

          ) : (

            /* PROJECT BOARD */

            <section className="section-block">

              <div className="section-heading">

                <div>

                  <div className="eyebrow">
                    THE COLLABORATION BOARD
                  </div>

                  <h2>

                    {page ===
                    "My Projects"
                      ? "Projects you've started"
                      : page === "Saved"
                      ? "Your saved ideas"
                      : "Ideas worth building"}

                  </h2>

                  <p>
                    Explore real-world ideas
                    that get better with
                    interdisciplinary teams.
                  </p>

                </div>

                <div className="project-count">
                  {filteredProjects.length}{" "}
                  projects
                </div>

              </div>

              <div className="filter-row">

                <div className="search-box">

                  <span>⌕</span>

                  <input
                    value={search}
                    onChange={(event) =>
                      setSearch(
                        event.target.value
                      )
                    }
                    placeholder="Search projects, skills, departments..."
                  />

                  <kbd>⌘ K</kbd>

                </div>

                <button
                  className="filter-button"
                  onClick={() =>
                    setSearch("")
                  }
                >
                  ↺ Reset
                </button>

              </div>

              <div className="project-grid">

                {filteredProjects.map(
                  (project) => {

                    const isDatabaseProject =
                      databaseProjects.some(
                        (item) =>
                          String(item.id) ===
                          String(project.id)
                      );

                    const isOwner =
                      String(
                        project.ownerId
                      ) ===
                      String(
                        currentStudent?.id
                      );

                    const sentRequest =
  requests.find(
    (request) =>
      String(request.projectId) ===
        String(project.id) &&
      request.status === "PENDING"
  );

const acceptedMembership = requests.find(
  (request) =>
    String(request.projectId) === String(project.id) &&
    request.status === "ACCEPTED"
);



                    return (
                      <article
                        className="project-card"
                        key={project.id}
                      >

                        <div
                          className={`project-art ${
                            project.color ||
                            "green"
                          }`}
                        >

                          <span className="art-symbol">

                            {project.color ===
                            "blue"
                              ? "⌁"
                              : project.color ===
                                "purple"
                              ? "✳"
                              : "⌘"}

                          </span>

                          <span className="category-pill">
                            {project.category ||
                              "Interdisciplinary"}
                          </span>

                          <button
                            className={`save-button ${
                              saved.includes(
                                String(
                                  project.id
                                )
                              )
                                ? "is-saved"
                                : ""
                            }`}
                            aria-label="Save project"
                            onClick={() =>
                              toggleSave(
                                project.id
                              )
                            }
                          >
                            {saved.includes(
                              String(
                                project.id
                              )
                            )
                              ? "♥"
                              : "♡"}
                          </button>

                        </div>

                        <div className="project-body">

                          <div className="project-meta">

                            <span className="department-label">
                              {
                                project.department
                              }
                            </span>

                            <span className="member-count">
                              ♧{" "}
                              {project.members ||
                                1}{" "}
                              members
                            </span>

                          </div>

                          <h3>
                            {project.title}
                          </h3>

                          <p className="project-description">
                            {
                              project.description
                            }
                          </p>

                          <div className="skill-list">

                            {(project.skills ||
                              [])
                              .slice(0, 4)
                              .map(
                                (skill) => (
                                  <span
                                    className="skill-tag"
                                    key={
                                      skill
                                    }
                                  >
                                    {skill}
                                  </span>
                                )
                              )}

                          </div>

                          <div className="project-divider" />

                          <div className="looking-for">

                            <div className="looking-icon">
                              ＋
                            </div>

                            <div>

                              <span>
                                LOOKING FOR
                              </span>

                              <strong>
                                {project.needed ||
                                  "Collaborators"}
                              </strong>

                            </div>

                          </div>

                          <button
                            className={`join-button ${
                              sentRequest
                                ? "requested"
                                : ""
                            }`}
                            disabled={
                              isOwner ||
                              !isDatabaseProject ||
                              Boolean(
                                sentRequest
                              ) ||
                              requestLoading ===
                                String(
                                  project.id
                                )
                            }
                            onClick={() =>
                              requestToJoin(
                                project
                              )
                            }
                            title={
                              !isDatabaseProject
                                ? "Demo projects cannot receive persistent requests"
                                : isOwner
                                ? "This is your project"
                                : ""
                            }
                          >

                            {isOwner
                              ? "Your project"
                              : !isDatabaseProject
                              ? "Demo project"
                              : requestLoading ===
                                String(
                                  project.id
                                )
                              ? "Sending..."
                              : sentRequest
                              ? "✓ Request sent"
                              : "Request to join ↗"}

                          </button>

                          {sentRequest && (

                            <button
                              className="cancel-button full-button"
                              disabled={
                                requestLoading ===
                                sentRequest.id
                              }
                              onClick={() =>
                                withdrawRequest(
                                  sentRequest
                                )
                              }
                            >
                              Withdraw request
                            </button>

                          )}
                          {isOwner && (
  <button
    className="cancel-button full-button"
    disabled={closureLoading}
    onClick={() => requestProjectClosure(project)}
  >
    {closureLoading ? "Processing..." : "Request project closure"}
  </button>
)}

{!isOwner && acceptedMembership && (
  <button
    className="cancel-button full-button"
    disabled={closureLoading}
    onClick={() => leaveProject(project)}
  >
    {closureLoading ? "Processing..." : "Leave project"}
  </button>
)}



                        </div>

                      </article>
                    );
                  }
                )}

              </div>

              {filteredProjects.length ===
                0 && (

                <div className="empty-state">

                  <div>◈</div>

                  <h3>
                    Nothing here just yet
                  </h3>

                  <p>
                    Try another search or
                    create a project of your
                    own.
                  </p>

                  <button
                    className="primary-button"
                    onClick={() =>
                      setModal(true)
                    }
                  >
                    ＋ Create a project
                  </button>

                </div>

              )}

            </section>

          )}

          {/* FOOTER */}

          <footer className="footer">

            <span>
              ◈ MESH{" "}
              <span className="footer-muted">
                — ideas grow together.
              </span>
            </span>

            <span>
              {projectApiStatus ===
              "Connected"
                ? "Connected to PostgreSQL through Spring Boot"
                : "Interdisciplinary collaboration"}
            </span>

          </footer>

        </div>
      </main>

      {/* TOAST */}

      {notice && (
        <div className="toast">
          ✓ &nbsp;{notice}
        </div>
      )}

      {/* CREATE PROJECT MODAL */}

      {modal && (

        <div
          className="modal-backdrop"
          onMouseDown={(event) => {
            if (
              event.target ===
                event.currentTarget &&
              !loading &&
              !analyzing
            ) {
              setModal(false);
            }
          }}
        >

          <form
            className="create-modal"
            onSubmit={createProject}
          >

            <div className="modal-header">

              <div>

                <div className="eyebrow">
                  LET'S BUILD SOMETHING
                </div>

                <h2>
                  Create a project
                </h2>

                <p>
                  Describe your idea.
                  Discover the skills your
                  team needs.
                </p>

              </div>

              <button
                type="button"
                className="close-button"
                onClick={() =>
                  !loading &&
                  !analyzing &&
                  setModal(false)
                }
              >
                ×
              </button>

            </div>

            <label htmlFor="project-title">
              Project title *
            </label>

            <input
              id="project-title"
              value={form.title}
              onChange={(event) => {
                setForm({
                  ...form,
                  title:
                    event.target.value,
                });

                setAnalysis(null);
              }}
              placeholder="e.g. AI-powered smart agriculture"
              required
            />

            <label htmlFor="project-department">
              Your department
            </label>

            <select
              id="project-department"
              value={form.department}
              onChange={(event) =>
                setForm({
                  ...form,
                  department:
                    event.target.value,
                })
              }
            >

              {departments.map(
                (department) => (
                  <option
                    key={department}
                  >
                    {department}
                  </option>
                )
              )}

            </select>

            <label htmlFor="project-description">
              Describe your idea *
            </label>

            <textarea
              id="project-description"
              value={form.description}
              onChange={(event) => {
                setForm({
                  ...form,
                  description:
                    event.target.value,
                });

                setAnalysis(null);
              }}
              placeholder="What problem will you solve? What do you want to build?"
              rows={4}
              required
            />

            <button
              type="button"
              className="analyze-button"
              onClick={analyzeProject}
              disabled={
                loading || analyzing
              }
            >
              {analyzing
                ? "✳ AI is analyzing..."
                : "✳ Analyze project skills with AI"}
            </button>

            {analysis && (

              <div className="analysis-panel">

                <strong>
                  AI Project Analysis
                </strong>

                <p>
                  <b>Domain:</b>{" "}
                  {analysis.domain}
                </p>

                <p>
                  <b>Difficulty:</b>{" "}
                  {analysis.difficulty}
                </p>

                <p>
                  <b>Required skills</b>
                </p>

                <div className="skill-list">

                  {analysis.skills.map(
                    (skill) => (
                      <span
                        className="skill-tag"
                        key={skill}
                      >
                        {skill}
                      </span>
                    )
                  )}

                </div>

                <p>
                  <b>
                    Suggested team roles
                  </b>
                </p>

                <div className="skill-list">

                  {analysis.roles.map(
                    (role) => (
                      <span
                        className="skill-tag"
                        key={role}
                      >
                        {role}
                      </span>
                    )
                  )}

                </div>

                <p>
                  <b>Feasibility:</b>{" "}
                  {analysis.feasibility}
                </p>

                {analysis.suggestions
                  .length > 0 && (
                  <>
                    <p>
                      <b>
                        AI suggestions
                      </b>
                    </p>

                    <ul>
                      {analysis.suggestions.map(
                        (
                          suggestion,
                          index
                        ) => (
                          <li
                            key={`${index}-${suggestion}`}
                          >
                            {suggestion}
                          </li>
                        )
                      )}
                    </ul>
                  </>
                )}

              </div>

            )}

            <div className="modal-actions">

              <button
                type="button"
                className="cancel-button"
                onClick={() =>
                  !loading &&
                  !analyzing &&
                  setModal(false)
                }
                disabled={
                  loading || analyzing
                }
              >
                Cancel
              </button>

              <button
                type="submit"
                className="primary-button"
                disabled={
                  loading || analyzing
                }
              >
                {loading
                  ? "Saving..."
                  : "Create project →"}
              </button>

            </div>

          </form>

        </div>

      )}

    </div>
  );
}

export default App;