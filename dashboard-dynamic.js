const SESSION_KEY = "scheduleTracker.session";

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
  daily: { Mon: [{ title: "Town Hall", note: "09:30 - 10:30", color: "#2563eb" }], Tue: [{ title: "Casual leave", note: "Anita", color: "#e6a817" }], Thu: [{ title: "Client demo", note: "Water board", color: "#e85d75" }] },
  weekly: { Mon: [{ title: "Portfolio review", note: "Leadership pack", color: "#2563eb" }], Wed: [{ title: "Steering committee", note: "Monthly checkpoint", color: "#e85d75" }], Fri: [{ title: "Payroll lock", note: "Holiday verification", color: "#6b7280" }] },
  monthly: { "Week 1": [{ title: "Project kickoff", note: "3 new mandates", color: "#2563eb" }], "Week 3": [{ title: "Executive review", note: "Progress narrative", color: "#173f9a" }], "Week 7": [{ title: "Public holiday", note: "National event", color: "#e6a817" }] }
};

const defaultHeroProjects = [
  { name: "District Attendance Portal", owner: "Planning Cell", status: "Pending review" },
  { name: "Leave Approval Workflow", owner: "HR Operations", status: "In progress" },
  { name: "Meeting Notes Archive", owner: "Admin Support", status: "Ready for update" }
];

const defaultOrganizationChart = {
  name: "Mr. Rupanjay",
  designation: "Director",
  children: [
    {
      name: "Mr. Basu",
      designation: "Manager",
      children: [
        { name: "Mr. Shivam", designation: "Employee" }
      ]
    },
    {
      name: "Mr. Kismat",
      designation: "Manager",
      children: [
        { name: "Mr. Pranav", designation: "Employee" },
        { name: "Mr. Ravi", designation: "Employee" },
        { name: "Mr. Rishkesh", designation: "Employee" },
        { name: "Mr. Samast", designation: "Employee" },
        { name: "Mr. Harshita", designation: "Employee" }
      ]
    },
    {
      name: "Mr. Vinod",
      designation: "Manager",
      children: [
        { name: "Mr. Vishal", designation: "Employee" },
        { name: "Mr. Divesh", designation: "Employee" },
        { name: "Mr. Anivesh", designation: "Employee" }
      ]
    }
  ]
};

const state = {
  currentRange: "weekly",
  currentView: "dashboard",
  currentWorkspaceTabId: null,
  selectedMeetingId: null,
  editingScheduleId: null,
  editingHolidayId: null,
  editingFinanceId: null,
  holidays: [],
  meetings: [],
  todos: [],
  users: [],
  projects: [],
  schedules: [],
  finances: [],
  authUser: null,
  openWorkspaceTabs: {
    schedules: [],
    projects: [],
    leave: [],
    meetings: []
  }
};

const workspaceDefinitions = {
  schedules: {
    base: {
      id: "schedules-home",
      label: "Schedules"
    },
    options: [
      { id: "schedule-templates", label: "Templates", title: "Schedule templates", text: "Create reusable shift, routine, or sprint templates for the schedule workspace." },
      { id: "schedule-automation", label: "Automation", title: "Schedule automation", text: "Add future automation rules such as recurring plans, reminders, and auto-fill schedule blocks." },
      { id: "schedule-insights", label: "Insights", title: "Schedule insights", text: "Open a future analytics tab for schedule load, conflicts, and plan coverage." }
    ]
  },
  projects: {
    base: {
      id: "projects-home",
      label: "Projects"
    },
    options: [
      { id: "project-finance", label: "Finance view", title: "Project finance workspace", text: "Open a dedicated finance-focused project tab with budgets, expenses, and approvals." },
      { id: "project-risk", label: "Risk register", title: "Project risk register", text: "Track risk logs, owners, mitigation plans, and delivery escalations in a future tab." },
      { id: "project-files", label: "Project files", title: "Project files", text: "Keep room for project documents, references, and attachments in a future workspace tab." }
    ]
  },
  leave: {
    base: {
      id: "leave-home",
      label: "Leave"
    },
    options: [
      { id: "leave-policy", label: "Policy", title: "Leave policy tab", text: "Add leave policy definitions, rules, and carry-forward settings in a future tab." },
      { id: "leave-requests", label: "Requests", title: "Leave requests", text: "Use this future tab for request queues, approvals, and review history." },
      { id: "leave-calendar", label: "Calendar", title: "Leave calendar", text: "Open a future team leave calendar with conflicts and availability overlays." }
    ]
  },
  meetings: {
    base: {
      id: "meetings-home",
      label: "Meetings"
    },
    options: [
      { id: "meeting-agendas", label: "Agendas", title: "Meeting agendas", text: "Keep agenda building, preparation lists, and time blocks in a future meeting tab." },
      { id: "meeting-actions", label: "Action tracker", title: "Meeting action tracker", text: "Track action items, owners, and due dates in a dedicated future workspace tab." },
      { id: "meeting-archive", label: "Archive", title: "Meeting archive", text: "Open a future archive tab for old meeting notes, summaries, and decisions." }
    ]
  }
};

const viewPanels = [...document.querySelectorAll(".view-panel")];
const navLinks = [...document.querySelectorAll(".nav-link")];
const welcomeTitle = document.getElementById("welcomeTitle");
const metricGrid = document.getElementById("metricGrid");
const projectStatusList = document.getElementById("projectStatusList");
const capacityFill = document.getElementById("capacityFill");
const capacityPercent = document.getElementById("capacityPercent");
const capacityCaption = document.getElementById("capacityCaption");
const scheduleBoard = document.getElementById("scheduleBoard");
const scheduleList = document.getElementById("scheduleList");
const holidayGrid = document.getElementById("holidayGrid");
const barChart = document.getElementById("barChart");
const upcomingTaskTitle = document.getElementById("upcomingTaskTitle");
const upcomingTaskMeta = document.getElementById("upcomingTaskMeta");
const upcomingMeetingTitle = document.getElementById("upcomingMeetingTitle");
const upcomingMeetingMeta = document.getElementById("upcomingMeetingMeta");
const upcomingMeetingCountdown = document.getElementById("upcomingMeetingCountdown");
const upcomingMeetingCountdownMeta = document.getElementById("upcomingMeetingCountdownMeta");
const currentUserLabel = document.getElementById("currentUserLabel");
const logoutBtn = document.getElementById("logoutBtn");
const modeButtons = [...document.querySelectorAll(".mode-pill")];
const scopeButtons = [...document.querySelectorAll(".scope-chip")];
const heroProjectList = document.getElementById("heroProjectList");
const organizationTree = document.getElementById("organizationTree");
const workspaceTabs = document.getElementById("workspaceTabs");
const workspaceTabList = document.getElementById("workspaceTabList");
const workspaceAddBtn = document.getElementById("workspaceAddBtn");
const workspaceMenu = document.getElementById("workspaceMenu");
const workspacePlaceholder = document.getElementById("workspacePlaceholder");
const workspacePlaceholderKicker = document.getElementById("workspacePlaceholderKicker");
const workspacePlaceholderTitle = document.getElementById("workspacePlaceholderTitle");
const workspacePlaceholderText = document.getElementById("workspacePlaceholderText");
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
const financeForm = document.getElementById("financeForm");
const financeProjectInput = document.getElementById("financeProjectInput");
const financeTypeInput = document.getElementById("financeTypeInput");
const financeAmountInput = document.getElementById("financeAmountInput");
const financeStatusInput = document.getElementById("financeStatusInput");
const financeNoteInput = document.getElementById("financeNoteInput");
const financeSubmitBtn = document.getElementById("financeSubmitBtn");
const financeCancelBtn = document.getElementById("financeCancelBtn");
const financeList = document.getElementById("financeList");
const todoForm = document.getElementById("todoForm");
const todoInput = document.getElementById("todoInput");
const todoList = document.getElementById("todoList");
const meetingList = document.getElementById("meetingList");
const meetingTitle = document.getElementById("meetingTitle");
const meetingMeta = document.getElementById("meetingMeta");
const meetingNotes = document.getElementById("meetingNotes");
const saveNotesBtn = document.getElementById("saveNotesBtn");

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
  if (response.status === 204) return null;
  return response.json();
}

function statusClass(status) {
  return status.toLowerCase().replaceAll(" ", "-");
}

function formatMoney(amount) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(amount || 0));
}

function updateDayOptions(range) {
  scheduleDayInput.innerHTML = boardLabels[range].map((day) => `<option value="${day}">${escapeHtml(day)}</option>`).join("");
}

function parseClockTime(text) {
  const match = String(text || "").match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) {
    return null;
  }

  let hours = Number(match[1]) % 12;
  const minutes = Number(match[2]);
  if (match[3].toUpperCase() === "PM") {
    hours += 12;
  }
  return { hours, minutes };
}

function nextWeekdayDate(now, weekdayName, fallbackTime) {
  const weekdayMap = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6
  };
  const targetDay = weekdayMap[String(weekdayName || "").toLowerCase()];
  if (targetDay === undefined) {
    return null;
  }

  const next = new Date(now);
  const currentDay = now.getDay();
  let offset = (targetDay - currentDay + 7) % 7;
  next.setDate(now.getDate() + offset);
  next.setHours(fallbackTime.hours, fallbackTime.minutes, 0, 0);
  if (next <= now) {
    next.setDate(next.getDate() + 7);
  }
  return next;
}

function inferMeetingDate(meeting) {
  const now = new Date();
  const clockTime = parseClockTime(meeting.meta);
  if (clockTime) {
    const next = new Date(now);
    next.setHours(clockTime.hours, clockTime.minutes, 0, 0);
    if (next <= now) {
      next.setDate(next.getDate() + 1);
    }
    return next;
  }

  const weekdayMatch = String(meeting.meta || "").match(/^(Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday)\b/i);
  if (weekdayMatch) {
    return nextWeekdayDate(now, weekdayMatch[1], { hours: 17, minutes: 0 });
  }

  return null;
}

function formatTimeDistance(targetDate) {
  if (!targetDate) {
    return "Time not set";
  }

  const diffMs = targetDate.getTime() - Date.now();
  const totalMinutes = Math.max(0, Math.round(diffMs / 60000));
  if (totalMinutes < 60) {
    return `In ${totalMinutes} min`;
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (!minutes) {
    return `In ${hours} hour${hours === 1 ? "" : "s"}`;
  }
  return `In ${hours}h ${minutes}m`;
}

function formatMeetingDate(targetDate) {
  if (!targetDate) {
    return "Add a meeting time to get a live countdown.";
  }

  return targetDate.toLocaleString("en-IN", {
    weekday: "short",
    hour: "numeric",
    minute: "2-digit"
  });
}

function pickUpcomingMeeting() {
  const meetingsWithDates = state.meetings
    .map((meeting) => ({ meeting, nextDate: inferMeetingDate(meeting) }))
    .filter((item) => item.nextDate)
    .sort((a, b) => a.nextDate - b.nextDate);

  return meetingsWithDates[0] || null;
}

function getWorkspaceDefinition(view) {
  return workspaceDefinitions[view] || null;
}

function ensureWorkspaceState(view) {
  const definition = getWorkspaceDefinition(view);
  if (!definition) {
    state.currentWorkspaceTabId = null;
    return;
  }

  const openTabs = state.openWorkspaceTabs[view];
  if (!openTabs.length) {
    openTabs.push(definition.base.id);
  }

  if (!state.currentWorkspaceTabId || !openTabs.includes(state.currentWorkspaceTabId)) {
    state.currentWorkspaceTabId = definition.base.id;
  }
}

function isWorkspaceBaseTabActive() {
  const definition = getWorkspaceDefinition(state.currentView);
  return !definition || state.currentWorkspaceTabId === definition.base.id;
}

function syncViewPanels() {
  const showDefaultPanels = state.currentView === "dashboard" || isWorkspaceBaseTabActive();
  viewPanels.forEach((panel) => {
    const views = (panel.dataset.section || "").split(" ");
    const inView = views.includes(state.currentView);
    panel.classList.toggle("is-hidden", !inView || !showDefaultPanels);
  });
}

function renderWorkspaceTabs() {
  const definition = getWorkspaceDefinition(state.currentView);
  if (!definition) {
    workspaceTabs.classList.add("hidden");
    workspaceMenu.classList.add("hidden");
    workspaceAddBtn.setAttribute("aria-expanded", "false");
    workspaceTabList.innerHTML = "";
    workspacePlaceholder.classList.add("hidden");
    syncViewPanels();
    return;
  }

  ensureWorkspaceState(state.currentView);
  const openTabs = state.openWorkspaceTabs[state.currentView];
  workspaceTabs.classList.remove("hidden");
  workspaceTabList.innerHTML = openTabs.map((tabId) => {
    const option = definition.options.find((item) => item.id === tabId);
    const isBase = tabId === definition.base.id;
    const label = isBase ? definition.base.label : option.label;
    return `<button class="workspace-tab ${state.currentWorkspaceTabId === tabId ? "active" : ""}" type="button" data-workspace-tab="${tabId}">${escapeHtml(label)}${isBase ? "" : `<span class="workspace-tab-close" data-close-workspace-tab="${tabId}">x</span>`}</button>`;
  }).join("");

  const remainingOptions = definition.options.filter((option) => !openTabs.includes(option.id));
  workspaceMenu.innerHTML = remainingOptions.length
    ? remainingOptions.map((option) => `<button type="button" data-open-workspace-tab="${option.id}">${escapeHtml(option.label)}</button>`).join("")
    : `<button type="button" disabled>All ${escapeHtml(definition.base.label.toLowerCase())} tabs are open</button>`;

  if (isWorkspaceBaseTabActive()) {
    workspacePlaceholder.classList.add("hidden");
  } else {
    const activeOption = definition.options.find((item) => item.id === state.currentWorkspaceTabId);
    workspacePlaceholder.classList.remove("hidden");
    workspacePlaceholderKicker.textContent = `${definition.base.label} tab`;
    workspacePlaceholderTitle.textContent = activeOption.title;
    workspacePlaceholderText.textContent = activeOption.text;
  }

  syncViewPanels();
}

function setActiveView(view) {
  state.currentView = view;
  navLinks.forEach((button) => button.classList.toggle("active", button.dataset.view === view));
  renderWorkspaceTabs();
}

function renderProjectStatus() {
  const latestProjects = state.projects.slice(0, 3);
  projectStatusList.innerHTML = latestProjects.length
    ? latestProjects.map((project) => `
      <article class="record-card">
        <div>
          <h3>${escapeHtml(project.name)}</h3>
          <p>Current status for the latest project record.</p>
        </div>
        <span class="record-tag ${statusClass(project.status)}">${escapeHtml(project.status)}</span>
      </article>
    `).join("")
    : `<article class="record-card"><div><h3>No projects yet</h3><p>Add project entries to show the latest status here.</p></div><span class="record-tag">Waiting</span></article>`;
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

function renderMetricGrid(metrics) {
  metricGrid.innerHTML = metrics.map((metric) => `
    <article class="metric-card">
      <h3>${escapeHtml(metric.label)}</h3>
      <div class="metric-value">${escapeHtml(metric.value)}</div>
      <div class="metric-meta">${escapeHtml(metric.meta)}</div>
    </article>
  `).join("");
}

function renderHeroProjects() {
  const usersById = Object.fromEntries(state.users.map((user) => [user.id, user]));
  const latestProjects = state.projects.slice(0, 3).map((project) => ({
    name: project.name,
    owner: usersById[project.ownerId]?.name || "Team not assigned",
    status: project.status
  }));
  const visibleProjects = [...latestProjects];

  while (visibleProjects.length < 3) {
    visibleProjects.push(defaultHeroProjects[visibleProjects.length]);
  }

  heroProjectList.innerHTML = visibleProjects.map((project, index) => {
      return `
        <article class="hero-project-card">
          <p class="hero-label">Project ${String(index + 1).padStart(2, "0")}</p>
          <strong>${escapeHtml(project.name)}</strong>
          <p class="hero-project-meta">Who are working: ${escapeHtml(project.owner)}</p>
          <div class="hero-project-status">
            <span class="record-tag ${statusClass(project.status)}">${escapeHtml(project.status)}</span>
          </div>
        </article>
      `;
    }).join("");
}

function renderOrganization() {
  const renderNode = (node) => `
    <li class="org-node-item">
      <div class="org-node">
        <div class="org-node-name">${escapeHtml(node.name)}</div>
        <div class="org-node-designation">${escapeHtml(node.designation || "Employee")}</div>
      </div>
      ${node.children?.length ? `
        <ul class="org-node-children">
          ${node.children.map((child) => renderNode(child)).join("")}
        </ul>
      ` : ""}
    </li>
  `;

  organizationTree.innerHTML = `
    <div class="org-chart-wrap">
      <ul class="org-chart-root">
        ${renderNode(defaultOrganizationChart)}
      </ul>
    </div>
  `;
}

function buildOperationalMetrics() {
  const activeProjects = state.projects.filter((project) => !/completed/i.test(String(project.status || ""))).length;
  const pendingTasks = state.todos.filter((todo) => !todo.done).length;
  const scheduleCount = state.schedules.filter((item) => item.range === state.currentRange).length;
  const leaveTracked = state.holidays.reduce((sum, holiday) => sum + Number(holiday.total || 0), 0);
  const nextMeeting = state.meetings[0];

  return [
    {
      label: "Users",
      value: String(state.users.length),
      meta: state.users.length ? "Profiles available for planning and ownership." : "No user records added yet."
    },
    {
      label: "Active projects",
      value: String(activeProjects),
      meta: `${state.projects.length} total project records in the workspace.`
    },
    {
      label: "Open tasks",
      value: String(pendingTasks),
      meta: pendingTasks ? "Pending items still need closure or reassignment." : "No open tasks at the moment."
    },
    {
      label: "Meetings",
      value: String(state.meetings.length),
      meta: nextMeeting ? `Next item: ${String(nextMeeting.title || "Meeting scheduled")}.` : "No meetings logged yet."
    },
    {
      label: `${state.currentRange[0].toUpperCase()}${state.currentRange.slice(1)} schedules`,
      value: String(scheduleCount),
      meta: leaveTracked ? `${leaveTracked} leave slots tracked across configured holiday types.` : "Add schedule or leave data to populate this range."
    }
  ];
}

function buildMetricFallback(errorMessage) {
  return [
    {
      label: "Database status",
      value: "Offline",
      meta: "Dashboard data could not be loaded from the backend."
    },
    {
      label: "Likely issue",
      value: "Auth",
      meta: "SQL login or database permissions still need to be corrected."
    },
    {
      label: "What to check",
      value: "SQL",
      meta: "Confirm mixed mode, mapped user roles, and the ScheduleTracker database connection."
    },
    {
      label: "App state",
      value: "Retry",
      meta: "Restart the app after fixing the database settings."
    },
    {
      label: "Last error",
      value: "Info",
      meta: errorMessage || "Backend connection failed."
    }
  ];
}

function renderDashboard() {
  const data = dashboardData[state.currentRange];
  renderHeroProjects();
  renderMetricGrid(buildOperationalMetrics());
  capacityPercent.textContent = `${data.capacity.percent}%`;
  capacityCaption.textContent = data.capacity.caption;
  capacityFill.style.width = `${data.capacity.percent}%`;
  renderProjectStatus();
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
    return `<div class="day-column"><h3>${escapeHtml(label)}</h3>${items.map((item) => `<div class="board-card" style="background:${item.color}"><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.note)}</span></div>`).join("")}</div>`;
  }).join("");
}

function renderScheduleList() {
  scheduleList.innerHTML = state.schedules.map((item) => `<article class="record-card"><div><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.range)} | ${escapeHtml(item.day)} | ${escapeHtml(item.note)}</p></div><div class="record-actions"><button class="mini-btn" type="button" data-edit-schedule="${item.id}">Edit</button><button class="mini-btn danger" type="button" data-delete-schedule="${item.id}">Delete</button></div></article>`).join("");
}

function renderHolidays() {
  holidayGrid.innerHTML = state.holidays.map((holiday) => `<article class="holiday-card"><div><strong>${escapeHtml(holiday.name)}</strong><span>${holiday.used} used out of ${holiday.total} days</span></div><div class="record-actions"><div class="holiday-balance">${Number(holiday.total) - Number(holiday.used)}</div><button class="mini-btn" type="button" data-edit-holiday="${holiday.id}">Edit</button></div></article>`).join("");
}

function renderUsers() {
  const options = state.users.map((user) => `<option value="${user.id}">${escapeHtml(user.name)}</option>`).join("");
  projectOwnerInput.innerHTML = options;
  userList.innerHTML = state.users.map((user) => `<article class="record-card"><div><h3>${escapeHtml(user.name)}</h3><p>${escapeHtml(user.role)} | ${escapeHtml(user.type)}</p></div><span class="record-tag completed">${escapeHtml(user.type)}</span></article>`).join("");
}

function renderProjects() {
  const usersById = Object.fromEntries(state.users.map((user) => [user.id, user]));
  financeProjectInput.innerHTML = state.projects.map((project) => `<option value="${project.id}">${escapeHtml(project.name)}</option>`).join("");
  projectList.innerHTML = state.projects.map((project) => `<article class="record-card"><div><h3>${escapeHtml(project.name)}</h3><p>Owner: ${escapeHtml(usersById[project.ownerId]?.name || "Unassigned")}</p></div><span class="record-tag ${statusClass(project.status)}">${escapeHtml(project.status)}</span></article>`).join("");
  renderHeroProjects();
  renderProjectStatus();
}

function renderFinances() {
  const projectsById = Object.fromEntries(state.projects.map((project) => [project.id, project]));
  financeList.innerHTML = state.finances.map((finance) => `<article class="record-card"><div><h3>${escapeHtml(finance.type)} | ${formatMoney(finance.amount)}</h3><p>${escapeHtml(projectsById[finance.projectId]?.name || "Unknown project")} | ${escapeHtml(finance.status)}${finance.note ? ` | ${escapeHtml(finance.note)}` : ""}</p></div><div class="record-actions"><button class="mini-btn" type="button" data-edit-finance="${finance.id}">Edit</button><button class="mini-btn danger" type="button" data-delete-finance="${finance.id}">Delete</button></div></article>`).join("");
}

function renderTodos() {
  todoList.innerHTML = state.todos.map((todo) => `<li class="todo-item ${todo.done ? "done" : ""}"><label><input type="checkbox" data-id="${todo.id}" ${todo.done ? "checked" : ""}><span>${escapeHtml(todo.text)}</span></label><button type="button" data-delete="${todo.id}">Delete</button></li>`).join("");
}

function renderMeetings() {
  meetingList.innerHTML = state.meetings.map((meeting) => `<article class="meeting-item ${meeting.id === state.selectedMeetingId ? "active" : ""}" data-id="${meeting.id}"><h3>${escapeHtml(meeting.title)}</h3><p>${escapeHtml(meeting.meta)}</p></article>`).join("");
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
  currentUserLabel.textContent = state.authUser?.username || "admin";
  welcomeTitle.textContent = `Welcome, ${state.authUser?.username || "admin"}`;

  const importantTask = state.todos.find((todo) => !todo.done) || state.todos[0] || null;
  upcomingTaskTitle.textContent = importantTask ? importantTask.text : "No important task right now";
  upcomingTaskMeta.textContent = importantTask
    ? (importantTask.done ? "This task is already complete." : "First open task from your planner.")
    : "Add a task to see it here.";

  const firstMeeting = state.meetings[0] || null;
  upcomingMeetingTitle.textContent = firstMeeting ? firstMeeting.title : "No meeting added";
  upcomingMeetingMeta.textContent = firstMeeting ? firstMeeting.meta : "Create a meeting to see it here.";

  const nextMeeting = pickUpcomingMeeting();
  upcomingMeetingCountdown.textContent = nextMeeting
    ? `${nextMeeting.meeting.title} - ${formatTimeDistance(nextMeeting.nextDate)}`
    : "No timed meeting found";
  upcomingMeetingCountdownMeta.textContent = nextMeeting
    ? formatMeetingDate(nextMeeting.nextDate)
    : "Meetings without a time will show after timing is added.";
}

function resetScheduleForm() {
  state.editingScheduleId = null;
  scheduleSubmitBtn.textContent = "Add schedule";
  scheduleForm.reset();
  scheduleRangeInput.value = state.currentRange;
  updateDayOptions(state.currentRange);
}

function resetHolidayForm() {
  state.editingHolidayId = null;
  holidaySubmitBtn.textContent = "Save leave type";
  holidayForm.reset();
}

function resetFinanceForm() {
  state.editingFinanceId = null;
  financeSubmitBtn.textContent = "Save finance record";
  financeForm.reset();
}

logoutBtn.addEventListener("click", () => {
  sessionStorage.removeItem(SESSION_KEY);
  window.location.href = "/";
});

navLinks.forEach((button) => {
  button.addEventListener("click", () => setActiveView(button.dataset.view));
});

modeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    state.currentRange = button.dataset.range;
    modeButtons.forEach((pill) => pill.classList.toggle("active", pill === button));
    scheduleRangeInput.value = state.currentRange;
    updateDayOptions(state.currentRange);
    renderDashboard();
    renderScheduleList();
  });
});

scopeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    scopeButtons.forEach((chip) => {
      chip.classList.toggle("active", chip === button);
      chip.setAttribute("aria-pressed", chip === button ? "true" : "false");
    });
  });
});

workspaceAddBtn.addEventListener("click", () => {
  const shouldOpen = workspaceMenu.classList.contains("hidden");
  workspaceMenu.classList.toggle("hidden", !shouldOpen);
  workspaceAddBtn.setAttribute("aria-expanded", shouldOpen ? "true" : "false");
});

workspaceTabList.addEventListener("click", (event) => {
  const closeButton = event.target.closest("[data-close-workspace-tab]");
  if (closeButton) {
    const tabId = closeButton.getAttribute("data-close-workspace-tab");
    const openTabs = state.openWorkspaceTabs[state.currentView];
    state.openWorkspaceTabs[state.currentView] = openTabs.filter((item) => item !== tabId);
    if (state.currentWorkspaceTabId === tabId) {
      state.currentWorkspaceTabId = workspaceDefinitions[state.currentView].base.id;
    }
    renderWorkspaceTabs();
    return;
  }

  const tabButton = event.target.closest("[data-workspace-tab]");
  if (!tabButton) return;
  state.currentWorkspaceTabId = tabButton.getAttribute("data-workspace-tab");
  renderWorkspaceTabs();
});

workspaceMenu.addEventListener("click", (event) => {
  const optionButton = event.target.closest("[data-open-workspace-tab]");
  if (!optionButton) return;
  const tabId = optionButton.getAttribute("data-open-workspace-tab");
  const openTabs = state.openWorkspaceTabs[state.currentView];
  if (!openTabs.includes(tabId)) {
    openTabs.push(tabId);
  }
  state.currentWorkspaceTabId = tabId;
  workspaceMenu.classList.add("hidden");
  workspaceAddBtn.setAttribute("aria-expanded", "false");
  renderWorkspaceTabs();
});

document.addEventListener("click", (event) => {
  if (workspaceMenu.classList.contains("hidden")) return;
  if (workspaceTabs.contains(event.target)) return;
  workspaceMenu.classList.add("hidden");
  workspaceAddBtn.setAttribute("aria-expanded", "false");
});

scheduleRangeInput.addEventListener("change", () => updateDayOptions(scheduleRangeInput.value));

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
    const updated = await apiRequest(`/api/schedules/${state.editingScheduleId}`, { method: "PATCH", body: JSON.stringify(payload) });
    state.schedules = state.schedules.map((item) => item.id === updated.id ? updated : item);
  } else {
    const created = await apiRequest("/api/schedules", { method: "POST", body: JSON.stringify(payload) });
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
    const updated = await apiRequest(`/api/holidays/${state.editingHolidayId}`, { method: "PATCH", body: JSON.stringify(payload) });
    state.holidays = state.holidays.map((item) => item.id === updated.id ? updated : item);
  } else {
    const created = await apiRequest("/api/holidays", { method: "POST", body: JSON.stringify(payload) });
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
  const user = await apiRequest("/api/users", { method: "POST", body: JSON.stringify({ name, role, type }) });
  state.users.unshift(user);
  renderUsers();
  renderProjects();
  renderFinances();
  renderSidebar();
  userForm.reset();
});

projectForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const name = projectNameInput.value.trim();
  const ownerId = Number(projectOwnerInput.value);
  const status = projectStatusInput.value;
  if (!name || !ownerId) return;
  const project = await apiRequest("/api/projects", { method: "POST", body: JSON.stringify({ name, ownerId, status }) });
  state.projects.unshift(project);
  renderProjects();
  renderFinances();
  renderSidebar();
  projectForm.reset();
  projectOwnerInput.value = String(ownerId);
});

financeForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const payload = {
    projectId: Number(financeProjectInput.value),
    type: financeTypeInput.value,
    amount: Number(financeAmountInput.value),
    status: financeStatusInput.value,
    note: financeNoteInput.value.trim()
  };
  if (!payload.projectId || Number.isNaN(payload.amount)) return;
  if (state.editingFinanceId) {
    const updated = await apiRequest(`/api/finances/${state.editingFinanceId}`, { method: "PATCH", body: JSON.stringify(payload) });
    state.finances = state.finances.map((item) => item.id === updated.id ? updated : item);
  } else {
    const created = await apiRequest("/api/finances", { method: "POST", body: JSON.stringify(payload) });
    state.finances.unshift(created);
  }
  resetFinanceForm();
  renderFinances();
});

financeCancelBtn.addEventListener("click", resetFinanceForm);

financeList.addEventListener("click", async (event) => {
  const editId = event.target.getAttribute("data-edit-finance");
  const deleteId = event.target.getAttribute("data-delete-finance");
  if (editId) {
    const finance = state.finances.find((item) => item.id === Number(editId));
    if (!finance) return;
    state.editingFinanceId = finance.id;
    financeSubmitBtn.textContent = "Update finance record";
    financeProjectInput.value = String(finance.projectId);
    financeTypeInput.value = finance.type;
    financeAmountInput.value = finance.amount;
    financeStatusInput.value = finance.status;
    financeNoteInput.value = finance.note;
    return;
  }
  if (deleteId) {
    await apiRequest(`/api/finances/${deleteId}`, { method: "DELETE" });
    state.finances = state.finances.filter((item) => item.id !== Number(deleteId));
    renderFinances();
  }
});

todoForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const text = todoInput.value.trim();
  if (!text) return;
  const todo = await apiRequest("/api/todos", { method: "POST", body: JSON.stringify({ text }) });
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
  const updated = await apiRequest(`/api/todos/${todoId}`, { method: "PATCH", body: JSON.stringify({ done: event.target.checked }) });
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
  const updated = await apiRequest(`/api/meetings/${state.selectedMeetingId}`, { method: "PATCH", body: JSON.stringify({ notes: meetingNotes.value }) });
  state.meetings = state.meetings.map((meeting) => meeting.id === updated.id ? updated : meeting);
  renderMeetings();
  saveNotesBtn.textContent = "Saved";
  window.setTimeout(() => {
    saveNotesBtn.textContent = "Save notes";
  }, 1200);
});

async function init() {
  const savedSession = sessionStorage.getItem(SESSION_KEY);
  if (!savedSession) {
    window.location.href = "/";
    return;
  }
  state.authUser = JSON.parse(savedSession);
  updateDayOptions(state.currentRange);
  scheduleRangeInput.value = state.currentRange;
  const data = await apiRequest("/api/bootstrap");
  state.holidays = data.holidays || [];
  state.meetings = data.meetings || [];
  state.todos = data.todos || [];
  state.users = data.users || [];
  state.projects = data.projects || [];
  state.schedules = data.schedules || [];
  state.finances = data.finances || [];
  state.selectedMeetingId = state.meetings[0]?.id || null;
  renderOrganization();
  renderDashboard();
  renderHolidays();
  renderUsers();
  renderProjects();
  renderFinances();
  renderTodos();
  renderMeetings();
  renderSidebar();
  renderScheduleBoard();
  renderScheduleList();
  setActiveView("dashboard");
}

init().catch((error) => {
  renderOrganization();
  renderMetricGrid(buildMetricFallback(error.message));
  upcomingTaskTitle.textContent = "Unable to load workspace";
  upcomingTaskMeta.textContent = error.message;
  upcomingMeetingTitle.textContent = "Unable to load meetings";
  upcomingMeetingMeta.textContent = "Please refresh or restart the app.";
  upcomingMeetingCountdown.textContent = "No upcoming data";
  upcomingMeetingCountdownMeta.textContent = "Backend connection failed.";
});
