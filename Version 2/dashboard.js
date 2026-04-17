const dashboardData = {
  daily: {
    metrics: [
      { label: "Project progress", value: 72, meta: "Short horizon delivery", color: "#2563eb" },
      { label: "Schedule adherence", value: 84, meta: "On-time tasks today", color: "#0f8b8d" },
      { label: "Task completion", value: 68, meta: "Daily task closure", color: "#61b15a" },
      { label: "Meeting efficiency", value: 58, meta: "Notes pending", color: "#e6a817" },
      { label: "Leave visibility", value: 90, meta: "No missing entries", color: "#e85d75" }
    ],
    risk: { headline: "Daily attention point", text: "One critical action needs follow-up before close of day." },
    capacity: { percent: 78, caption: "Using 78% of planned team capacity today." },
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
      { label: "Project progress", value: 65, meta: "Weekly portfolio status", color: "#2563eb" },
      { label: "Schedule adherence", value: 76, meta: "Milestone hit rate", color: "#0f8b8d" },
      { label: "Task completion", value: 59, meta: "Weekly closure trend", color: "#61b15a" },
      { label: "Meeting efficiency", value: 63, meta: "Minutes captured", color: "#e6a817" },
      { label: "Leave visibility", value: 88, meta: "Leave fully tracked", color: "#e85d75" }
    ],
    risk: { headline: "Weekly attention point", text: "Vendor approval and staffing gaps are affecting the weekly forecast." },
    capacity: { percent: 74, caption: "Using 74% of planned team capacity this week." },
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
      { label: "Project progress", value: 61, meta: "Monthly program status", color: "#2563eb" },
      { label: "Schedule adherence", value: 71, meta: "Delivery confidence", color: "#0f8b8d" },
      { label: "Task completion", value: 57, meta: "Monthly task closure", color: "#61b15a" },
      { label: "Meeting efficiency", value: 66, meta: "Reviews documented", color: "#e6a817" },
      { label: "Leave visibility", value: 93, meta: "All categories configured", color: "#e85d75" }
    ],
    risk: { headline: "Monthly attention point", text: "Long-range planning shows resource strain in shared delivery teams." },
    capacity: { percent: 82, caption: "Using 82% of planned team capacity this month." },
    chart: [
      { label: "Admin", value: 132 },
      { label: "Engineering", value: 167 },
      { label: "Field Ops", value: 148 },
      { label: "Support", value: 108 },
      { label: "Planning", value: 141 }
    ]
  }
};

const boardLabels = {
  daily: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  weekly: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  monthly: ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5", "Week 6", "Week 7"]
};

const defaultBoardItems = {
  daily: {
    Mon: [{ title: "Town Hall", note: "09:30 - 10:30", color: "#2563eb" }],
    Tue: [{ title: "Casual leave", note: "Anita", color: "#e6a817" }],
    Thu: [{ title: "Client demo", note: "Water board", color: "#e85d75" }]
  },
  weekly: {
    Mon: [{ title: "Portfolio review", note: "Leadership pack", color: "#2563eb" }],
    Wed: [{ title: "Steering committee", note: "Monthly checkpoint", color: "#e85d75" }],
    Fri: [{ title: "Payroll lock", note: "Holiday verification", color: "#6b7280" }]
  },
  monthly: {
    "Week 1": [{ title: "Project kickoff", note: "3 new mandates", color: "#2563eb" }],
    "Week 3": [{ title: "Executive review", note: "Progress narrative", color: "#173f9a" }],
    "Week 7": [{ title: "Public holiday", note: "National event", color: "#e6a817" }]
  }
};

const loginScreen = document.getElementById("loginScreen");
const appShell = document.getElementById("appShell");
const loginForm = document.getElementById("loginForm");
const loginUsername = document.getElementById("loginUsername");
const loginPassword = document.getElementById("loginPassword");
const loginError = document.getElementById("loginError");
const logoutBtn = document.getElementById("logoutBtn");
const currentUserLabel = document.getElementById("currentUserLabel");

const metricGrid = document.getElementById("metricGrid");
const healthBadges = document.getElementById("healthBadges");
const capacityFill = document.getElementById("capacityFill");
const capacityPercent = document.getElementById("capacityPercent");
const capacityCaption = document.getElementById("capacityCaption");
const scheduleBoard = document.getElementById("scheduleBoard");
const scheduleList = document.getElementById("scheduleList");
const holidayGrid = document.getElementById("holidayGrid");
const barChart = document.getElementById("barChart");
const riskHeadline = document.getElementById("riskHeadline");
const riskText = document.getElementById("riskText");
const serverStatus = document.getElementById("serverStatus");
const sidebarUsers = document.getElementById("sidebarUsers");
const sidebarProjects = document.getElementById("sidebarProjects");
const sidebarSchedules = document.getElementById("sidebarSchedules");
const modeButtons = [...document.querySelectorAll(".mode-pill")];

const scheduleForm = document.getElementById("scheduleForm");
const scheduleRangeInput = document.getElementById("scheduleRangeInput");
const scheduleDayInput = document.getElementById("scheduleDayInput");
const scheduleColorInput = document.getElementById("scheduleColorInput");
const scheduleTitleInput = document.getElementById("scheduleTitleInput");
const scheduleNoteInput = document.getElementById("scheduleNoteInput");
const scheduleSubmitBtn = document.getElementById("scheduleSubmitBtn");
const scheduleCancelBtn = document.getElementById("scheduleCancelBtn");

const holidayForm = document.getElementById("holidayForm");
const holidayNameInput = document.getElementById("holidayNameInput");
const holidayUsedInput = document.getElementById("holidayUsedInput");
const holidayTotalInput = document.getElementById("holidayTotalInput");
const holidaySubmitBtn = document.getElementById("holidaySubmitBtn");
const holidayCancelBtn = document.getElementById("holidayCancelBtn");

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

const SESSION_KEY = "scheduleTracker.session";

const state = {
  currentRange: "weekly",
  selectedMeetingId: null,
  editingScheduleId: null,
  editingHolidayId: null,
  holidays: [],
  meetings: [],
  todos: [],
  users: [],
  projects: [],
  schedules: [],
  authUser: null
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

function statusClass(status) {
  return status.toLowerCase().replaceAll(" ", "-");
}

function updateDayOptions(range) {
  scheduleDayInput.innerHTML = boardLabels[range]
    .map((day) => `<option value="${day}">${escapeHtml(day)}</option>`)
    .join("");
}

function renderHealth() {
  const counts = { offtrack: 0, risk: 0, healthy: 0, done: 0 };
  state.projects.forEach((project) => {
    if (project.status === "Off track") counts.offtrack += 1;
    else if (project.status === "At risk") counts.risk += 1;
    else if (project.status === "Completed") counts.done += 1;
    else counts.healthy += 1;
  });

  healthBadges.innerHTML = [
    { label: `${counts.offtrack} off track`, className: "offtrack" },
    { label: `${counts.risk} at risk`, className: "risk" },
    { label: `${counts.healthy} on track`, className: "healthy" },
    { label: `${counts.done} completed`, className: "done" }
  ].map((item) => `<span class="health-chip ${item.className}">${item.label}</span>`).join("");
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

function renderDashboard(range) {
  const data = dashboardData[range];
  metricGrid.innerHTML = data.metrics.map((metric) => `
    <article class="metric-card">
      <h3>${escapeHtml(metric.label)}</h3>
      <div class="gauge" style="--value:${metric.value}; --accent:${metric.color}" data-value="${metric.value}"></div>
      <div class="metric-meta">${escapeHtml(metric.meta)}</div>
    </article>
  `).join("");

  riskHeadline.textContent = data.risk.headline;
  riskText.textContent = data.risk.text;
  capacityPercent.textContent = `${data.capacity.percent}%`;
  capacityCaption.textContent = data.capacity.caption;
  capacityFill.style.width = `${data.capacity.percent}%`;
  renderHealth();
  renderScheduleBoard();
  renderBarChart(data.chart);
}

function renderScheduleBoard() {
  const labels = boardLabels[state.currentRange];
  const defaults = defaultBoardItems[state.currentRange];
  const userSchedules = state.schedules.filter((item) => item.range === state.currentRange);

  scheduleBoard.innerHTML = labels.map((label) => {
    const scheduleCards = userSchedules.filter((item) => item.day === label);
    const items = [...(defaults[label] || []), ...scheduleCards];
    return `
      <div class="day-column">
        <h3>${escapeHtml(label)}</h3>
        ${items.map((item) => `
          <div class="board-card" style="background:${item.color}">
            <strong>${escapeHtml(item.title)}</strong>
            <span>${escapeHtml(item.note)}</span>
          </div>
        `).join("")}
      </div>
    `;
  }).join("");
}

function resetScheduleForm() {
  state.editingScheduleId = null;
  scheduleSubmitBtn.textContent = "Add schedule";
  scheduleForm.reset();
  scheduleRangeInput.value = state.currentRange;
  updateDayOptions(scheduleRangeInput.value);
}

function renderScheduleList() {
  scheduleList.innerHTML = state.schedules.map((item) => `
    <article class="record-card">
      <div>
        <h3>${escapeHtml(item.title)}</h3>
        <p>${escapeHtml(item.range)} | ${escapeHtml(item.day)} | ${escapeHtml(item.note)}</p>
      </div>
      <div class="record-actions">
        <button class="mini-btn" type="button" data-edit-schedule="${item.id}">Edit</button>
        <button class="mini-btn danger" type="button" data-delete-schedule="${item.id}">Delete</button>
      </div>
    </article>
  `).join("");
}

function renderHolidays() {
  holidayGrid.innerHTML = state.holidays.map((holiday) => {
    const balance = Number(holiday.total) - Number(holiday.used);
    return `
      <article class="holiday-card">
        <div>
          <strong>${escapeHtml(holiday.name)}</strong>
          <span>${holiday.used} used out of ${holiday.total} days</span>
        </div>
        <div class="record-actions">
          <div class="holiday-balance">${balance}</div>
          <button class="mini-btn" type="button" data-edit-holiday="${holiday.id}">Edit</button>
        </div>
      </article>
    `;
  }).join("");
}

function resetHolidayForm() {
  state.editingHolidayId = null;
  holidaySubmitBtn.textContent = "Save leave type";
  holidayForm.reset();
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
  renderHealth();
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

function renderSidebar() {
  sidebarUsers.textContent = String(state.users.length);
  sidebarProjects.textContent = String(state.projects.length);
  sidebarSchedules.textContent = String(state.schedules.length);
  currentUserLabel.textContent = state.authUser?.username || "admin";
}

function showApp() {
  loginScreen.classList.add("hidden");
  appShell.classList.remove("hidden");
}

function showLogin() {
  appShell.classList.add("hidden");
  loginScreen.classList.remove("hidden");
}

async function bootstrapApp() {
  renderDashboard(state.currentRange);
  const data = await apiRequest("/api/bootstrap");
  state.holidays = data.holidays;
  state.meetings = data.meetings;
  state.todos = data.todos;
  state.users = data.users;
  state.projects = data.projects;
  state.schedules = data.schedules || [];
  state.selectedMeetingId = state.meetings[0]?.id || null;

  renderHolidays();
  renderUsers();
  renderProjects();
  renderTodos();
  renderMeetings();
  renderSidebar();
  renderScheduleBoard();
  renderScheduleList();
  serverStatus.textContent = "Connected to local backend on localhost. Shared records are saving into db.json.";
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  loginError.textContent = "";

  try {
    const result = await apiRequest("/api/login", {
      method: "POST",
      body: JSON.stringify({
        username: loginUsername.value.trim(),
        password: loginPassword.value
      })
    });
    state.authUser = result.user;
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(result.user));
    showApp();
    await bootstrapApp();
  } catch (error) {
    loginError.textContent = error.message;
  }
});

logoutBtn.addEventListener("click", () => {
  sessionStorage.removeItem(SESSION_KEY);
  state.authUser = null;
  showLogin();
});

modeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    state.currentRange = button.dataset.range;
    modeButtons.forEach((pill) => pill.classList.toggle("active", pill === button));
    scheduleRangeInput.value = state.currentRange;
    updateDayOptions(state.currentRange);
    renderDashboard(state.currentRange);
    renderScheduleList();
  });
});

scheduleRangeInput.addEventListener("change", () => {
  updateDayOptions(scheduleRangeInput.value);
});

scheduleForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const payload = {
    range: scheduleRangeInput.value,
    day: scheduleDayInput.value,
    title: scheduleTitleInput.value.trim(),
    note: scheduleNoteInput.value.trim(),
    color: scheduleColorInput.value
  };
  if (!payload.title || !payload.note) return;

  if (state.editingScheduleId) {
    const updated = await apiRequest(`/api/schedules/${state.editingScheduleId}`, {
      method: "PATCH",
      body: JSON.stringify(payload)
    });
    state.schedules = state.schedules.map((item) => item.id === updated.id ? updated : item);
  } else {
    const created = await apiRequest("/api/schedules", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    state.schedules.unshift(created);
  }

  resetScheduleForm();
  renderScheduleBoard();
  renderScheduleList();
  renderSidebar();
});

scheduleCancelBtn.addEventListener("click", resetScheduleForm);

scheduleList.addEventListener("click", async (event) => {
  const editId = event.target.getAttribute("data-edit-schedule");
  const deleteId = event.target.getAttribute("data-delete-schedule");

  if (editId) {
    const schedule = state.schedules.find((item) => item.id === Number(editId));
    if (!schedule) return;
    state.editingScheduleId = schedule.id;
    scheduleSubmitBtn.textContent = "Update schedule";
    scheduleRangeInput.value = schedule.range;
    updateDayOptions(schedule.range);
    scheduleDayInput.value = schedule.day;
    scheduleColorInput.value = schedule.color;
    scheduleTitleInput.value = schedule.title;
    scheduleNoteInput.value = schedule.note;
    return;
  }

  if (deleteId) {
    await apiRequest(`/api/schedules/${deleteId}`, { method: "DELETE" });
    state.schedules = state.schedules.filter((item) => item.id !== Number(deleteId));
    renderScheduleBoard();
    renderScheduleList();
    renderSidebar();
  }
});

holidayForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const payload = {
    name: holidayNameInput.value.trim(),
    used: Number(holidayUsedInput.value),
    total: Number(holidayTotalInput.value)
  };
  if (!payload.name || Number.isNaN(payload.used) || Number.isNaN(payload.total)) return;

  if (state.editingHolidayId) {
    const updated = await apiRequest(`/api/holidays/${state.editingHolidayId}`, {
      method: "PATCH",
      body: JSON.stringify(payload)
    });
    state.holidays = state.holidays.map((item) => item.id === updated.id ? updated : item);
  } else {
    const created = await apiRequest("/api/holidays", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    state.holidays.unshift(created);
  }

  resetHolidayForm();
  renderHolidays();
});

holidayCancelBtn.addEventListener("click", resetHolidayForm);

holidayGrid.addEventListener("click", (event) => {
  const editId = event.target.getAttribute("data-edit-holiday");
  if (!editId) return;

  const holiday = state.holidays.find((item) => item.id === Number(editId));
  if (!holiday) return;
  state.editingHolidayId = holiday.id;
  holidaySubmitBtn.textContent = "Update leave type";
  holidayNameInput.value = holiday.name;
  holidayUsedInput.value = holiday.used;
  holidayTotalInput.value = holiday.total;
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
  renderSidebar();
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
  renderSidebar();
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
  state.todos = state.todos.filter((todo) => todo.id !== Number(deleteId));
  renderTodos();
});

todoList.addEventListener("change", async (event) => {
  const todoId = event.target.getAttribute("data-id");
  if (!todoId) return;

  const updated = await apiRequest(`/api/todos/${todoId}`, {
    method: "PATCH",
    body: JSON.stringify({ done: event.target.checked })
  });
  state.todos = state.todos.map((todo) => todo.id === updated.id ? updated : todo);
  renderTodos();
});

meetingList.addEventListener("click", (event) => {
  const meetingItem = event.target.closest(".meeting-item");
  if (!meetingItem) return;
  state.selectedMeetingId = Number(meetingItem.dataset.id);
  renderMeetings();
});

saveNotesBtn.addEventListener("click", async () => {
  if (!state.selectedMeetingId) return;
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

async function init() {
  updateDayOptions(state.currentRange);
  scheduleRangeInput.value = state.currentRange;
  const savedSession = sessionStorage.getItem(SESSION_KEY);

  if (!savedSession) {
    showLogin();
    return;
  }

  state.authUser = JSON.parse(savedSession);
  showApp();
  try {
    await bootstrapApp();
  } catch (error) {
    serverStatus.textContent = `Backend connection failed: ${error.message}. Restart localhost and refresh.`;
  }
}

init();
