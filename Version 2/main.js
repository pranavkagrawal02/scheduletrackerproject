const dashboardData = {
  daily: {
    metrics: [
      { label: "Project progress", value: 72, meta: "3 active projects", color: "#2563eb" },
      { label: "Schedule adherence", value: 84, meta: "On-time tasks today", color: "#0f8b8d" },
      { label: "Task completion", value: 68, meta: "17 of 25 tasks closed", color: "#61b15a" },
      { label: "Meeting efficiency", value: 58, meta: "2 of 5 meetings need notes", color: "#e6a817" },
      { label: "Leave visibility", value: 90, meta: "No missing holiday entries", color: "#e85d75" }
    ],
    health: [
      { label: "2 off track", className: "offtrack" },
      { label: "1 at risk", className: "risk" },
      { label: "6 on track", className: "healthy" },
      { label: "8 completed", className: "done" }
    ],
    risk: { headline: "1 plan needs attention", text: "Budget review for Civic Portal rollout is due tomorrow." },
    capacity: { percent: 78, caption: "Using 78% of planned team capacity today." },
    board: [
      { day: "Mon", items: [{ title: "Town Hall", note: "09:30 - 10:30", color: "#2563eb" }, { title: "Sprint review", note: "Delivery check", color: "#61b15a" }] },
      { day: "Tue", items: [{ title: "Casual leave", note: "Anita", color: "#e6a817" }, { title: "Project sync", note: "Infra team", color: "#0f8b8d" }] },
      { day: "Wed", items: [{ title: "Audit prep", note: "Compliance docs", color: "#173f9a" }] },
      { day: "Thu", items: [{ title: "Client demo", note: "Water board", color: "#e85d75" }, { title: "Todo focus", note: "Finish 4 blockers", color: "#61b15a" }] },
      { day: "Fri", items: [{ title: "WFH roster", note: "3 approved", color: "#2563eb" }, { title: "Meeting notes", note: "Publish summary", color: "#0f8b8d" }] },
      { day: "Sat", items: [{ title: "Maintenance", note: "Low traffic window", color: "#6b7280" }] },
      { day: "Sun", items: [{ title: "Holiday", note: "Restricted leave", color: "#e6a817" }] }
    ],
    chart: [
      { label: "Admin", value: 6.5 },
      { label: "Engineering", value: 8.2 },
      { label: "Field Ops", value: 7.1 },
      { label: "Support", value: 5.4 },
      { label: "Planning", value: 6.8 }
    ]
  },
  weekly: {
    metrics: [
      { label: "Project progress", value: 65, meta: "8 tracked projects", color: "#2563eb" },
      { label: "Schedule adherence", value: 76, meta: "32 milestone events", color: "#0f8b8d" },
      { label: "Task completion", value: 59, meta: "146 of 247 tasks closed", color: "#61b15a" },
      { label: "Meeting efficiency", value: 63, meta: "Notes added for 19 meetings", color: "#e6a817" },
      { label: "Leave visibility", value: 88, meta: "All leave types reviewed", color: "#e85d75" }
    ],
    health: [
      { label: "2 off track", className: "offtrack" },
      { label: "4 at risk", className: "risk" },
      { label: "12 on track", className: "healthy" },
      { label: "10 completed", className: "done" }
    ],
    risk: { headline: "4 projects need intervention", text: "Vendor approval and staffing gaps are affecting the weekly forecast." },
    capacity: { percent: 74, caption: "Using 74% of planned team capacity this week." },
    board: [
      { day: "Mon", items: [{ title: "Portfolio review", note: "Leadership pack", color: "#2563eb" }, { title: "Daily roster", note: "45 entries", color: "#0f8b8d" }] },
      { day: "Tue", items: [{ title: "Annual leave", note: "4 approved", color: "#e6a817" }, { title: "Design workshop", note: "Phase 2 planning", color: "#61b15a" }] },
      { day: "Wed", items: [{ title: "Steering committee", note: "Monthly checkpoint", color: "#e85d75" }, { title: "Inspection plan", note: "Gov operations", color: "#173f9a" }] },
      { day: "Thu", items: [{ title: "Release prep", note: "Portal upgrade", color: "#2563eb" }] },
      { day: "Fri", items: [{ title: "Payroll lock", note: "Holiday verification", color: "#6b7280" }, { title: "Meeting digest", note: "Send recap", color: "#0f8b8d" }] },
      { day: "Sat", items: [{ title: "Comp off tracker", note: "2 pending requests", color: "#61b15a" }] },
      { day: "Sun", items: [{ title: "Restricted holiday", note: "Regional office", color: "#e6a817" }] }
    ],
    chart: [
      { label: "Admin", value: 32 },
      { label: "Engineering", value: 41 },
      { label: "Field Ops", value: 38 },
      { label: "Support", value: 26 },
      { label: "Planning", value: 34 }
    ]
  },
  monthly: {
    metrics: [
      { label: "Project progress", value: 61, meta: "18 programs in view", color: "#2563eb" },
      { label: "Schedule adherence", value: 71, meta: "Monthly delivery confidence", color: "#0f8b8d" },
      { label: "Task completion", value: 57, meta: "642 of 1134 tasks closed", color: "#61b15a" },
      { label: "Meeting efficiency", value: 66, meta: "Major reviews documented", color: "#e6a817" },
      { label: "Leave visibility", value: 93, meta: "All holiday categories configured", color: "#e85d75" }
    ],
    health: [
      { label: "3 off track", className: "offtrack" },
      { label: "6 at risk", className: "risk" },
      { label: "24 on track", className: "healthy" },
      { label: "15 completed", className: "done" }
    ],
    risk: { headline: "6 initiatives need review", text: "Long-range planning shows resource strain in two shared delivery teams." },
    capacity: { percent: 82, caption: "Using 82% of planned team capacity this month." },
    board: [
      { day: "Week 1", items: [{ title: "Project kickoff", note: "3 new mandates", color: "#2563eb" }, { title: "Leave calendar", note: "Publish month plan", color: "#0f8b8d" }] },
      { day: "Week 2", items: [{ title: "Sick leave audit", note: "HR handoff", color: "#e6a817" }, { title: "Budget check", note: "Capital works", color: "#61b15a" }] },
      { day: "Week 3", items: [{ title: "Executive review", note: "Progress narrative", color: "#173f9a" }, { title: "Meeting cluster", note: "Quarter close", color: "#e85d75" }] },
      { day: "Week 4", items: [{ title: "Holiday balance", note: "Carry forward", color: "#2563eb" }, { title: "Task cleanup", note: "Archive completed", color: "#6b7280" }] },
      { day: "Week 5", items: [{ title: "Release board", note: "Approvals", color: "#0f8b8d" }] },
      { day: "Week 6", items: [{ title: "Comp off review", note: "Manager signoff", color: "#61b15a" }] },
      { day: "Week 7", items: [{ title: "Public holiday", note: "National event", color: "#e6a817" }] }
    ],
    chart: [
      { label: "Admin", value: 132 },
      { label: "Engineering", value: 167 },
      { label: "Field Ops", value: 148 },
      { label: "Support", value: 108 },
      { label: "Planning", value: 141 }
    ]
  }
};

const metricGrid = document.getElementById("metricGrid");
const healthBadges = document.getElementById("healthBadges");
const capacityFill = document.getElementById("capacityFill");
const capacityPercent = document.getElementById("capacityPercent");
const capacityCaption = document.getElementById("capacityCaption");
const scheduleBoard = document.getElementById("scheduleBoard");
const holidayGrid = document.getElementById("holidayGrid");
const barChart = document.getElementById("barChart");
const riskHeadline = document.getElementById("riskHeadline");
const riskText = document.getElementById("riskText");
const serverStatus = document.getElementById("serverStatus");
const modeButtons = [...document.querySelectorAll(".mode-pill")];

const userForm = document.getElementById("userForm");
const userNameInput = document.getElementById("userNameInput");
const userRoleInput = document.getElementById("userRoleInput");
const userTypeInput = document.getElementById("userTypeInput");
const userList = document.getElementById("userList");

const projectForm = document.getElementById("projectForm");
const projectNameInput = document.getElementById("projectNameInput");
const projectOwnerInput = document.getElementById("projectOwnerInput");
const projectStatusInput = document.getElementById("projectStatusInput");
const projectList = document.getElementById("projectList");

const todoForm = document.getElementById("todoForm");
const todoInput = document.getElementById("todoInput");
const todoList = document.getElementById("todoList");

const meetingList = document.getElementById("meetingList");
const meetingTitle = document.getElementById("meetingTitle");
const meetingMeta = document.getElementById("meetingMeta");
const meetingNotes = document.getElementById("meetingNotes");
const saveNotesBtn = document.getElementById("saveNotesBtn");

const state = {
  currentRange: "weekly",
  selectedMeetingId: null,
  holidays: [],
  meetings: [],
  todos: [],
  users: [],
  projects: []
};

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

async function apiRequest(path, options = {}) {
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Request failed" }));
    throw new Error(error.error || "Request failed");
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

function renderDashboard(range) {
  const data = dashboardData[range];
  metricGrid.innerHTML = data.metrics.map((metric) => `
    <article class="metric-card">
      <h3>${escapeHtml(metric.label)}</h3>
      <div class="gauge" style="--value:${metric.value}; --accent:${metric.color}" data-value="${metric.value}"></div>
      <div class="metric-meta">${escapeHtml(metric.meta)}</div>
    </article>
  `).join("");

  healthBadges.innerHTML = data.health.map((item) => `<span class="health-chip ${item.className}">${escapeHtml(item.label)}</span>`).join("");
  riskHeadline.textContent = data.risk.headline;
  riskText.textContent = data.risk.text;
  capacityPercent.textContent = `${data.capacity.percent}%`;
  capacityCaption.textContent = data.capacity.caption;
  capacityFill.style.width = `${data.capacity.percent}%`;

  scheduleBoard.innerHTML = data.board.map((column) => `
    <div class="day-column">
      <h3>${escapeHtml(column.day)}</h3>
      ${column.items.map((item) => `
        <div class="board-card" style="background:${item.color}">
          <strong>${escapeHtml(item.title)}</strong>
          <span>${escapeHtml(item.note)}</span>
        </div>
      `).join("")}
    </div>
  `).join("");

  renderBarChart(data.chart);
}

function renderBarChart(items) {
  const max = Math.max(...items.map((item) => item.value));
  const chartHeight = 180;
  const leftPad = 50;
  const bottom = 190;
  const barWidth = 52;
  const gap = 28;

  const gridLines = [0.25, 0.5, 0.75, 1].map((factor) => {
    const y = bottom - chartHeight * factor;
    return `<line x1="${leftPad - 12}" y1="${y}" x2="430" y2="${y}" stroke="rgba(21,35,59,0.12)" stroke-dasharray="4 6" /><text x="8" y="${y + 4}" fill="#5f6c82" font-size="11">${Math.round(max * factor)}</text>`;
  }).join("");

  const bars = items.map((item, index) => {
    const height = (item.value / max) * chartHeight;
    const x = leftPad + index * (barWidth + gap);
    const y = bottom - height;
    return `<rect x="${x}" y="${y}" width="${barWidth}" height="${height}" rx="14" fill="url(#barGradient)" /><text x="${x + barWidth / 2}" y="${y - 8}" text-anchor="middle" fill="#15233b" font-size="12" font-weight="700">${item.value}</text><text x="${x + barWidth / 2}" y="210" text-anchor="middle" fill="#5f6c82" font-size="12">${escapeHtml(item.label)}</text>`;
  }).join("");

  barChart.innerHTML = `<defs><linearGradient id="barGradient" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#2563eb" /><stop offset="100%" stop-color="#0f8b8d" /></linearGradient></defs>${gridLines}<line x1="${leftPad - 12}" y1="${bottom}" x2="430" y2="${bottom}" stroke="rgba(21,35,59,0.16)" />${bars}`;
}

function renderHolidays() {
  holidayGrid.innerHTML = state.holidays.map((holiday) => {
    const balance = holiday.total - holiday.used;
    return `<article class="holiday-card"><div><strong>${escapeHtml(holiday.name)}</strong><span>${holiday.used} used out of ${holiday.total} days</span></div><div class="holiday-balance">${balance}</div></article>`;
  }).join("");
}

function renderUsers() {
  projectOwnerInput.innerHTML = state.users.map((user) => `<option value="${user.id}">${escapeHtml(user.name)}</option>`).join("");
  userList.innerHTML = state.users.map((user) => `
    <article class="record-card">
      <div>
        <h3>${escapeHtml(user.name)}</h3>
        <p>${escapeHtml(user.role)} | ${escapeHtml(user.type)}</p>
      </div>
      <span class="record-tag completed">${escapeHtml(user.type)}</span>
    </article>
  `).join("");
}

function statusClass(status) {
  return status.toLowerCase().replaceAll(" ", "-");
}

function renderProjects() {
  const usersById = Object.fromEntries(state.users.map((user) => [user.id, user]));
  projectList.innerHTML = state.projects.map((project) => `
    <article class="record-card">
      <div>
        <h3>${escapeHtml(project.name)}</h3>
        <p>Owner: ${escapeHtml(usersById[project.ownerId]?.name || "Unassigned")}</p>
      </div>
      <span class="record-tag ${statusClass(project.status)}">${escapeHtml(project.status)}</span>
    </article>
  `).join("");
}

function renderTodos() {
  todoList.innerHTML = state.todos.map((todo) => `
    <li class="todo-item ${todo.done ? "done" : ""}">
      <label>
        <input type="checkbox" data-id="${todo.id}" ${todo.done ? "checked" : ""}>
        <span>${escapeHtml(todo.text)}</span>
      </label>
      <button type="button" data-delete="${todo.id}">Delete</button>
    </li>
  `).join("");
}

function renderMeetings() {
  meetingList.innerHTML = state.meetings.map((meeting) => `
    <article class="meeting-item ${meeting.id === state.selectedMeetingId ? "active" : ""}" data-id="${meeting.id}">
      <h3>${escapeHtml(meeting.title)}</h3>
      <p>${escapeHtml(meeting.meta)}</p>
    </article>
  `).join("");

  const selectedMeeting = state.meetings.find((meeting) => meeting.id === state.selectedMeetingId);
  if (!selectedMeeting) {
    meetingTitle.textContent = "No meeting selected";
    meetingMeta.textContent = "Choose any meeting from the list.";
    meetingNotes.value = "";
    return;
  }

  meetingTitle.textContent = selectedMeeting.title;
  meetingMeta.textContent = selectedMeeting.meta;
  meetingNotes.value = selectedMeeting.notes;
}

modeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    state.currentRange = button.dataset.range;
    modeButtons.forEach((pill) => pill.classList.toggle("active", pill === button));
    renderDashboard(state.currentRange);
  });
});

userForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const name = userNameInput.value.trim();
  const role = userRoleInput.value.trim();
  const type = userTypeInput.value;
  if (!name || !role) return;

  const user = await apiRequest("/api/users", {
    method: "POST",
    body: JSON.stringify({ name, role, type })
  });
  state.users.unshift(user);
  renderUsers();
  renderProjects();
  userForm.reset();
});

projectForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const name = projectNameInput.value.trim();
  const ownerId = Number(projectOwnerInput.value);
  const status = projectStatusInput.value;
  if (!name || !ownerId) return;

  const project = await apiRequest("/api/projects", {
    method: "POST",
    body: JSON.stringify({ name, ownerId, status })
  });
  state.projects.unshift(project);
  renderProjects();
  projectForm.reset();
  projectOwnerInput.value = String(ownerId);
});

todoForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const text = todoInput.value.trim();
  if (!text) return;

  const todo = await apiRequest("/api/todos", {
    method: "POST",
    body: JSON.stringify({ text })
  });
  state.todos.unshift(todo);
  renderTodos();
  todoForm.reset();
});

todoList.addEventListener("click", async (event) => {
  const deleteId = event.target.getAttribute("data-delete");
  if (!deleteId) return;

  await apiRequest(`/api/todos/${deleteId}`, { method: "DELETE" });
  state.todos = state.todos.filter((todo) => String(todo.id) !== deleteId);
  renderTodos();
});

todoList.addEventListener("change", async (event) => {
  const todoId = event.target.getAttribute("data-id");
  if (!todoId) return;

  const updated = await apiRequest(`/api/todos/${todoId}`, {
    method: "PATCH",
    body: JSON.stringify({ done: event.target.checked })
  });
  state.todos = state.todos.map((todo) => String(todo.id) === todoId ? updated : todo);
  renderTodos();
});

meetingList.addEventListener("click", (event) => {
  const meetingItem = event.target.closest(".meeting-item");
  if (!meetingItem) return;

  state.selectedMeetingId = Number(meetingItem.dataset.id);
  renderMeetings();
});

saveNotesBtn.addEventListener("click", async () => {
  const updated = await apiRequest(`/api/meetings/${state.selectedMeetingId}`, {
    method: "PATCH",
    body: JSON.stringify({ notes: meetingNotes.value })
  });
  state.meetings = state.meetings.map((meeting) => meeting.id === updated.id ? updated : meeting);
  renderMeetings();
  saveNotesBtn.textContent = "Saved";
  window.setTimeout(() => {
    saveNotesBtn.textContent = "Save notes";
  }, 1200);
});

async function loadApp() {
  renderDashboard(state.currentRange);

  try {
    const data = await apiRequest("/api/bootstrap");
    state.holidays = data.holidays;
    state.meetings = data.meetings;
    state.todos = data.todos;
    state.users = data.users;
    state.projects = data.projects;
    state.selectedMeetingId = state.meetings[0]?.id || null;

    renderHolidays();
    renderUsers();
    renderProjects();
    renderTodos();
    renderMeetings();
    serverStatus.textContent = "Connected to local backend on localhost. Shared data is now saved in db.json.";
  } catch (error) {
    serverStatus.textContent = `Backend connection failed: ${error.message}. Start the local server and refresh.`;
  }
}

loadApp();
