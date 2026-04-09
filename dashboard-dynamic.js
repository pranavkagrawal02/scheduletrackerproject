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
  selectedCalendarDate: null,
  selectedMeetingId: null,
  editingMeetingId: null,
  editingScheduleId: null,
  editingHolidayId: null,
  editingFinanceId: null,
  holidays: [],
  publicHolidays: [],
  leaveEvents: [],
  meetings: [],
  todos: [],
  users: [],
  projects: [],
  projectUpdates: [],
  schedules: [],
  finances: [],
  authUser: null,
  calendarCursor: new Date(),
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
      label: "All Projects"
    },
    options: [
      {
        id: "projects-finance",
        label: "All Project Finance",
        title: "All Project Finance",
        text: "See the full finance position across every project."
      },
      {
        id: "projects-new",
        label: "New Project",
        title: "New Project",
        text: "Create a new project and assign it to an employee."
      },
      {
        id: "projects-remove",
        label: "Remove Project",
        title: "Remove Project",
        text: "Remove an existing project from the database."
      }
    ]
  }
};

const viewPanels = [...document.querySelectorAll(".view-panel")];
const navLinks = [...document.querySelectorAll(".nav-link")];
const welcomeTitle = document.getElementById("welcomeTitle");
const topbarModeSwitch = document.getElementById("topbarModeSwitch");
const metricGrid = document.getElementById("metricGrid");
const projectStatusList = document.getElementById("projectStatusList");
const capacityFill = document.getElementById("capacityFill");
const capacityPercent = document.getElementById("capacityPercent");
const capacityCaption = document.getElementById("capacityCaption");
const scheduleBoard = document.getElementById("scheduleBoard");
const scheduleList = document.getElementById("scheduleList");
const holidayGrid = document.getElementById("holidayGrid");
const leaveGrid = document.getElementById("leaveGrid");
const leaveCalendarMonth = document.getElementById("leaveCalendarMonth");
const leaveCalendarMeta = document.getElementById("leaveCalendarMeta");
const leaveCalendarBoard = document.getElementById("leaveCalendarBoard");
const leaveCalendarPrevBtn = document.getElementById("leaveCalendarPrevBtn");
const leaveCalendarNextBtn = document.getElementById("leaveCalendarNextBtn");
const calendarPlannerTitle = document.getElementById("calendarPlannerTitle");
const calendarPlannerMeta = document.getElementById("calendarPlannerMeta");
const calendarProjectDeadlineList = document.getElementById("calendarProjectDeadlineList");
const calendarScheduleList = document.getElementById("calendarScheduleList");
const calendarScheduleForm = document.getElementById("calendarScheduleForm");
const calendarScheduleTitleInput = document.getElementById("calendarScheduleTitleInput");
const calendarScheduleColorInput = document.getElementById("calendarScheduleColorInput");
const calendarScheduleNoteInput = document.getElementById("calendarScheduleNoteInput");
const calendarScheduleSubmitBtn = document.getElementById("calendarScheduleSubmitBtn");
const calendarScheduleCancelBtn = document.getElementById("calendarScheduleCancelBtn");
const holidayMonthSummary = document.getElementById("holidayMonthSummary");
const holidayClSummary = document.getElementById("holidayClSummary");
const holidayPlSummary = document.getElementById("holidayPlSummary");
const holidayUnpaidSummary = document.getElementById("holidayUnpaidSummary");
const holidayYearSummary = document.getElementById("holidayYearSummary");
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
const heroProjectList = document.getElementById("heroProjectList");
const organizationTree = document.getElementById("organizationTree");
const workspaceTabs = document.getElementById("workspaceTabs");
const workspaceTabList = document.getElementById("workspaceTabList");
const workspacePlaceholder = document.getElementById("workspacePlaceholder");
const workspacePlaceholderKicker = document.getElementById("workspacePlaceholderKicker");
const workspacePlaceholderTitle = document.getElementById("workspacePlaceholderTitle");
const workspacePlaceholderText = document.getElementById("workspacePlaceholderText");
const workspacePanelBody = document.getElementById("workspacePanelBody");
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
const holidayDateInput = document.getElementById("holidayDateInput");
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
const meetingForm = document.getElementById("meetingForm");
const meetingTitleInput = document.getElementById("meetingTitleInput");
const meetingDateInput = document.getElementById("meetingDateInput");
const meetingLocationInput = document.getElementById("meetingLocationInput");
const meetingStartTimeInput = document.getElementById("meetingStartTimeInput");
const meetingEndTimeInput = document.getElementById("meetingEndTimeInput");
const meetingLinkInput = document.getElementById("meetingLinkInput");
const meetingSubmitBtn = document.getElementById("meetingSubmitBtn");
const meetingCancelBtn = document.getElementById("meetingCancelBtn");
const meetingUpcomingList = document.getElementById("meetingUpcomingList");
const meetingHistoryList = document.getElementById("meetingHistoryList");
const meetingSelectInput = document.getElementById("meetingSelectInput");
const meetingMeta = document.getElementById("meetingMeta");
const meetingLocationMeta = document.getElementById("meetingLocationMeta");
const meetingLinkMeta = document.getElementById("meetingLinkMeta");
const meetingSummary = document.getElementById("meetingSummary");
const meetingNotes = document.getElementById("meetingNotes");
const saveNotesBtn = document.getElementById("saveNotesBtn");
const deleteMeetingBtn = document.getElementById("deleteMeetingBtn");

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderSessionIdentity() {
  const displayName = state.authUser?.name || state.authUser?.username || "User";
  currentUserLabel.textContent = displayName;
  welcomeTitle.textContent = `Welcome, ${displayName}`;
}

function getSessionUser() {
  try {
    return JSON.parse(sessionStorage.getItem(SESSION_KEY) || "null");
  } catch {
    return null;
  }
}

async function apiRequest(path, options = {}) {
  const authUser = getSessionUser();
  const headers = {
    "Content-Type": "application/json"
  };
  if (authUser?.username) {
    headers["X-Auth-Username"] = authUser.username;
  }
  if (authUser?.employeeCode) {
    headers["X-Auth-Employee-Code"] = authUser.employeeCode;
  }

  const response = await fetch(path, {
    headers: {
      ...headers,
      ...(options.headers || {})
    },
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

function formatProjectStamp(value) {
  return value ? String(value) : "Not updated yet";
}

const PROJECT_STATUS_OPTIONS = ["Assign", "In Progress", "Completed", "At Risk", "Off Track", "On Track"];
const PROJECT_PRIORITY_OPTIONS = ["Low", "Medium", "High", "Urgent"];

function buildProjectStatusOptions(selectedValue) {
  return PROJECT_STATUS_OPTIONS.map((status) => `<option value="${status}" ${selectedValue === status ? "selected" : ""}>${status}</option>`).join("");
}

function buildProjectPriorityOptions(selectedValue) {
  return PROJECT_PRIORITY_OPTIONS.map((priority) => `<option value="${priority}" ${selectedValue === priority ? "selected" : ""}>${priority}</option>`).join("");
}

function toInputDateValue(value) {
  if (!value) return "";
  const text = String(value);
  const match = text.match(/\d{4}-\d{2}-\d{2}/);
  return match ? match[0] : "";
}

function padNumber(value) {
  return String(value).padStart(2, "0");
}

function coerceDate(value) {
  if (!value) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatLocalDate(value) {
  const date = coerceDate(value);
  if (!date) return "";
  return `${date.getFullYear()}-${padNumber(date.getMonth() + 1)}-${padNumber(date.getDate())}`;
}

function formatLocalTime(value) {
  const date = coerceDate(value);
  if (date) {
    return `${padNumber(date.getHours())}:${padNumber(date.getMinutes())}`;
  }
  const text = String(value || "");
  const match = text.match(/(\d{2}:\d{2})/);
  return match ? match[1] : "";
}

function formatMonthLabel(date) {
  return date.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function formatDateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function classifyLeaveType(type) {
  const normalized = String(type || "").trim().toUpperCase();
  if (normalized === "CL") return "cl";
  if (normalized === "PL") return "pl";
  if (normalized === "UNPAID") return "unpaid";
  return "other";
}

function clampCalendarCursor(date) {
  const minDate = new Date(2000, 0, 1);
  const maxDate = new Date(2100, 11, 1);
  if (date < minDate) return minDate;
  if (date > maxDate) return maxDate;
  return startOfMonth(date);
}

function parseIsoDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDisplayDateTime(value) {
  const date = parseIsoDate(value);
  if (!date) return "";
  return date.toLocaleString("en-IN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });
}

function toMeridiemTime(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  const meridiemMatch = text.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (meridiemMatch) {
    const normalizedHour = String(Number(meridiemMatch[1]) || 0).padStart(2, "0");
    return `${normalizedHour}:${meridiemMatch[2]} ${meridiemMatch[3].toUpperCase()}`;
  }
  const match = text.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return text;
  let hours = Number(match[1]);
  const minutes = match[2];
  const suffix = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return `${String(hours).padStart(2, "0")}:${minutes} ${suffix}`;
}

function toTwentyFourHourTime(value) {
  const text = String(value || "").trim().toUpperCase();
  if (!text) return "";
  const meridiemMatch = text.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);
  if (meridiemMatch) {
    let hours = Number(meridiemMatch[1]);
    const minutes = meridiemMatch[2];
    if (hours < 1 || hours > 12) return "";
    if (meridiemMatch[3] === "AM") {
      hours = hours === 12 ? 0 : hours;
    } else {
      hours = hours === 12 ? 12 : hours + 12;
    }
    return `${String(hours).padStart(2, "0")}:${minutes}`;
  }
  const match = text.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return "";
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return "";
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function normalizeMeetingLink(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  const normalizedSlashes = text
    .replace(/^https:\\\\+/i, "https://")
    .replace(/^http:\\\\+/i, "http://")
    .replace(/^https:\/(?!\/)/i, "https://")
    .replace(/^http:\/(?!\/)/i, "http://");
  if (/^https?:\/\//i.test(normalizedSlashes)) {
    return normalizedSlashes;
  }
  return `https://${normalizedSlashes}`;
}

function buildMeetingDateTime(dateValue, timeValue) {
  if (!dateValue || !timeValue) return null;
  return parseIsoDate(`${dateValue}T${timeValue}:00`);
}

function meetingSortValue(meeting) {
  return inferMeetingDate(meeting)?.getTime() || Number.MAX_SAFE_INTEGER;
}

function sortMeetings(meetings) {
  return [...meetings].sort((a, b) => meetingSortValue(a) - meetingSortValue(b) || String(a.title).localeCompare(String(b.title)));
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
  if (meeting?.startsAt) {
    const startsAt = parseIsoDate(meeting.startsAt);
    if (startsAt) {
      return startsAt;
    }
  }

  if (meeting?.date && meeting?.startTime) {
    const normalizedTime = toTwentyFourHourTime(meeting.startTime) || formatLocalTime(meeting.startTime);
    const combined = parseIsoDate(`${meeting.date}T${normalizedTime || "00:00"}:00`);
    if (combined) {
      return combined;
    }
  }

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
    .filter((item) => item.nextDate && item.nextDate.getTime() >= Date.now())
    .sort((a, b) => a.nextDate - b.nextDate);

  return meetingsWithDates[0] || state.meetings
    .map((meeting) => ({ meeting, nextDate: inferMeetingDate(meeting) }))
    .filter((item) => item.nextDate)
    .sort((a, b) => a.nextDate - b.nextDate)[0] || null;
}

function getWorkspaceDefinition(view) {
  return workspaceDefinitions[view] || null;
}

function getWorkspaceOptions(view) {
  if (view === "projects") {
    return [
      ...(getWorkspaceDefinition(view)?.options || []),
      ...state.projects.map((project) => ({
        id: `project-tab-${project.id}`,
        label: project.name,
        title: project.name,
        text: "Project workspace"
      }))
    ];
  }
  return getWorkspaceDefinition(view)?.options || [];
}

function getProjectTabId(projectId) {
  return `project-tab-${projectId}`;
}

function parseProjectTabId(tabId) {
  if (!String(tabId || "").startsWith("project-tab-")) {
    return null;
  }
  return Number(String(tabId).slice("project-tab-".length));
}

function getWorkspaceTabMeta(view, tabId) {
  const definition = getWorkspaceDefinition(view);
  if (!definition) {
    return null;
  }

  if (tabId === definition.base.id) {
    return {
      id: definition.base.id,
      label: definition.base.label,
      title: definition.base.label,
      text: ""
    };
  }

  return getWorkspaceOptions(view).find((item) => item.id === tabId) || null;
}

function ensureWorkspaceState(view) {
  const definition = getWorkspaceDefinition(view);
  if (!definition) {
    state.currentWorkspaceTabId = null;
    return;
  }

  const validTabIds = new Set([definition.base.id, ...getWorkspaceOptions(view).map((item) => item.id)]);
  const openTabs = state.openWorkspaceTabs[view].filter((tabId) => validTabIds.has(tabId));
  state.openWorkspaceTabs[view] = openTabs;
  if (view === "projects") {
    const fixedProjectTabs = [definition.base.id, ...(definition.options || []).map((item) => item.id)];
    state.openWorkspaceTabs[view] = [...new Set([...fixedProjectTabs, ...openTabs])];
  } else if (!openTabs.includes(definition.base.id)) {
    openTabs.unshift(definition.base.id);
  }

  if (!openTabs.includes(state.currentWorkspaceTabId)) {
    state.currentWorkspaceTabId = definition.base.id;
  }
}

function isWorkspaceBaseTabActive() {
  const definition = getWorkspaceDefinition(state.currentView);
  return !definition || state.currentWorkspaceTabId === definition.base.id;
}

function syncViewPanels() {
  const showDefaultPanels = state.currentView === "dashboard"
    || (state.currentView !== "projects" && isWorkspaceBaseTabActive());
  viewPanels.forEach((panel) => {
    const views = (panel.dataset.section || "").split(" ");
    const inView = views.includes(state.currentView);
    panel.classList.toggle("is-hidden", !inView || !showDefaultPanels);
  });
}

function computeProjectFinanceSummary(projectId) {
  const project = state.projects.find((item) => Number(item.id) === Number(projectId));
  const items = state.finances.filter((finance) => Number(finance.projectId) === Number(projectId));
  const budgetFromFinances = items
    .filter((finance) => finance.type === "Budget" || finance.type === "Grant")
    .reduce((sum, finance) => sum + Number(finance.amount || 0), 0);
  const spentFromFinances = items
    .filter((finance) => finance.type === "Expense" || finance.type === "Payment")
    .reduce((sum, finance) => sum + Number(finance.amount || 0), 0);
  const pendingFromFinances = items
    .filter((finance) => finance.status === "Pending" || finance.status === "Planned")
    .reduce((sum, finance) => sum + Number(finance.amount || 0), 0);
  const budget = Number(project?.budget || 0) || budgetFromFinances;
  const spent = Number(project?.spentAmount || 0) || spentFromFinances;
  const pending = Number(project?.pendingAmount || 0) || pendingFromFinances;
  const remaining = Number(project?.remainingAmount || 0) || (budget - spent);

  return {
    budget,
    spent,
    pending,
    remaining,
    count: items.length,
    items
  };
}

function renderProjectWorkspacePanel() {
  const activeTabId = state.currentWorkspaceTabId;
  const usersById = Object.fromEntries(state.users.map((user) => [Number(user.id), user]));
  const openTabs = state.openWorkspaceTabs.projects || [];
  const availableProjects = state.projects.filter((project) => !openTabs.includes(getProjectTabId(project.id)));
  const projectRail = `
    <aside class="workspace-project-sidebar">
      <p class="panel-kicker">Projects</p>
      <div class="workspace-project-tabstack">
        ${availableProjects.length
          ? availableProjects.map((project) => `<button class="workspace-project-pill" type="button" data-open-project-tab="${project.id}">${escapeHtml(project.name)}</button>`).join("")
          : `<article class="workspace-empty-state workspace-empty-state-compact"><h3>All projects opened</h3><p>Select a tab above or close one to place it back here.</p></article>`}
      </div>
    </aside>
  `;

  workspacePlaceholder.classList.remove("hidden");
  workspacePlaceholderKicker.textContent = "Projects workspace";

  if (activeTabId === "projects-home") {
    workspacePlaceholderTitle.textContent = "All Projects";
    workspacePlaceholderText.textContent = "Overview of every project handled in your workspace.";

    const projectCards = state.projects.length
      ? state.projects.map((project) => {
        const summary = computeProjectFinanceSummary(project.id);
        const owner = usersById[Number(project.ownerId)]?.name || "Unassigned";
        return `
          <article class="workspace-project-card">
            <div class="workspace-project-card-top">
              <div>
                <h3>${escapeHtml(project.name)}</h3>
                <p>Owner: ${escapeHtml(owner)} | Priority: ${escapeHtml(project.priority || "Medium")}</p>
              </div>
              <span class="record-tag ${statusClass(project.status)}">${escapeHtml(project.status)}</span>
            </div>
            <div class="workspace-stat-grid">
              <article class="workspace-stat-card"><span>Budget</span><strong>${formatMoney(summary.budget)}</strong></article>
              <article class="workspace-stat-card"><span>Spent</span><strong>${formatMoney(summary.spent)}</strong></article>
              <article class="workspace-stat-card"><span>Remaining</span><strong>${formatMoney(summary.remaining)}</strong></article>
              <article class="workspace-stat-card"><span>Records</span><strong>${summary.count}</strong></article>
            </div>
            <div class="workspace-card-meta">
              <p><strong>Status remark:</strong> ${escapeHtml(project.statusRemark || "No status remark yet.")}</p>
              <p><strong>Status updated:</strong> ${escapeHtml(formatProjectStamp(project.statusUpdatedAt))}</p>
            </div>
          </article>
        `;
      }).join("")
      : `<article class="workspace-empty-state"><h3>No projects added yet</h3><p>Create a project entry to see the workspace overview here.</p></article>`;

    workspacePanelBody.innerHTML = `
      <div class="workspace-project-shell">
        <div class="workspace-project-main">
          <div class="workspace-project-list">${projectCards}</div>
        </div>
        ${projectRail}
      </div>
    `;
    return;
  }

  if (activeTabId === "projects-finance") {
    workspacePlaceholderTitle.textContent = "All Project Finance";
    workspacePlaceholderText.textContent = "Compare budget, spent amount, pending flow, and remaining balance across all projects.";

    const financeRows = state.projects.length
      ? state.projects.map((project) => {
        const summary = computeProjectFinanceSummary(project.id);
        return `
          <article class="workspace-finance-row">
            <div>
              <h3>${escapeHtml(project.name)}</h3>
              <p>${escapeHtml(project.status)} project | ${escapeHtml(project.financeRemark || "No finance remark yet.")}</p>
            </div>
            <strong>${formatMoney(summary.remaining)}</strong>
            <span>${formatMoney(summary.budget)}</span>
            <span>${formatMoney(summary.spent)}</span>
            <span>${formatMoney(summary.pending)}</span>
          </article>
        `;
      }).join("")
      : `<article class="workspace-empty-state"><h3>No finance data yet</h3><p>Add project and finance records to see the complete financial condition here.</p></article>`;

    const totals = state.projects.reduce((acc, project) => {
      const summary = computeProjectFinanceSummary(project.id);
      acc.budget += summary.budget;
      acc.spent += summary.spent;
      acc.pending += summary.pending;
      acc.remaining += summary.remaining;
      return acc;
    }, { budget: 0, spent: 0, pending: 0, remaining: 0 });

    workspacePanelBody.innerHTML = `
      <div class="workspace-project-shell">
        <div class="workspace-project-main">
          <div class="workspace-stat-grid workspace-stat-grid-wide">
            <article class="workspace-stat-card"><span>Total budget</span><strong>${formatMoney(totals.budget)}</strong></article>
            <article class="workspace-stat-card"><span>Total spent</span><strong>${formatMoney(totals.spent)}</strong></article>
            <article class="workspace-stat-card"><span>Total pending</span><strong>${formatMoney(totals.pending)}</strong></article>
            <article class="workspace-stat-card"><span>Total remaining</span><strong>${formatMoney(totals.remaining)}</strong></article>
          </div>
          <div class="workspace-finance-table">
            <div class="workspace-finance-head">
              <span>Project</span>
              <span>Remaining</span>
              <span>Budget</span>
              <span>Spent</span>
              <span>Pending</span>
            </div>
            ${financeRows}
          </div>
        </div>
        ${projectRail}
      </div>
    `;
    return;
  }

  if (activeTabId === "projects-new") {
    workspacePlaceholderTitle.textContent = "New Project";
    workspacePlaceholderText.textContent = "Create a new project and assign it to an employee.";
    const ownerOptions = state.users.length
      ? state.users.map((user) => `<option value="${user.id}">${escapeHtml(user.name)}</option>`).join("")
      : `<option value="">No users available</option>`;
    workspacePanelBody.innerHTML = `
      <div class="workspace-project-shell">
        <div class="workspace-project-main">
          <article class="workspace-edit-card workspace-edit-card-finance">
            <div class="panel-heading">
              <div>
                <p class="panel-kicker">New project</p>
                <h2>Create project</h2>
              </div>
            </div>
            <form class="stack-form workspace-inline-form" data-create-project-form="true">
              <label class="form-field">
                <span>Project name</span>
                <input type="text" name="name" maxlength="120" placeholder="Enter project name">
              </label>
              <div class="form-grid">
                <label class="form-field">
                  <span>Assigned employee</span>
                  <select name="ownerId">${ownerOptions}</select>
                </label>
                <label class="form-field">
                  <span>Project status</span>
                  <select name="status">${buildProjectStatusOptions("Assign")}</select>
                </label>
              </div>
              <div class="form-grid">
                <label class="form-field">
                  <span>Priority</span>
                  <select name="priority">${buildProjectPriorityOptions("Medium")}</select>
                </label>
              </div>
              <button type="submit">Create new project</button>
            </form>
          </article>
        </div>
        ${projectRail}
      </div>
    `;
    return;
  }

  if (activeTabId === "projects-remove") {
    workspacePlaceholderTitle.textContent = "Remove Project";
    workspacePlaceholderText.textContent = "Choose a project to remove it from the database.";
    const removableProjects = state.projects.length
      ? state.projects.map((project) => `
        <article class="workspace-remove-card">
          <div>
            <h3>${escapeHtml(project.name)}</h3>
            <p>${escapeHtml(project.status)} | ${escapeHtml(project.deadlineDate || "No deadline")}</p>
          </div>
          <button class="danger-btn" type="button" data-remove-project="${project.id}">Remove project</button>
        </article>
      `).join("")
      : `<article class="workspace-empty-state"><h3>No projects found</h3><p>There are no projects to remove.</p></article>`;
    workspacePanelBody.innerHTML = `
      <div class="workspace-project-shell">
        <div class="workspace-project-main">
          <div class="workspace-remove-list">${removableProjects}</div>
        </div>
        ${projectRail}
      </div>
    `;
    return;
  }

  const projectId = parseProjectTabId(activeTabId);
  const project = state.projects.find((item) => Number(item.id) === projectId);
  if (!project) {
    workspacePlaceholderTitle.textContent = "Project";
    workspacePlaceholderText.textContent = "This project is not available anymore.";
    workspacePanelBody.innerHTML = `
      <div class="workspace-project-shell">
        <div class="workspace-project-main"></div>
        ${projectRail}
      </div>
    `;
    return;
  }

  const owner = usersById[Number(project.ownerId)]?.name || "Unassigned";
  const summary = computeProjectFinanceSummary(project.id);
  const projectUpdates = state.projectUpdates
    .filter((item) => Number(item.projectId) === Number(project.id))
    .sort((a, b) => String(b.statusUpdatedAt || b.createdAt || "").localeCompare(String(a.statusUpdatedAt || a.createdAt || "")));
  const financeCards = summary.items.length
    ? summary.items.map((finance) => `
      <article class="workspace-finance-record">
        <div>
          <h3>${escapeHtml(finance.type)}</h3>
          <p>${escapeHtml(finance.status)}${finance.note ? ` | ${escapeHtml(finance.note)}` : ""}</p>
        </div>
        <strong>${formatMoney(finance.amount)}</strong>
      </article>
    `).join("")
    : `<article class="workspace-empty-state"><h3>No finance records</h3><p>This project does not have finance entries yet.</p></article>`;
  const updateTimeline = projectUpdates.length
    ? projectUpdates.map((update) => `
      <article class="workspace-update-card">
        <div class="workspace-update-head">
          <div>
            <h3>${escapeHtml(update.status)}</h3>
            <p>${escapeHtml(formatProjectStamp(update.statusUpdatedAt || update.createdAt))}</p>
          </div>
          <span class="record-tag ${statusClass(update.status)}">${escapeHtml(update.status)}</span>
        </div>
        <div class="workspace-stat-grid workspace-update-stats">
          <article class="workspace-stat-card"><span>Budget</span><strong>${formatMoney(update.budget)}</strong></article>
          <article class="workspace-stat-card"><span>Spent</span><strong>${formatMoney(update.spentAmount)}</strong></article>
          <article class="workspace-stat-card"><span>Pending</span><strong>${formatMoney(update.pendingAmount)}</strong></article>
          <article class="workspace-stat-card"><span>Remaining</span><strong>${formatMoney(update.remainingAmount)}</strong></article>
        </div>
        <div class="workspace-card-meta">
          <p><strong>Status remark:</strong> ${escapeHtml(update.statusRemark || "No status remark.")}</p>
          <p><strong>Priority:</strong> ${escapeHtml(update.priority || "Medium")}</p>
          <p><strong>Finance remark:</strong> ${escapeHtml(update.financeRemark || "No finance remark.")}</p>
          <p><strong>Finance updated:</strong> ${escapeHtml(formatProjectStamp(update.financeUpdatedAt))}</p>
        </div>
      </article>
    `).join("")
    : `<article class="workspace-empty-state"><h3>No update history</h3><p>Add rows to <code>employeeProjectUpdateHistory</code> to show the project timeline here.</p></article>`;
  const projectStatusFormId = `projectStatusForm-${project.id}`;
  const projectFinanceFormId = `projectFinanceForm-${project.id}`;
  const projectExpenseFormId = `projectExpenseForm-${project.id}`;

  workspacePlaceholderTitle.textContent = project.name;
  workspacePlaceholderText.textContent = `Focused view for ${project.name}.`;
  workspacePanelBody.innerHTML = `
    <div class="workspace-project-shell">
      <div class="workspace-project-main">
        <div class="workspace-project-hero">
          <div>
            <p class="workspace-project-label">Owner</p>
            <h3>${escapeHtml(owner)}</h3>
          </div>
          <div>
            <p class="workspace-project-label">Status</p>
            <h3>${escapeHtml(project.status)}</h3>
          </div>
        </div>
        <div class="workspace-stat-grid workspace-stat-grid-wide">
          <article class="workspace-stat-card"><span>Budget</span><strong>${formatMoney(summary.budget)}</strong></article>
          <article class="workspace-stat-card"><span>Spent</span><strong>${formatMoney(summary.spent)}</strong></article>
          <article class="workspace-stat-card"><span>Pending</span><strong>${formatMoney(summary.pending)}</strong></article>
          <article class="workspace-stat-card"><span>Remaining</span><strong>${formatMoney(summary.remaining)}</strong></article>
        </div>
        <div class="workspace-card-meta workspace-card-meta-wide">
          <p><strong>Status remark:</strong> ${escapeHtml(project.statusRemark || "No status remark yet.")}</p>
          <p><strong>Status updated:</strong> ${escapeHtml(formatProjectStamp(project.statusUpdatedAt))}</p>
          <p><strong>Priority:</strong> ${escapeHtml(project.priority || "Medium")}</p>
          <p><strong>Finance remark:</strong> ${escapeHtml(project.financeRemark || "No finance remark yet.")}</p>
          <p><strong>Finance updated:</strong> ${escapeHtml(formatProjectStamp(project.financeUpdatedAt))}</p>
          <p><strong>Deadline date:</strong> ${escapeHtml(project.deadlineDate || "Not set")}</p>
        </div>
        <div class="workspace-finance-records">${financeCards}</div>
        <section class="workspace-edit-grid">
          <article class="workspace-edit-card workspace-edit-card-finance">
            <div class="panel-heading">
              <div>
                <p class="panel-kicker">Project finance</p>
                <h2>Update budget and finance</h2>
              </div>
            </div>
            <form class="stack-form workspace-inline-form" id="${projectFinanceFormId}" data-project-finance-form="${project.id}">
              <div class="form-grid">
                <label class="form-field">
                  <span>Project budget</span>
                  <input type="number" name="budget" min="0" step="0.01" placeholder="Enter total budget" value="${Number(project.budget || 0)}">
                </label>
                <label class="form-field">
                  <span>Pending finance amount</span>
                  <input type="number" name="pendingAmount" min="0" step="0.01" placeholder="Enter pending amount" value="${Number(project.pendingAmount || 0)}">
                </label>
              </div>
              <div class="form-grid">
                <label class="form-field">
                  <span>Remaining balance</span>
                  <input type="number" name="remainingAmount" min="0" step="0.01" placeholder="Enter remaining balance" value="${Number(project.remainingAmount || 0)}">
                </label>
                <label class="form-field">
                  <span>Project deadline date</span>
                  <input type="date" name="deadlineDate" value="${escapeHtml(toInputDateValue(project.deadlineDate))}">
                </label>
              </div>
              <label class="form-field">
                <span>Finance remark</span>
                <input type="text" name="financeRemark" maxlength="300" placeholder="Write finance update remark" value="${escapeHtml(project.financeRemark || "")}">
              </label>
              <button type="submit">Save finance update</button>
            </form>
          </article>
          <article class="workspace-edit-card workspace-edit-card-expense">
            <div class="panel-heading">
              <div>
                <p class="panel-kicker">Expenses and savings</p>
                <h2>Add new expense or saving</h2>
              </div>
            </div>
            <form class="stack-form workspace-inline-form" id="${projectExpenseFormId}" data-project-expense-form="${project.id}">
              <div class="form-grid">
                <label class="form-field">
                  <span>New expense amount</span>
                  <input type="number" name="expenseDelta" min="0" step="0.01" placeholder="Enter new expense">
                </label>
                <label class="form-field">
                  <span>New saving amount</span>
                  <input type="number" name="savingsDelta" min="0" step="0.01" placeholder="Enter new saving">
                </label>
              </div>
              <label class="form-field">
                <span>Expense or saving remark</span>
                <input type="text" name="financeRemark" maxlength="300" placeholder="Write what changed in expense or saving">
              </label>
              <button type="submit">Add expense / saving</button>
            </form>
          </article>
          <article class="workspace-edit-card workspace-edit-card-status">
            <div class="panel-heading">
              <div>
                <p class="panel-kicker">Project status</p>
                <h2>Add new status and remark</h2>
              </div>
            </div>
            <form class="stack-form workspace-inline-form" id="${projectStatusFormId}" data-project-status-form="${project.id}">
              <div class="form-grid">
                <label class="form-field">
                  <span>Project status</span>
                  <select name="status">${buildProjectStatusOptions(project.status)}</select>
                </label>
                <label class="form-field">
                  <span>Priority</span>
                  <select name="priority">${buildProjectPriorityOptions(project.priority || "Medium")}</select>
                </label>
              </div>
              <div class="form-grid">
                <label class="form-field">
                  <span>Project deadline date</span>
                  <input type="date" name="deadlineDate" value="${escapeHtml(toInputDateValue(project.deadlineDate))}">
                </label>
              </div>
              <label class="form-field">
                <span>Project status remark</span>
                <input type="text" name="statusRemark" maxlength="300" placeholder="Write latest project status remark" value="${escapeHtml(project.statusRemark || "")}">
              </label>
              <button type="submit">Save status update</button>
            </form>
          </article>
        </section>
        <section class="workspace-update-history">
          <div class="panel-heading">
            <div>
              <p class="panel-kicker">Project update history</p>
              <h2>Latest updates</h2>
            </div>
            <p class="muted">Timeline from the SQL history table for this project.</p>
          </div>
          <div class="workspace-update-list">${updateTimeline}</div>
        </section>
      </div>
      ${projectRail}
    </div>
  `;
}

function renderWorkspaceTabs() {
  const definition = getWorkspaceDefinition(state.currentView);
  if (!definition) {
    workspaceTabs.classList.add("hidden");
    workspaceTabList.innerHTML = "";
    workspacePlaceholder.classList.add("hidden");
    workspacePanelBody.innerHTML = "";
    syncViewPanels();
    return;
  }

  ensureWorkspaceState(state.currentView);
  const openTabs = state.openWorkspaceTabs[state.currentView];
  const options = getWorkspaceOptions(state.currentView);
  workspaceTabs.classList.remove("hidden");
  workspaceTabList.innerHTML = openTabs.map((tabId) => {
    const option = options.find((item) => item.id === tabId);
    const isBase = tabId === definition.base.id;
    if (isBase) {
      return `<button class="workspace-tab ${state.currentWorkspaceTabId === tabId ? "active" : ""}" type="button" data-workspace-tab="${tabId}">${escapeHtml(definition.base.label)}</button>`;
    }
    if (!option) {
      return "";
    }
    const isFixedProjectTab = state.currentView === "projects" && (definition.options || []).some((item) => item.id === tabId);
    const closeMarkup = isFixedProjectTab ? "" : `<span class="workspace-tab-close" data-close-workspace-tab="${tabId}" aria-label="Close ${escapeHtml(option.label)} tab">x</span>`;
    return `<button class="workspace-tab ${state.currentWorkspaceTabId === tabId ? "active" : ""}" type="button" data-workspace-tab="${tabId}">${escapeHtml(option.label)}${closeMarkup}</button>`;
  }).join("");

  if (state.currentView === "projects") {
    renderProjectWorkspacePanel();
  } else if (isWorkspaceBaseTabActive()) {
    workspacePlaceholder.classList.add("hidden");
    workspacePanelBody.innerHTML = "";
  } else {
    const activeOption = options.find((item) => item.id === state.currentWorkspaceTabId);
    if (!activeOption) {
      workspacePlaceholder.classList.add("hidden");
      workspacePanelBody.innerHTML = "";
      syncViewPanels();
      return;
    }
    workspacePlaceholder.classList.remove("hidden");
    workspacePlaceholderKicker.textContent = `${definition.base.label} workspace`;
    workspacePlaceholderTitle.textContent = activeOption.title;
    workspacePlaceholderText.textContent = activeOption.text;
    workspacePanelBody.innerHTML = "";
  }

  syncViewPanels();
}

function setActiveView(view) {
  state.currentView = view;
  navLinks.forEach((button) => button.classList.toggle("active", button.dataset.view === view));
  topbarModeSwitch?.classList.toggle("hidden", view !== "dashboard");
  renderWorkspaceTabs();
  if (view === "leave") {
    renderHolidays();
  }
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
  if (!barChart) return;
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
  if (!metricGrid) return;
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
  const usersByManager = new Map();
  state.users.forEach((user) => {
    const key = user.managerId == null ? "root" : String(user.managerId);
    if (!usersByManager.has(key)) {
      usersByManager.set(key, []);
    }
    usersByManager.get(key).push(user);
  });

  const buildNode = (user) => ({
    name: user.name,
    designation: user.role || "Employee",
    children: (usersByManager.get(String(user.id)) || []).map(buildNode)
  });

  const rootUsers = usersByManager.get("root") || state.users.filter((user) => user.managerId == null);
  const organizationRoots = rootUsers.length ? rootUsers.map(buildNode) : [defaultOrganizationChart];

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
        ${organizationRoots.map((node) => renderNode(node)).join("")}
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

function classifyHoliday(name) {
  const value = String(name || "").trim().toLowerCase();
  if (value.includes("cl") || value.includes("casual")) return "cl";
  if (value.includes("pl") || value.includes("privilege")) return "pl";
  if (value.includes("unpaid")) return "unpaid";
  return "other";
}

function getHolidayCollections() {
  const collections = { cl: null, pl: null, unpaid: null, other: [] };
  state.holidays.forEach((holiday) => {
    const key = classifyHoliday(holiday.name);
    if (key === "other") {
      collections.other.push(holiday);
      return;
    }
    collections[key] = holiday;
  });
  return collections;
}

function buildHolidaySnapshot(holiday, fallbackName) {
  const used = Number(holiday?.used || 0);
  const total = Number(holiday?.total || 0);
  return {
    id: holiday?.id || null,
    name: holiday?.name || fallbackName,
    used,
    total,
    remaining: Math.max(total - used, 0),
    configured: Boolean(holiday),
    editable: holiday?.editable !== false
  };
}

function formatHolidayDateLabel(holiday) {
  if (!holiday?.holidayDate) return "";
  const date = new Date(holiday.holidayDate);
  if (Number.isNaN(date.getTime())) return holiday.holidayDate;
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

function getSelectedCalendarDateValue() {
  return state.selectedCalendarDate || formatLocalDate(clampCalendarCursor(state.calendarCursor || new Date()));
}

function formatSelectedCalendarDateLabel(value) {
  const date = coerceDate(value);
  if (!date) return "Selected day";
  return date.toLocaleDateString("en-IN", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
}

function getSchedulesForCalendarDate(dateValue) {
  return state.schedules.filter((item) => String(item.scheduleDate || item.day || "") === String(dateValue));
}

function getCurrentYearPublicHolidays() {
  const today = state.calendarCursor || new Date();
  return state.publicHolidays
    .filter((holiday) => Number(holiday.year) === today.getFullYear())
    .sort((a, b) => String(a.holidayDate).localeCompare(String(b.holidayDate)));
}

function renderLeaveCalendar() {
  if (!leaveCalendarBoard || !leaveCalendarMonth || !leaveCalendarMeta) return;
  const today = new Date();
  const currentMonth = clampCalendarCursor(state.calendarCursor || today);
  const firstDayIndex = currentMonth.getDay();
  const totalDays = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const holidaysByDay = new Map();
  const leaveEventsByDay = new Map();
  const scheduleByDay = new Map();
  const deadlineProjectsByDay = new Map();
  state.publicHolidays
    .filter((holiday) => Number(holiday.year) === currentMonth.getFullYear() && String(holiday.month) === currentMonth.toLocaleDateString("en-US", { month: "long" }))
    .forEach((holiday) => {
      const list = holidaysByDay.get(Number(holiday.date)) || [];
      list.push(holiday.name);
      holidaysByDay.set(Number(holiday.date), list);
    });

  state.leaveEvents.forEach((leaveEvent) => {
    const startDate = new Date(leaveEvent.startDate);
    const endDate = new Date(leaveEvent.endDate);
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return;
    for (let cursor = new Date(startDate); cursor <= endDate; cursor.setDate(cursor.getDate() + 1)) {
      if (cursor.getFullYear() !== currentMonth.getFullYear() || cursor.getMonth() !== currentMonth.getMonth()) {
        continue;
      }
      const day = cursor.getDate();
      const list = leaveEventsByDay.get(day) || [];
      list.push(leaveEvent);
      leaveEventsByDay.set(day, list);
    }
  });

  state.schedules.forEach((schedule) => {
    const scheduleDate = coerceDate(schedule.scheduleDate || schedule.day);
    if (!scheduleDate) return;
    if (scheduleDate.getFullYear() !== currentMonth.getFullYear() || scheduleDate.getMonth() !== currentMonth.getMonth()) return;
    const day = scheduleDate.getDate();
    const list = scheduleByDay.get(day) || [];
    list.push(schedule);
    scheduleByDay.set(day, list);
  });

  state.projects.forEach((project) => {
    const deadline = coerceDate(project.deadlineDate);
    if (!deadline) return;
    if (deadline.getFullYear() !== currentMonth.getFullYear() || deadline.getMonth() !== currentMonth.getMonth()) return;
    const day = deadline.getDate();
    const list = deadlineProjectsByDay.get(day) || [];
    list.push(project);
    deadlineProjectsByDay.set(day, list);
  });
  const cells = [];

  for (let i = 0; i < firstDayIndex; i += 1) {
    cells.push('<div class="leave-calendar-cell is-empty" aria-hidden="true"></div>');
  }

  for (let day = 1; day <= totalDays; day += 1) {
    const cellDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const isToday = day === today.getDate() && currentMonth.getMonth() === today.getMonth() && currentMonth.getFullYear() === today.getFullYear();
    const isSunday = cellDate.getDay() === 0;
    const isSaturday = cellDate.getDay() === 6;
    const isWeekend = isSunday || isSaturday;
    const holidayNames = holidaysByDay.get(day) || [];
    const leaveEntries = leaveEventsByDay.get(day) || [];
    const daySchedules = scheduleByDay.get(day) || [];
    const deadlineProjects = deadlineProjectsByDay.get(day) || [];
    const leaveClass = leaveEntries.length ? ` has-leave leave-${classifyLeaveType(leaveEntries[0].type)}` : "";
    const cellIsoDate = formatLocalDate(cellDate);
    const isSelected = cellIsoDate === getSelectedCalendarDateValue();
    cells.push(`
      <button class="leave-calendar-cell ${isToday ? "is-today" : ""} ${isWeekend ? "is-weekend" : ""} ${isSunday ? "is-sunday" : ""} ${isSaturday ? "is-saturday" : ""}${leaveClass} ${isSelected ? "is-selected" : ""}" type="button" data-calendar-date="${cellIsoDate}">
        <div class="leave-calendar-notes">
          ${holidayNames.length ? `<small class="holiday-note">${escapeHtml(holidayNames[0])}</small>` : ""}
          ${leaveEntries.map((entry) => `<small class="leave-badge leave-badge-${classifyLeaveType(entry.type)}">${escapeHtml(entry.type)}</small>`).join("")}
          ${daySchedules.slice(0, 2).map((entry) => `<small class="calendar-schedule-note">${escapeHtml(entry.title)}</small>`).join("")}
          ${deadlineProjects.slice(0, 2).map((project) => `<small class="calendar-deadline-note ${statusClass(project.status || "On Track")}">${escapeHtml(project.name)} deadline</small>`).join("")}
        </div>
        <span>${day}</span>
      </button>
    `);
  }

  leaveCalendarMonth.textContent = formatMonthLabel(currentMonth);
  leaveCalendarMeta.textContent = `${totalDays} days in this month`;
  if (leaveCalendarPrevBtn) {
    leaveCalendarPrevBtn.disabled = currentMonth.getFullYear() === 2000 && currentMonth.getMonth() === 0;
  }
  if (leaveCalendarNextBtn) {
    leaveCalendarNextBtn.disabled = currentMonth.getFullYear() === 2100 && currentMonth.getMonth() === 11;
  }
  leaveCalendarBoard.innerHTML = cells.join("");
}

function renderCalendarPlanner() {
  if (!calendarPlannerTitle || !calendarPlannerMeta || !calendarProjectDeadlineList || !calendarScheduleList) return;
  const selectedDate = getSelectedCalendarDateValue();
  const schedules = getSchedulesForCalendarDate(selectedDate);
  const deadlineProjects = state.projects.filter((project) => String(project.deadlineDate || "") === String(selectedDate));
  calendarPlannerTitle.textContent = formatSelectedCalendarDateLabel(selectedDate);
  calendarPlannerMeta.textContent = `${schedules.length} schedule item(s) and ${deadlineProjects.length} project deadline(s) on this day.`;
  calendarProjectDeadlineList.innerHTML = deadlineProjects.length
    ? deadlineProjects.map((project) => `<article class="calendar-detail-item"><h3>${escapeHtml(project.name)}</h3><p>${escapeHtml(project.status)} | Priority: ${escapeHtml(project.priority || "Medium")}</p></article>`).join("")
    : `<article class="calendar-detail-item"><h3>No project deadline</h3><p>No project deadline is set for this day.</p></article>`;
  calendarScheduleList.innerHTML = schedules.length
    ? schedules.map((schedule) => `<article class="calendar-detail-item"><div><h3>${escapeHtml(schedule.title)}</h3><p>${escapeHtml(schedule.note || "No note")}</p></div><div class="record-actions"><button class="mini-btn" type="button" data-edit-calendar-schedule="${schedule.id}">Edit</button><button class="mini-btn danger" type="button" data-delete-calendar-schedule="${schedule.id}">Delete</button></div></article>`).join("")
    : `<article class="calendar-detail-item"><h3>No schedule for this day</h3><p>Use the form below to add a schedule directly from the calendar.</p></article>`;
}

function renderHolidayTypePanel(target, snapshot, fallbackName) {
  const actionLabel = snapshot.configured ? "Edit" : "Create";
  const actionAttr = snapshot.configured
    ? `data-edit-holiday="${snapshot.id}"`
    : `data-prefill-holiday="${fallbackName}"`;
  const footerAction = snapshot.editable
    ? `<button class="mini-btn" type="button" ${actionAttr}>${actionLabel}</button>`
    : `<span class="muted">Auto calculated</span>`;

  target.innerHTML = `
    <div class="leave-stat-grid">
      <article class="leave-stat-card">
        <span class="leave-stat-label">Used</span>
        <strong>${snapshot.used}</strong>
      </article>
      <article class="leave-stat-card">
        <span class="leave-stat-label">Total</span>
        <strong>${snapshot.total}</strong>
      </article>
      <article class="leave-stat-card">
        <span class="leave-stat-label">Remaining</span>
        <strong>${snapshot.remaining}</strong>
      </article>
    </div>
    <div class="leave-panel-footer">
      <p class="muted">${snapshot.editable ? (snapshot.configured ? `${escapeHtml(snapshot.name)} balance is configured for the current year.` : `${escapeHtml(fallbackName)} is not configured yet.`) : `${escapeHtml(snapshot.name)} balance is calculated from approved leave entries.`}</p>
      ${footerAction}
    </div>
  `;
}

function renderDashboard() {
  const data = dashboardData[state.currentRange];
  renderHeroProjects();
  renderMetricGrid(buildOperationalMetrics());
  if (capacityPercent) {
    capacityPercent.textContent = `${data.capacity.percent}%`;
  }
  if (capacityCaption) {
    capacityCaption.textContent = data.capacity.caption;
  }
  if (capacityFill) {
    capacityFill.style.width = `${data.capacity.percent}%`;
  }
  renderProjectStatus();
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
  if (!holidayMonthSummary || !holidayClSummary || !holidayPlSummary || !holidayUnpaidSummary || !holidayYearSummary || !holidayGrid) {
    return;
  }
  if (!state.selectedCalendarDate) {
    state.selectedCalendarDate = formatLocalDate(clampCalendarCursor(state.calendarCursor || new Date()));
  }
  const collections = getHolidayCollections();
  const clHoliday = buildHolidaySnapshot(collections.cl, "CL Holiday");
  const plHoliday = buildHolidaySnapshot(collections.pl, "PL Holiday");
  const unpaidHoliday = buildHolidaySnapshot(collections.unpaid, "Unpaid Holiday");
  const today = clampCalendarCursor(state.calendarCursor || new Date());
  const currentYearHolidays = getCurrentYearPublicHolidays();
  const monthHolidays = currentYearHolidays.filter((holiday) => String(holiday.month) === today.toLocaleDateString("en-US", { month: "long" }));
  const upcomingHoliday = currentYearHolidays.find((holiday) => String(holiday.holidayDate) >= today.toISOString().slice(0, 10)) || currentYearHolidays[0] || null;
  const configuredNames = monthHolidays.length
    ? monthHolidays.map((holiday) => holiday.name).join(", ")
    : "No public holidays in this month yet";

  renderLeaveCalendar();
  renderCalendarPlanner();

  holidayMonthSummary.innerHTML = `
    <article class="leave-stat-card">
      <span class="leave-stat-label">Month</span>
      <strong>${today.toLocaleDateString("en-IN", { month: "short" })}</strong>
    </article>
    <article class="leave-stat-card">
      <span class="leave-stat-label">Holidays</span>
      <strong>${monthHolidays.length}</strong>
    </article>
    <article class="leave-stat-card">
      <span class="leave-stat-label">Next date</span>
      <strong>${monthHolidays[0] ? monthHolidays[0].date : "-"}</strong>
    </article>
    <article class="leave-note-card">
      <span class="leave-stat-label">In this month</span>
      <p>${escapeHtml(configuredNames)}</p>
    </article>
  `;

  renderHolidayTypePanel(holidayClSummary, clHoliday, "CL Holiday");
  renderHolidayTypePanel(holidayPlSummary, plHoliday, "PL Holiday");
  renderHolidayTypePanel(holidayUnpaidSummary, unpaidHoliday, "Unpaid Holiday");

  holidayYearSummary.innerHTML = `
    <article class="leave-stat-card">
      <span class="leave-stat-label">Year</span>
      <strong>${today.getFullYear()}</strong>
    </article>
    <article class="leave-stat-card">
      <span class="leave-stat-label">Total holidays</span>
      <strong>${currentYearHolidays.length}</strong>
    </article>
    <article class="leave-stat-card">
      <span class="leave-stat-label">Upcoming</span>
      <strong>${escapeHtml(upcomingHoliday?.name || "None")}</strong>
    </article>
    <article class="leave-stat-card">
      <span class="leave-stat-label">Next date</span>
      <strong>${escapeHtml(upcomingHoliday ? formatHolidayDateLabel(upcomingHoliday) : "-")}</strong>
    </article>
  `;

  holidayGrid.innerHTML = currentYearHolidays.length
    ? currentYearHolidays.map((holiday) => `<article class="holiday-card"><div><strong>${escapeHtml(holiday.name)}</strong><span>${escapeHtml(holiday.month)} ${holiday.date} | ${escapeHtml(holiday.day)}</span></div><div class="record-actions"><div class="holiday-balance">${escapeHtml(String(holiday.date))}</div><button class="mini-btn" type="button" data-edit-holiday="${holiday.id}">Edit</button></div></article>`).join("")
    : `<article class="holiday-card"><div><strong>No public holidays yet</strong><span>Add the holiday date and name below to build the yearly holiday calendar.</span></div><div class="holiday-balance">0</div></article>`;
}

function renderUsers() {
  const options = state.users.map((user) => `<option value="${user.id}">${escapeHtml(user.name)}</option>`).join("");
  projectOwnerInput.innerHTML = options;
  userList.innerHTML = state.users.map((user) => `<article class="record-card"><div><h3>${escapeHtml(user.name)}</h3><p>${escapeHtml(user.role)} | ${escapeHtml(user.type)}</p></div><span class="record-tag completed">${escapeHtml(user.type)}</span></article>`).join("");
}

function renderProjects() {
  const usersById = Object.fromEntries(state.users.map((user) => [user.id, user]));
  projectStatusInput.innerHTML = buildProjectStatusOptions(projectStatusInput.value || "Assign");
  financeProjectInput.innerHTML = state.projects.map((project) => `<option value="${project.id}">${escapeHtml(project.name)}</option>`).join("");
  projectList.innerHTML = state.projects.map((project) => `<article class="record-card"><div><h3>${escapeHtml(project.name)}</h3><p>Owner: ${escapeHtml(usersById[project.ownerId]?.name || "Unassigned")}</p></div><span class="record-tag ${statusClass(project.status)}">${escapeHtml(project.status)}</span></article>`).join("");
  renderHeroProjects();
  renderProjectStatus();
  if (state.currentView === "projects") {
    renderWorkspaceTabs();
  }
}

function renderFinances() {
  const projectsById = Object.fromEntries(state.projects.map((project) => [project.id, project]));
  financeList.innerHTML = state.finances.map((finance) => `<article class="record-card"><div><h3>${escapeHtml(finance.type)} | ${formatMoney(finance.amount)}</h3><p>${escapeHtml(projectsById[finance.projectId]?.name || "Unknown project")} | ${escapeHtml(finance.status)}${finance.note ? ` | ${escapeHtml(finance.note)}` : ""}</p></div><div class="record-actions"><button class="mini-btn" type="button" data-edit-finance="${finance.id}">Edit</button><button class="mini-btn danger" type="button" data-delete-finance="${finance.id}">Delete</button></div></article>`).join("");
  if (state.currentView === "projects") {
    renderWorkspaceTabs();
  }
}

function renderTodos() {
  if (!todoList) return;
  todoList.innerHTML = state.todos.map((todo) => `<li class="todo-item ${todo.done ? "done" : ""}"><label><input type="checkbox" data-id="${todo.id}" ${todo.done ? "checked" : ""}><span>${escapeHtml(todo.text)}</span></label><button type="button" data-delete="${todo.id}">Delete</button></li>`).join("");
}

function renderMeetingUpcomingList() {
  const upcomingMeetings = sortMeetings(state.meetings)
    .filter((meeting) => {
      const startsAt = inferMeetingDate(meeting);
      return startsAt && startsAt.getTime() >= Date.now();
    })
    .slice(0, 8);

  meetingUpcomingList.innerHTML = upcomingMeetings.length
    ? upcomingMeetings.map((meeting) => `<article class="meeting-item meeting-upcoming-card ${meeting.id === state.selectedMeetingId ? "active" : ""}" data-id="${meeting.id}"><strong>${escapeHtml(meeting.title)}</strong><p>${escapeHtml(meeting.date)} | ${escapeHtml(toMeridiemTime(meeting.startTime))} - ${escapeHtml(toMeridiemTime(meeting.endTime))}</p><span class="meeting-item-tag">${escapeHtml(meeting.location || "Upcoming")}</span></article>`).join("")
    : `<article class="meeting-upcoming-card"><strong>No upcoming meetings</strong><p>Schedule the next meeting from the form above.</p></article>`;
}

function renderMeetingHistoryList() {
  const historyMeetings = sortMeetings(state.meetings)
    .filter((meeting) => {
      const startsAt = inferMeetingDate(meeting);
      return startsAt && startsAt.getTime() < Date.now();
    })
    .sort((a, b) => meetingSortValue(b) - meetingSortValue(a))
    .slice(0, 24);

  meetingHistoryList.innerHTML = historyMeetings.length
    ? historyMeetings.map((meeting) => `<article class="meeting-item ${meeting.id === state.selectedMeetingId ? "active" : ""}" data-id="${meeting.id}"><h3>${escapeHtml(meeting.title)}</h3><p>${escapeHtml(meeting.date)} | ${escapeHtml(toMeridiemTime(meeting.startTime))} - ${escapeHtml(toMeridiemTime(meeting.endTime))}</p><span class="meeting-item-tag">${escapeHtml(meeting.location || "History")}</span></article>`).join("")
    : `<article class="meeting-item"><h3>No meeting history</h3><p>Past meetings from the database will appear here automatically.</p></article>`;
}

function resetMeetingForm() {
  state.editingMeetingId = null;
  meetingSubmitBtn.textContent = "Save meeting";
  meetingForm.reset();
}

function loadMeetingIntoForm(meeting) {
  if (!meeting) return;
  state.editingMeetingId = meeting.id;
  meetingSubmitBtn.textContent = "Update meeting";
  meetingTitleInput.value = meeting.title || "";
  meetingDateInput.value = meeting.date || "";
  meetingLocationInput.value = meeting.location || "";
  meetingStartTimeInput.value = toMeridiemTime(meeting.startTime);
  meetingEndTimeInput.value = toMeridiemTime(meeting.endTime);
  meetingLinkInput.value = meeting.link || "";
}

function renderMeetings() {
  renderMeetingUpcomingList();
  renderMeetingHistoryList();
  const sortedMeetings = sortMeetings(state.meetings);
  meetingSelectInput.innerHTML = sortedMeetings.length
    ? sortedMeetings.map((meeting) => `<option value="${meeting.id}" ${meeting.id === state.selectedMeetingId ? "selected" : ""}>${escapeHtml(meeting.title)}</option>`).join("")
    : `<option value="">No meetings found</option>`;
  const selectedMeeting = state.meetings.find((meeting) => meeting.id === state.selectedMeetingId);
  if (!selectedMeeting) {
    meetingSelectInput.value = "";
    meetingSelectInput.disabled = true;
    meetingMeta.textContent = "Choose any meeting from the list.";
    meetingLocationMeta.textContent = "";
    meetingLinkMeta.textContent = "";
    meetingSummary.value = "";
    meetingNotes.value = "";
    deleteMeetingBtn.disabled = true;
    return;
  }
  meetingSelectInput.disabled = false;
  meetingSelectInput.value = String(selectedMeeting.id);
  meetingMeta.textContent = `${selectedMeeting.date || ""}${selectedMeeting.startTime ? ` | ${toMeridiemTime(selectedMeeting.startTime)}` : ""}${selectedMeeting.endTime ? ` - ${toMeridiemTime(selectedMeeting.endTime)}` : ""}`;
  meetingLocationMeta.textContent = selectedMeeting.location ? `Location: ${selectedMeeting.location}` : "Location: Not set";
  meetingLinkMeta.innerHTML = selectedMeeting.link ? `Link: <a href="${escapeHtml(selectedMeeting.link)}" target="_blank" rel="noreferrer">${escapeHtml(selectedMeeting.link)}</a>` : "Link: Not set";
  meetingSummary.value = selectedMeeting.summary || "";
  meetingNotes.value = selectedMeeting.notes;
  deleteMeetingBtn.disabled = false;
}

function renderSidebar() {
  renderSessionIdentity();

  const importantTask = state.todos.find((todo) => !todo.done) || state.todos[0] || null;
  upcomingTaskTitle.textContent = importantTask ? importantTask.text : "No important task right now";
  upcomingTaskMeta.textContent = importantTask
    ? (importantTask.done ? "This task is already complete." : "First open task from your planner.")
    : "Add a task to see it here.";

  const firstMeeting = pickUpcomingMeeting()?.meeting || sortMeetings(state.meetings)[0] || null;
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

function resetCalendarScheduleForm() {
  state.editingScheduleId = null;
  calendarScheduleSubmitBtn.textContent = "Add schedule for day";
  calendarScheduleForm.reset();
  calendarScheduleColorInput.value = "#2563eb";
}

function resetHolidayForm() {
  state.editingHolidayId = null;
  holidaySubmitBtn.textContent = "Save holiday";
  holidayForm.reset();
}

function shiftCalendarMonth(offset) {
  const cursor = clampCalendarCursor(state.calendarCursor || new Date());
  const next = new Date(cursor.getFullYear(), cursor.getMonth() + offset, 1);
  state.calendarCursor = clampCalendarCursor(next);
  renderHolidays();
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

leaveCalendarPrevBtn?.addEventListener("click", () => shiftCalendarMonth(-1));
leaveCalendarNextBtn?.addEventListener("click", () => shiftCalendarMonth(1));

leaveCalendarBoard?.addEventListener("click", (event) => {
  const dateButton = event.target.closest("[data-calendar-date]");
  if (!dateButton) return;
  state.selectedCalendarDate = dateButton.getAttribute("data-calendar-date");
  renderHolidays();
});

workspaceTabList.addEventListener("click", (event) => {
  const closeButton = event.target.closest("[data-close-workspace-tab]");
  if (closeButton) {
    const tabId = closeButton.getAttribute("data-close-workspace-tab");
    const openTabs = state.openWorkspaceTabs[state.currentView] || [];
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

workspacePanelBody.addEventListener("click", (event) => {
  const projectButton = event.target.closest("[data-open-project-tab]");
  if (projectButton) {
    const projectId = Number(projectButton.getAttribute("data-open-project-tab"));
    if (!projectId) return;
    const tabId = getProjectTabId(projectId);
    const openTabs = state.openWorkspaceTabs.projects || [];
    if (!openTabs.includes(tabId)) {
      openTabs.push(tabId);
    }
    state.currentWorkspaceTabId = tabId;
    renderWorkspaceTabs();
    return;
  }

  const removeButton = event.target.closest("[data-remove-project]");
  if (!removeButton) return;
  const projectId = Number(removeButton.getAttribute("data-remove-project"));
  if (!projectId) return;
  const project = state.projects.find((item) => Number(item.id) === projectId);
  const confirmed = window.confirm(`Remove project "${project?.name || projectId}" from the database?`);
  if (!confirmed) return;
  apiRequest(`/api/projects/${projectId}`, { method: "DELETE" })
    .then(() => {
      state.projects = state.projects.filter((item) => Number(item.id) !== projectId);
      state.projectUpdates = state.projectUpdates.filter((item) => Number(item.projectId) !== projectId);
      state.finances = state.finances.filter((item) => Number(item.projectId) !== projectId);
      state.openWorkspaceTabs.projects = (state.openWorkspaceTabs.projects || []).filter((item) => item !== getProjectTabId(projectId));
      if (state.currentWorkspaceTabId === getProjectTabId(projectId)) {
        state.currentWorkspaceTabId = "projects-home";
      }
      renderProjects();
      renderFinances();
      renderSidebar();
      renderWorkspaceTabs();
    })
    .catch((error) => {
      window.alert(error?.message || "Project could not be removed.");
    });
});

workspacePanelBody.addEventListener("submit", async (event) => {
  const statusForm = event.target.closest("[data-project-status-form]");
  const financeFormEl = event.target.closest("[data-project-finance-form]");
  const expenseFormEl = event.target.closest("[data-project-expense-form]");
  const createProjectFormEl = event.target.closest("[data-create-project-form]");
  if (!statusForm && !financeFormEl && !expenseFormEl && !createProjectFormEl) return;
  event.preventDefault();

  try {
    if (createProjectFormEl) {
      const formData = new FormData(createProjectFormEl);
      const project = await apiRequest("/api/projects", {
        method: "POST",
        body: JSON.stringify({
          name: String(formData.get("name") || "").trim(),
          ownerId: Number(formData.get("ownerId") || 0),
          status: String(formData.get("status") || "").trim(),
          priority: String(formData.get("priority") || "").trim()
        })
      });
      state.projects.unshift(project);
      renderProjects();
      renderSidebar();
      createProjectFormEl.reset();
      state.currentWorkspaceTabId = "projects-home";
      renderWorkspaceTabs();
      return;
    }

    if (statusForm) {
      const projectId = Number(statusForm.getAttribute("data-project-status-form"));
      const formData = new FormData(statusForm);
      const result = await apiRequest(`/api/projects/${projectId}`, {
        method: "PATCH",
        body: JSON.stringify({
          status: String(formData.get("status") || ""),
          priority: String(formData.get("priority") || ""),
          statusRemark: String(formData.get("statusRemark") || "").trim(),
          deadlineDate: String(formData.get("deadlineDate") || ""),
          statusUpdatedAt: new Date().toISOString()
        })
      });
      state.projects = state.projects.map((item) => item.id === result.project?.id ? result.project : item);
      state.projectUpdates = [
        ...state.projectUpdates.filter((item) => Number(item.projectId) !== projectId),
        ...(result.projectUpdates || [])
      ];
      renderProjects();
      renderFinances();
      renderSidebar();
      renderWorkspaceTabs();
      return;
    }

    if (financeFormEl) {
      const projectId = Number(financeFormEl.getAttribute("data-project-finance-form"));
      const formData = new FormData(financeFormEl);
      const result = await apiRequest(`/api/projects/${projectId}`, {
        method: "PATCH",
        body: JSON.stringify({
          budget: Number(formData.get("budget") || 0),
          pendingAmount: Number(formData.get("pendingAmount") || 0),
          remainingAmount: Number(formData.get("remainingAmount") || 0),
          financeRemark: String(formData.get("financeRemark") || "").trim(),
          financeUpdatedAt: new Date().toISOString(),
          deadlineDate: String(formData.get("deadlineDate") || "")
        })
      });
      state.projects = state.projects.map((item) => item.id === result.project?.id ? result.project : item);
      state.projectUpdates = [
        ...state.projectUpdates.filter((item) => Number(item.projectId) !== projectId),
        ...(result.projectUpdates || [])
      ];
      renderProjects();
      renderFinances();
      renderSidebar();
      renderWorkspaceTabs();
      return;
    }

    if (expenseFormEl) {
      const projectId = Number(expenseFormEl.getAttribute("data-project-expense-form"));
      const formData = new FormData(expenseFormEl);
      const result = await apiRequest(`/api/projects/${projectId}`, {
        method: "PATCH",
        body: JSON.stringify({
          expenseDelta: Number(formData.get("expenseDelta") || 0),
          savingsDelta: Number(formData.get("savingsDelta") || 0),
          financeRemark: String(formData.get("financeRemark") || "").trim(),
          financeUpdatedAt: new Date().toISOString()
        })
      });
      state.projects = state.projects.map((item) => item.id === result.project?.id ? result.project : item);
      state.projectUpdates = [
        ...state.projectUpdates.filter((item) => Number(item.projectId) !== projectId),
        ...(result.projectUpdates || [])
      ];
      renderProjects();
      renderFinances();
      renderSidebar();
      renderWorkspaceTabs();
      return;
    }
  } catch (error) {
    window.alert(error?.message || "Project update could not be saved.");
  }
});

calendarScheduleForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const selectedDate = getSelectedCalendarDateValue();
  const payload = {
    range: "daily",
    day: selectedDate,
    scheduleDate: selectedDate,
    title: calendarScheduleTitleInput.value.trim(),
    note: calendarScheduleNoteInput.value.trim(),
    color: calendarScheduleColorInput.value
  };
  if (!payload.title || !payload.note) return;
  if (state.editingScheduleId) {
    const updated = await apiRequest(`/api/schedules/${state.editingScheduleId}`, { method: "PATCH", body: JSON.stringify(payload) });
    state.schedules = state.schedules.map((item) => item.id === updated.id ? updated : item);
  } else {
    const created = await apiRequest("/api/schedules", { method: "POST", body: JSON.stringify(payload) });
    state.schedules.unshift(created);
  }
  resetCalendarScheduleForm();
  renderHolidays();
  renderSidebar();
});

calendarScheduleCancelBtn?.addEventListener("click", resetCalendarScheduleForm);

calendarScheduleList?.addEventListener("click", async (event) => {
  const editId = event.target.getAttribute("data-edit-calendar-schedule");
  const deleteId = event.target.getAttribute("data-delete-calendar-schedule");
  if (editId) {
    const schedule = state.schedules.find((item) => item.id === Number(editId));
    if (!schedule) return;
    state.editingScheduleId = schedule.id;
    state.selectedCalendarDate = schedule.scheduleDate || schedule.day || getSelectedCalendarDateValue();
    calendarScheduleSubmitBtn.textContent = "Update schedule for day";
    calendarScheduleColorInput.value = schedule.color || "#2563eb";
    calendarScheduleTitleInput.value = schedule.title;
    calendarScheduleNoteInput.value = schedule.note;
    renderHolidays();
    return;
  }
  if (deleteId) {
    await apiRequest(`/api/schedules/${deleteId}`, { method: "DELETE" });
    state.schedules = state.schedules.filter((item) => item.id !== Number(deleteId));
    resetCalendarScheduleForm();
    renderHolidays();
    renderSidebar();
  }
});

holidayForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const payload = {
    name: holidayNameInput.value.trim(),
    holidayDate: holidayDateInput.value
  };
  if (!payload.name || !payload.holidayDate) return;
  if (state.editingHolidayId) {
    const updated = await apiRequest(`/api/holidays/${state.editingHolidayId}`, { method: "PATCH", body: JSON.stringify(payload) });
    state.publicHolidays = state.publicHolidays.map((item) => item.id === updated.id ? updated : item);
  } else {
    const created = await apiRequest("/api/holidays", { method: "POST", body: JSON.stringify(payload) });
    state.publicHolidays.unshift(created);
  }
  resetHolidayForm();
  renderHolidays();
});

holidayCancelBtn.addEventListener("click", resetHolidayForm);

leaveGrid.addEventListener("click", (event) => {
  const prefillName = event.target.getAttribute("data-prefill-holiday");
  if (prefillName) {
    resetHolidayForm();
    holidayNameInput.value = prefillName;
    return;
  }

  const editId = event.target.getAttribute("data-edit-holiday");
  if (!editId) return;
  const holiday = state.publicHolidays.find((item) => item.id === Number(editId));
  if (!holiday) return;
  state.editingHolidayId = holiday.id;
  holidaySubmitBtn.textContent = "Update holiday";
  holidayNameInput.value = holiday.name;
  holidayDateInput.value = holiday.holidayDate || "";
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

meetingForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const startTime24 = toTwentyFourHourTime(meetingStartTimeInput.value);
  const endTime24 = toTwentyFourHourTime(meetingEndTimeInput.value);
  const payload = {
    title: meetingTitleInput.value.trim(),
    date: meetingDateInput.value,
    startTime: startTime24,
    endTime: endTime24,
    location: meetingLocationInput.value.trim(),
    link: normalizeMeetingLink(meetingLinkInput.value),
    notes: "",
    summary: ""
  };
  if (!payload.title || !payload.date || !payload.startTime || !payload.endTime) {
    window.alert("Please enter meeting title, date, start time, and end time.");
    return;
  }
  const meetingStart = buildMeetingDateTime(payload.date, payload.startTime);
  const meetingEnd = buildMeetingDateTime(payload.date, payload.endTime);
  if (meetingStart && meetingEnd && meetingEnd < meetingStart) {
    window.alert("End time cannot be earlier than start time.");
    return;
  }

  meetingSubmitBtn.disabled = true;
  const originalButtonText = meetingSubmitBtn.textContent;
  meetingSubmitBtn.textContent = state.editingMeetingId ? "Updating..." : "Saving...";

  try {
    if (state.editingMeetingId) {
      const existing = state.meetings.find((meeting) => meeting.id === state.editingMeetingId);
      const updated = await apiRequest(`/api/meetings/${state.editingMeetingId}`, {
        method: "PATCH",
        body: JSON.stringify({
          ...payload,
          notes: existing?.notes || "",
          summary: existing?.summary || ""
        })
      });
      state.meetings = state.meetings.map((meeting) => meeting.id === updated.id ? updated : meeting);
      state.selectedMeetingId = updated.id;
    } else {
      const created = await apiRequest("/api/meetings", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      state.meetings.unshift(created);
      state.selectedMeetingId = created.id;
    }
    resetMeetingForm();
    renderMeetings();
    renderSidebar();
    window.location.reload();
  } catch (error) {
    window.alert(error?.message || "Meeting could not be saved.");
  } finally {
    meetingSubmitBtn.disabled = false;
    meetingSubmitBtn.textContent = originalButtonText;
  }
});

meetingCancelBtn.addEventListener("click", resetMeetingForm);

todoForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const text = todoInput?.value.trim();
  if (!text) return;
  const todo = await apiRequest("/api/todos", { method: "POST", body: JSON.stringify({ text }) });
  state.todos.unshift(todo);
  renderTodos();
  todoForm.reset();
});

todoList?.addEventListener("click", async (event) => {
  const deleteId = event.target.getAttribute("data-delete");
  if (!deleteId) return;
  await apiRequest(`/api/todos/${deleteId}`, { method: "DELETE" });
  state.todos = state.todos.filter((todo) => todo.id !== Number(deleteId));
  renderTodos();
});

todoList?.addEventListener("change", async (event) => {
  const todoId = event.target.getAttribute("data-id");
  if (!todoId) return;
  const updated = await apiRequest(`/api/todos/${todoId}`, { method: "PATCH", body: JSON.stringify({ done: event.target.checked }) });
  state.todos = state.todos.map((todo) => todo.id === updated.id ? updated : todo);
  renderTodos();
});

function handleMeetingSelection(event) {
  const meetingItem = event.target.closest(".meeting-item");
  if (!meetingItem) return;
  if (!meetingItem.dataset.id) return;
  state.selectedMeetingId = Number(meetingItem.dataset.id);
  loadMeetingIntoForm(state.meetings.find((meeting) => meeting.id === state.selectedMeetingId));
  renderMeetings();
}

meetingUpcomingList.addEventListener("click", handleMeetingSelection);
meetingHistoryList.addEventListener("click", handleMeetingSelection);
meetingSelectInput.addEventListener("change", () => {
  const selectedId = Number(meetingSelectInput.value);
  if (!selectedId) return;
  state.selectedMeetingId = selectedId;
  loadMeetingIntoForm(state.meetings.find((meeting) => meeting.id === selectedId));
  renderMeetings();
});

saveNotesBtn.addEventListener("click", async () => {
  if (!state.selectedMeetingId) return;
  const current = state.meetings.find((meeting) => meeting.id === state.selectedMeetingId);
  const updated = await apiRequest(`/api/meetings/${state.selectedMeetingId}`, {
    method: "PATCH",
    body: JSON.stringify({
      title: current?.title || "",
      date: current?.date || "",
      startTime: current?.startTime || "",
      endTime: current?.endTime || "",
      location: current?.location || "",
      link: current?.link || "",
      summary: meetingSummary.value,
      notes: meetingNotes.value
    })
  });
  state.meetings = state.meetings.map((meeting) => meeting.id === updated.id ? updated : meeting);
  renderMeetings();
  renderSidebar();
  saveNotesBtn.textContent = "Saved";
  window.setTimeout(() => {
    saveNotesBtn.textContent = "Save meeting details";
  }, 1200);
});

deleteMeetingBtn.addEventListener("click", async () => {
  if (!state.selectedMeetingId) return;
  await apiRequest(`/api/meetings/${state.selectedMeetingId}`, { method: "DELETE" });
  state.meetings = state.meetings.filter((meeting) => meeting.id !== state.selectedMeetingId);
  state.selectedMeetingId = state.meetings[0]?.id || null;
  resetMeetingForm();
  renderMeetings();
  renderSidebar();
});

async function init() {
  const savedSession = sessionStorage.getItem(SESSION_KEY);
  if (!savedSession) {
    window.location.href = "/";
    return;
  }
  state.authUser = JSON.parse(savedSession);
  renderSessionIdentity();
  updateDayOptions(state.currentRange);
  scheduleRangeInput.value = state.currentRange;
  const data = await apiRequest("/api/bootstrap");
  state.holidays = data.holidays || [];
  state.publicHolidays = data.publicHolidays || [];
  state.leaveEvents = data.leaveEvents || [];
  state.meetings = data.meetings || [];
  state.todos = data.todos || [];
  state.users = data.users || [];
  state.projects = data.projects || [];
  state.projectUpdates = data.projectUpdates || [];
  state.schedules = data.schedules || [];
  state.selectedCalendarDate = formatLocalDate(new Date());
  state.finances = data.finances || [];
  state.calendarCursor = clampCalendarCursor(new Date());
  state.meetings = sortMeetings(state.meetings);
  state.selectedMeetingId = pickUpcomingMeeting()?.meeting?.id || [...state.meetings].sort((a, b) => meetingSortValue(b) - meetingSortValue(a))[0]?.id || null;
  renderOrganization();
  renderDashboard();
  renderHolidays();
  renderUsers();
  renderProjects();
  renderFinances();
  renderTodos();
  renderMeetings();
  renderSidebar();
  setActiveView("dashboard");
}

init().catch((error) => {
  const savedSession = getSessionUser();
  if (savedSession) {
    state.authUser = savedSession;
    renderSessionIdentity();
  }
  renderOrganization();
  renderMetricGrid(buildMetricFallback(error.message));
  renderHolidays();
  upcomingTaskTitle.textContent = "Unable to load workspace";
  upcomingTaskMeta.textContent = error.message;
  upcomingMeetingTitle.textContent = "Unable to load meetings";
  upcomingMeetingMeta.textContent = "Please refresh or restart the app.";
  upcomingMeetingCountdown.textContent = "No upcoming data";
  upcomingMeetingCountdownMeta.textContent = "Backend connection failed.";
});
