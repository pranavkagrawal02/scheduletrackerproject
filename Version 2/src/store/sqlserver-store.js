const sql = require("mssql");

function normalizeText(value) {
  return String(value || "").trim();
}

function splitName(name) {
  const parts = normalizeText(name).split(/\s+/).filter(Boolean);
  return {
    first: parts[0] || "User",
    last: parts.length > 1 ? parts.slice(1).join(" ") : null
  };
}

function slugify(value) {
  return normalizeText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 20) || "user";
}

function buildFullName(firstName, lastName) {
  return [normalizeText(firstName), normalizeText(lastName)].filter(Boolean).join(" ").trim();
}

function mapUiUserType(type) {
  const normalized = normalizeText(type).toLowerCase();
  if (normalized === "individual" || normalized === "single user") return "Single User";
  if (normalized === "team" || normalized === "multi user") return "Multi User";
  if (normalized === "corporate") return "Corporate";
  if (normalized === "government") return "Government";
  return "Single User";
}

function pickDefaultScheduleType(type) {
  const normalized = normalizeText(type).toLowerCase();
  if (normalized === "corporate" || normalized === "government") return "Monthly";
  if (normalized === "team" || normalized === "multi user") return "Weekly";
  return "Daily";
}

function toDashboardRange(scheduleType) {
  const normalized = normalizeText(scheduleType).toLowerCase();
  if (normalized === "daily") return "daily";
  if (normalized === "monthly") return "monthly";
  return "weekly";
}

function formatMeetingMeta(row) {
  const meta = [];
  if (row.meetingDate instanceof Date) {
    meta.push(row.meetingDate.toISOString().slice(0, 10));
  } else if (row.meetingDate) {
    meta.push(String(row.meetingDate));
  }
  if (row.startTime) meta.push(String(row.startTime).slice(0, 5));
  if (row.meetingLink) meta.push(row.meetingLink);
  return meta.join(" | ");
}

const SCHEDULE_META_PREFIX = "SCHEDULE_META:";
const HOLIDAY_SUMMARY_PREFIX = "HOLIDAY_SUMMARY:";
const AUTO_HOLIDAY_LABELS = new Set(["cl", "cl holiday", "pl", "pl holiday", "unpaid", "unpaid holiday"]);

function safeJsonParse(value) {
  try {
    return JSON.parse(String(value || ""));
  } catch {
    return null;
  }
}

function encodeTaggedJson(prefix, payload) {
  return `${prefix}${JSON.stringify(payload)}`;
}

function decodeTaggedJson(prefix, value) {
  const text = String(value || "");
  if (!text.startsWith(prefix)) {
    return null;
  }
  return safeJsonParse(text.slice(prefix.length));
}

function isDerivedHolidayName(name) {
  return AUTO_HOLIDAY_LABELS.has(normalizeText(name).toLowerCase());
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

function formatCalendarMeetingMeta(row) {
  const meta = [];
  const date = formatLocalDate(row.startDateTime);
  const start = formatLocalTime(row.startDateTime);
  const end = formatLocalTime(row.endDateTime);
  if (date) meta.push(date);
  if (start && end && start !== end) meta.push(`${start} - ${end}`);
  else if (start) meta.push(start);
  return meta.join(" | ");
}

function buildIsoFromDateAndTime(dateValue, timeValue) {
  const date = formatLocalDate(dateValue);
  const time = formatLocalTime(timeValue);
  return date && time ? `${date}T${time}:00` : null;
}

function mapCalendarMeetingRow(row) {
  const startsAt = coerceDate(row.startDateTime);
  const endsAt = coerceDate(row.endDateTime || row.startDateTime);
  return {
    id: Number(row.calendarId),
    title: row.title,
    meta: formatCalendarMeetingMeta(row),
    notes: row.description || "",
    summary: row.meetingSummary || "",
    location: row.meetingLocation || "",
    link: row.meetingLink || "",
    date: formatLocalDate(startsAt),
    startTime: formatLocalTime(startsAt),
    endTime: formatLocalTime(endsAt),
    startsAt: startsAt ? startsAt.toISOString() : null,
    endsAt: endsAt ? endsAt.toISOString() : null
  };
}

function mapLegacyMeetingRow(row) {
  const startsAt = buildIsoFromDateAndTime(row.meetingDate, row.startTime);
  const endsAt = buildIsoFromDateAndTime(row.meetingDate, row.endTime || row.startTime);
  return {
    id: Number(row.meetingId),
    title: row.meetingTitle,
    meta: formatMeetingMeta(row),
    notes: row.meetingDescription || "",
    summary: row.meetingSummary || "",
    location: row.meetingLocation || "",
    link: row.meetingLink || "",
    date: formatLocalDate(row.meetingDate),
    startTime: formatLocalTime(row.startTime),
    endTime: formatLocalTime(row.endTime),
    startsAt,
    endsAt
  };
}

function formatMonthName(value) {
  const date = coerceDate(value);
  return date ? date.toLocaleDateString("en-US", { month: "long" }) : "";
}

function formatDayName(value) {
  const date = coerceDate(value);
  return date ? date.toLocaleDateString("en-US", { weekday: "long" }) : "";
}

function inferRangeFromEntryType(entryType) {
  const normalized = normalizeText(entryType).toLowerCase();
  if (normalized === "daily") return "daily";
  if (normalized === "monthly") return "monthly";
  return "weekly";
}

function weekdayLabel(date) {
  const labels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const resolved = coerceDate(date);
  return resolved ? labels[resolved.getDay()] : "Mon";
}

function monthWeekLabel(date) {
  const resolved = coerceDate(date);
  if (!resolved) return "Week 1";
  return `Week ${Math.floor((resolved.getDate() - 1) / 7) + 1}`;
}

function inferScheduleDay(date, range) {
  return normalizeText(range) === "monthly" ? monthWeekLabel(date) : weekdayLabel(date);
}

function buildScheduleMetadata(payload) {
  return encodeTaggedJson(SCHEDULE_META_PREFIX, {
    range: normalizeText(payload.range).toLowerCase() || "weekly",
    day: normalizeText(payload.day),
    note: normalizeText(payload.note),
    color: normalizeText(payload.color) || "#2563eb"
  });
}

function parseScheduleMetadata(description) {
  const metadata = decodeTaggedJson(SCHEDULE_META_PREFIX, description);
  if (metadata) {
    return {
      range: normalizeText(metadata.range).toLowerCase() || "weekly",
      day: normalizeText(metadata.day),
      note: normalizeText(metadata.note),
      color: normalizeText(metadata.color) || "#2563eb"
    };
  }
  return null;
}

function buildHolidaySummaryMetadata(payload) {
  return encodeTaggedJson(HOLIDAY_SUMMARY_PREFIX, {
    used: Number(payload.used || 0),
    total: Number(payload.total || 0)
  });
}

function parseHolidaySummaryMetadata(description) {
  const metadata = decodeTaggedJson(HOLIDAY_SUMMARY_PREFIX, description);
  if (!metadata) return null;
  return {
    used: Number(metadata.used || 0),
    total: Number(metadata.total || 0)
  };
}

function buildScheduleDate(range, day) {
  const normalizedRange = normalizeText(range).toLowerCase();
  const normalizedDay = normalizeText(day).toLowerCase();
  const now = new Date();
  const next = new Date(now);
  next.setHours(9, 0, 0, 0);

  if (normalizedRange === "monthly") {
    const weekMatch = normalizedDay.match(/week\s*(\d+)/i);
    const weekNo = Math.max(1, Number(weekMatch?.[1] || 1));
    next.setDate(1);
    next.setDate(Math.min(1 + ((weekNo - 1) * 7), 28));
    return next;
  }

  const weekdayMap = {
    sun: 0,
    sunday: 0,
    mon: 1,
    monday: 1,
    tue: 2,
    tuesday: 2,
    wed: 3,
    wednesday: 3,
    thu: 4,
    thursday: 4,
    fri: 5,
    friday: 5,
    sat: 6,
    saturday: 6
  };
  const targetDay = weekdayMap[normalizedDay];
  if (targetDay === undefined) {
    return next;
  }
  const offset = (targetDay - next.getDay() + 7) % 7;
  next.setDate(next.getDate() + offset);
  return next;
}

function normalizeHolidayDate(value) {
  const date = coerceDate(value);
  if (!date) return null;
  date.setHours(0, 0, 0, 0);
  return date;
}

function formatProjectDateTime(value) {
  const date = coerceDate(value);
  if (!date) return null;
  return `${formatLocalDate(date)} ${formatLocalTime(date) || "00:00"}`;
}

function coerceProjectDateTime(value) {
  const text = normalizeText(value);
  if (!text) return null;
  const normalized = text.length === 10 ? `${text}T00:00:00` : text.replace(" ", "T");
  return coerceDate(normalized);
}

function createSqlServerStore() {
  const rawServer = String(process.env.SQL_SERVER || "").trim();
  const serverParts = rawServer.split("\\");
  const serverName = serverParts[0] || rawServer;
  const instanceName = serverParts[1] || undefined;

  const config = {
    server: serverName,
    database: process.env.SQL_DATABASE,
    user: process.env.SQL_USER || undefined,
    password: process.env.SQL_PASSWORD || undefined,
    options: {
      encrypt: String(process.env.SQL_ENCRYPT || "false") === "true",
      trustServerCertificate: String(process.env.SQL_TRUST_SERVER_CERT || "true") === "true",
      instanceName
    }
  };

  if (!instanceName) {
    config.port = Number(process.env.SQL_PORT || 1433);
  }

  if (!config.user) {
    delete config.user;
    delete config.password;
  }

  let poolPromise;
  const tableExistsCache = new Map();
  const columnExistsCache = new Map();

  function getPool() {
    if (!poolPromise) {
      poolPromise = sql.connect(config);
    }
    return poolPromise;
  }

  async function tableExists(tableName) {
    if (tableExistsCache.has(tableName)) {
      return tableExistsCache.get(tableName);
    }

    const pool = await getPool();
    const result = await pool.request()
      .input("table_name", sql.NVarChar(128), tableName)
      .query("SELECT CASE WHEN OBJECT_ID(N'dbo.' + @table_name, N'U') IS NULL THEN 0 ELSE 1 END AS exists_flag");

    const exists = Boolean(result.recordset[0]?.exists_flag);
    tableExistsCache.set(tableName, exists);
    return exists;
  }

  async function columnExists(tableName, columnName) {
    const cacheKey = `${tableName}:${columnName}`;
    if (columnExistsCache.has(cacheKey)) {
      return columnExistsCache.get(cacheKey);
    }

    const pool = await getPool();
    const result = await pool.request()
      .input("table_name", sql.NVarChar(128), tableName)
      .input("column_name", sql.NVarChar(128), columnName)
      .query(`
        SELECT CASE
          WHEN COL_LENGTH(N'dbo.' + @table_name, @column_name) IS NULL THEN 0
          ELSE 1
        END AS exists_flag
      `);

    const exists = Boolean(result.recordset[0]?.exists_flag);
    columnExistsCache.set(cacheKey, exists);
    return exists;
  }

  async function hasUnifiedEmployeeCalendar() {
    return await tableExists("employeeCalendar") && await columnExists("employeeCalendar", "entryCategory");
  }

  async function getMeetingFieldSupport() {
    return {
      location: await columnExists("employeeCalendar", "meetingLocation"),
      link: await columnExists("employeeCalendar", "meetingLink"),
      summary: await columnExists("employeeCalendar", "meetingSummary")
    };
  }

  async function getActorEmpId(actor) {
    const suppliedId = Number(actor?.employeeCode || actor?.employeeId || 0);
    if (suppliedId > 0) {
      return suppliedId;
    }

    const username = normalizeText(actor?.username);
    if (!username) {
      return null;
    }

    const pool = await getPool();
    const result = await pool.request()
      .input("username", sql.NVarChar(150), username)
      .query(`
        SELECT TOP 1 EmpID
        FROM dbo.users
        WHERE EmpUsername = @username
           OR EmpEmail = @username
      `);

    return Number(result.recordset[0]?.EmpID || 0) || null;
  }

  async function getFirstEmpId() {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT TOP 1 EmpID
      FROM dbo.users
      ORDER BY EmpID
    `);
    return Number(result.recordset[0]?.EmpID || 0) || null;
  }

  async function getEffectiveEmpId(actor) {
    return (await getActorEmpId(actor)) || (await getFirstEmpId());
  }

  async function getLookupId(tableName, idColumn, valueColumn, value) {
    const pool = await getPool();
    const result = await pool.request()
      .input("value", sql.NVarChar(100), value)
      .query(`
        SELECT TOP 1 ${idColumn} AS id
        FROM dbo.${tableName}
        WHERE ${valueColumn} = @value
      `);

    return Number(result.recordset[0]?.id || 0) || null;
  }

  async function getNextEmpId() {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT ISNULL(MAX(EmpID), 0) + 1 AS next_id
      FROM dbo.users
    `);
    return Number(result.recordset[0]?.next_id || 1);
  }

  async function getUserNameById(empId) {
    const pool = await getPool();
    const result = await pool.request()
      .input("EmpID", sql.Int, empId)
      .query(`
        SELECT TOP 1 EmpFullName
        FROM dbo.users
        WHERE EmpID = @EmpID
      `);

    return result.recordset[0]?.EmpFullName || null;
  }

  async function getCalendarSchedules(actorEmpId) {
    const pool = await getPool();
    const request = pool.request();
    let query = `
      SELECT
        calendarId,
        EmpID,
        entryCategory,
        entryType,
        title,
        description,
        startDateTime,
        endDateTime
      FROM dbo.employeeCalendar
      WHERE (
        referenceTable = N'employeeCalendar:schedule'
        OR entryCategory IN (N'PROJECT', N'DEADLINE', N'TASK')
      )
    `;
    if (actorEmpId) {
      request.input("EmpID", sql.Int, actorEmpId);
      query += ` AND EmpID = @EmpID`;
    }
    query += ` ORDER BY calendarId DESC`;

    const result = await request.query(query);
    return result.recordset.map((row) => {
      const metadata = parseScheduleMetadata(row.description) || {};
      const range = metadata.range || inferRangeFromEntryType(row.entryType);
      return {
        id: Number(row.calendarId),
        range,
        day: metadata.day || inferScheduleDay(row.startDateTime, range),
        scheduleDate: formatLocalDate(row.startDateTime),
        title: row.title,
        note: metadata.note || normalizeText(row.description),
        color: metadata.color || "#2563eb"
      };
    });
  }

  async function getCalendarMeetings(actorEmpId) {
    const pool = await getPool();
    const meetingFields = await getMeetingFieldSupport();
    const request = pool.request();
    let query = `
      SELECT
        calendarId,
        EmpID,
        title,
        description,
        startDateTime,
        endDateTime,
        ${meetingFields.location ? "meetingLocation" : "CAST(NULL AS NVARCHAR(300)) AS meetingLocation"},
        ${meetingFields.link ? "meetingLink" : "CAST(NULL AS NVARCHAR(500)) AS meetingLink"},
        ${meetingFields.summary ? "meetingSummary" : "CAST(NULL AS NVARCHAR(MAX)) AS meetingSummary"}
      FROM dbo.employeeCalendar
      WHERE entryCategory = N'MEETING'
    `;
    if (actorEmpId) {
      request.input("EmpID", sql.Int, actorEmpId);
      query += ` AND EmpID = @EmpID`;
    }
    query += ` ORDER BY startDateTime ASC, calendarId DESC`;

    const result = await request.query(query);
    return result.recordset.map(mapCalendarMeetingRow);
  }

  async function getCalendarLeaveEvents(actorEmpId) {
    const pool = await getPool();
    const request = pool.request();
    let query = `
      SELECT
        calendarId,
        EmpID,
        entryType,
        title,
        startDateTime,
        endDateTime,
        leaveDays,
        entryStatus
      FROM dbo.employeeCalendar
      WHERE entryCategory = N'LEAVE'
        AND entryType IN (N'CL', N'PL', N'UNPAID')
        AND entryStatus = N'APPROVED'
    `;
    if (actorEmpId) {
      request.input("EmpID", sql.Int, actorEmpId);
      query += ` AND EmpID = @EmpID`;
    }
    query += ` ORDER BY startDateTime ASC, calendarId ASC`;

    const result = await request.query(query);
    return result.recordset.map((row) => ({
      id: Number(row.calendarId),
      empId: Number(row.EmpID),
      type: row.entryType,
      title: row.title,
      startDate: formatLocalDate(row.startDateTime),
      endDate: formatLocalDate(row.endDateTime || row.startDateTime),
      leaveDays: Number(row.leaveDays || 0),
      status: row.entryStatus
    }));
  }

  async function getCalendarHolidaySummaries(actorEmpId) {
    const pool = await getPool();
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();
    const holidays = [];

    const ledgerProcedureResult = await pool.request()
      .input("procedure_name", sql.NVarChar(128), "usp_EmployeeCalendarLeaveLedger")
      .query(`
        SELECT CASE
          WHEN OBJECT_ID(N'dbo.' + @procedure_name, N'P') IS NULL THEN 0
          ELSE 1
        END AS exists_flag
      `);

    if (ledgerProcedureResult.recordset[0]?.exists_flag) {
      const ledgerRequest = pool.request()
        .input("CalendarYear", sql.Int, currentYear);
      if (actorEmpId) {
        ledgerRequest.input("EmpID", sql.Int, actorEmpId);
      } else {
        ledgerRequest.input("EmpID", sql.Int, null);
      }

      const ledgerResult = await ledgerRequest.query(`
        EXEC dbo.usp_EmployeeCalendarLeaveLedger
          @EmpID = @EmpID,
          @CalendarYear = @CalendarYear
      `);

      const monthRow = ledgerResult.recordset.find((row) => Number(row.CalendarMonth) === currentMonth);
      if (monthRow) {
        holidays.push(
          {
            id: -101,
            name: "CL Holiday",
            used: Number(monthRow.UsedCL || 0),
            total: Number(monthRow.OpeningCL || 0) + Number(monthRow.CreditedCL || 0),
            editable: false
          },
          {
            id: -102,
            name: "PL Holiday",
            used: Number(monthRow.UsedPL || 0),
            total: Number(monthRow.AvailablePLBeforeUse || 0),
            editable: false
          },
          {
            id: -103,
            name: "Unpaid Holiday",
            used: Number(monthRow.UnpaidUsed || 0),
            total: Number(monthRow.UnpaidUsed || 0),
            editable: false
          }
        );
      }
    }

    if (!holidays.length) {
      holidays.push(
        { id: -101, name: "CL Holiday", used: 0, total: 1, editable: false },
        { id: -102, name: "PL Holiday", used: 0, total: 5, editable: false },
        { id: -103, name: "Unpaid Holiday", used: 0, total: 0, editable: false }
      );
    }

    const customRequest = pool.request();
    let customQuery = `
      SELECT
        calendarId,
        EmpID,
        title,
        description
      FROM dbo.employeeCalendar
      WHERE entryCategory = N'HOLIDAY'
        AND entryType = N'SUMMARY'
    `;
    if (actorEmpId) {
      customRequest.input("EmpID", sql.Int, actorEmpId);
      customQuery += ` AND EmpID = @EmpID`;
    }
    customQuery += ` ORDER BY calendarId DESC`;

    const customResult = await customRequest.query(customQuery);
    for (const row of customResult.recordset) {
      const metadata = parseHolidaySummaryMetadata(row.description);
      if (!metadata || isDerivedHolidayName(row.title)) {
        continue;
      }
      holidays.push({
        id: Number(row.calendarId),
        name: row.title,
        used: Number(metadata.used || 0),
        total: Number(metadata.total || 0),
        editable: true
      });
    }

    return holidays;
  }

  async function getCalendarPublicHolidays() {
    const pool = await getPool();
    const currentYear = new Date().getFullYear();
    const result = await pool.request()
      .input("currentYear", sql.Int, currentYear)
      .query(`
        SELECT
          calendarId,
          EmpID,
          title,
          description,
          startDateTime
        FROM dbo.employeeCalendar
        WHERE entryCategory = N'HOLIDAY'
          AND entryType = N'PUBLIC_HOLIDAY'
          AND YEAR(startDateTime) = @currentYear
        ORDER BY startDateTime ASC, calendarId ASC
      `);

    return result.recordset.map((row) => ({
      id: Number(row.calendarId),
      empId: Number(row.EmpID),
      name: row.title,
      holidayDate: formatLocalDate(row.startDateTime),
      year: coerceDate(row.startDateTime)?.getFullYear() || currentYear,
      month: formatMonthName(row.startDateTime),
      date: coerceDate(row.startDateTime)?.getDate() || 0,
      day: formatDayName(row.startDateTime),
      description: row.description || ""
    }));
  }

  async function getBootstrap(actor) {
    const pool = await getPool();
    const actorEmpId = await getActorEmpId(actor);
    const useUnifiedCalendar = await hasUnifiedEmployeeCalendar();

    const usersResult = await pool.request().query(`
      SELECT
        EmpID,
        EmpFullName,
        EmpDesignation,
        EmpDept,
        EmpUserTypeID,
        EmpScheduleTypeID,
        EmpUsername,
        EmpEmail,
        EmpReportingManagerID
      FROM dbo.users
      ORDER BY EmpID
    `);

    const userTypeMap = new Map();
    if (await tableExists("userType")) {
      const result = await pool.request().query(`SELECT userTypeId, userType FROM dbo.userType`);
      for (const row of result.recordset) {
        userTypeMap.set(Number(row.userTypeId), row.userType);
      }
    }

    const scheduleTypeMap = new Map();
    if (await tableExists("scheduleType")) {
      const result = await pool.request().query(`SELECT scheduleTypeId, scheduleType FROM dbo.scheduleType`);
      for (const row of result.recordset) {
        scheduleTypeMap.set(Number(row.scheduleTypeId), row.scheduleType);
      }
    }

    const users = usersResult.recordset.map((row) => ({
      id: Number(row.EmpID),
      name: row.EmpFullName || row.EmpUsername || `User ${row.EmpID}`,
      role: row.EmpDesignation || "Employee",
      type: userTypeMap.get(Number(row.EmpUserTypeID)) || row.EmpDept || "User",
      username: row.EmpUsername,
      email: row.EmpEmail || "",
      department: row.EmpDept || "",
      managerId: row.EmpReportingManagerID == null ? null : Number(row.EmpReportingManagerID),
      scheduleType: scheduleTypeMap.get(Number(row.EmpScheduleTypeID)) || ""
    }));

    let projects = [];
    let projectUpdates = [];
    if (await tableExists("employeeProject")) {
      const hasProjectStatusRemark = await columnExists("employeeProject", "projectStatusRemark");
      const hasProjectStatusUpdatedAt = await columnExists("employeeProject", "projectStatusUpdatedAt");
      const hasProjectPriority = await columnExists("employeeProject", "projectPriority");
      const hasDeadlineDate = await columnExists("employeeProject", "endDate");
      const hasProjectBudget = await columnExists("employeeProject", "projectBudget");
      const hasProjectSpentAmount = await columnExists("employeeProject", "projectSpentAmount");
      const hasProjectPendingAmount = await columnExists("employeeProject", "projectPendingAmount");
      const hasProjectRemainingAmount = await columnExists("employeeProject", "projectRemainingAmount");
      const hasProjectFinanceRemark = await columnExists("employeeProject", "projectFinanceRemark");
      const hasProjectFinanceUpdatedAt = await columnExists("employeeProject", "projectFinanceUpdatedAt");
      const request = pool.request();
      let query = `
        SELECT
          projectId,
          EmpID,
          projectName,
          projectStatus,
          ${hasProjectPriority ? "projectPriority" : "N'Medium' AS projectPriority"},
          ${hasProjectStatusRemark ? "projectStatusRemark" : "CAST(NULL AS NVARCHAR(1000)) AS projectStatusRemark"},
          ${hasProjectStatusUpdatedAt ? "projectStatusUpdatedAt" : "CAST(NULL AS DATETIME2) AS projectStatusUpdatedAt"},
          ${hasProjectBudget ? "projectBudget" : "CAST(0 AS DECIMAL(18,2)) AS projectBudget"},
          ${hasProjectSpentAmount ? "projectSpentAmount" : "CAST(0 AS DECIMAL(18,2)) AS projectSpentAmount"},
          ${hasProjectPendingAmount ? "projectPendingAmount" : "CAST(0 AS DECIMAL(18,2)) AS projectPendingAmount"},
          ${hasProjectRemainingAmount ? "projectRemainingAmount" : "CAST(0 AS DECIMAL(18,2)) AS projectRemainingAmount"},
          ${hasProjectFinanceRemark ? "projectFinanceRemark" : "CAST(NULL AS NVARCHAR(1000)) AS projectFinanceRemark"},
          ${hasProjectFinanceUpdatedAt ? "projectFinanceUpdatedAt" : "CAST(NULL AS DATETIME2) AS projectFinanceUpdatedAt"},
          ${hasDeadlineDate ? "endDate" : "CAST(NULL AS DATE) AS endDate"}
        FROM dbo.employeeProject
      `;
      if (actorEmpId) {
        request.input("EmpID", sql.Int, actorEmpId);
        query += ` WHERE EmpID = @EmpID`;
      }
      query += ` ORDER BY projectId DESC`;
      const result = await request.query(query);
      projects = result.recordset.map((row) => ({
        id: Number(row.projectId),
        name: row.projectName,
        ownerId: Number(row.EmpID),
        status: row.projectStatus || "Planned",
        priority: row.projectPriority || "Medium",
        statusRemark: row.projectStatusRemark || "",
        statusUpdatedAt: formatProjectDateTime(row.projectStatusUpdatedAt),
        budget: Number(row.projectBudget || 0),
        spentAmount: Number(row.projectSpentAmount || 0),
        pendingAmount: Number(row.projectPendingAmount || 0),
        remainingAmount: Number(row.projectRemainingAmount || 0),
        financeRemark: row.projectFinanceRemark || "",
        financeUpdatedAt: formatProjectDateTime(row.projectFinanceUpdatedAt),
        deadlineDate: formatLocalDate(row.endDate)
      }));

      if (await tableExists("employeeProjectUpdateHistory")) {
        const hasHistoryPriority = await columnExists("employeeProjectUpdateHistory", "projectPriority");
        const updateRequest = pool.request();
        let updateQuery = `
          SELECT
            projectUpdateId,
            projectId,
            EmpID,
            projectStatus,
            ${hasHistoryPriority ? "projectPriority," : ""}
            projectStatusRemark,
            projectStatusUpdatedAt,
            projectBudget,
            projectSpentAmount,
            projectPendingAmount,
            projectRemainingAmount,
            projectFinanceRemark,
            projectFinanceUpdatedAt,
            createdAt
          FROM dbo.employeeProjectUpdateHistory
        `;
        if (actorEmpId) {
          updateRequest.input("EmpID", sql.Int, actorEmpId);
          updateQuery += ` WHERE EmpID = @EmpID`;
        }
        updateQuery += ` ORDER BY projectStatusUpdatedAt DESC, projectUpdateId DESC`;
        const updateResult = await updateRequest.query(updateQuery);
        projectUpdates = updateResult.recordset.map((row) => ({
          id: Number(row.projectUpdateId),
          projectId: Number(row.projectId),
          ownerId: Number(row.EmpID || 0) || null,
          status: row.projectStatus || "Planned",
          priority: row.projectPriority || "Medium",
          statusRemark: row.projectStatusRemark || "",
          statusUpdatedAt: formatProjectDateTime(row.projectStatusUpdatedAt),
          budget: Number(row.projectBudget || 0),
          spentAmount: Number(row.projectSpentAmount || 0),
          pendingAmount: Number(row.projectPendingAmount || 0),
          remainingAmount: Number(row.projectRemainingAmount || 0),
          financeRemark: row.projectFinanceRemark || "",
          financeUpdatedAt: formatProjectDateTime(row.projectFinanceUpdatedAt),
          createdAt: formatProjectDateTime(row.createdAt)
        }));
      }
    }

    let schedules = [];
    if (await tableExists("employeeSchedule")) {
      const request = pool.request();
      let query = `
        SELECT
          s.scheduleId,
          s.EmpID,
          s.scheduleTitle,
          s.scheduleNote,
          s.scheduleDay,
          s.startTime,
          s.endTime,
          st.scheduleType
        FROM dbo.employeeSchedule s
        LEFT JOIN dbo.scheduleType st ON s.scheduleTypeId = st.scheduleTypeId
      `;
      if (actorEmpId) {
        request.input("EmpID", sql.Int, actorEmpId);
        query += ` WHERE s.EmpID = @EmpID`;
      }
      query += ` ORDER BY s.scheduleId DESC`;
      const result = await request.query(query);
      schedules = result.recordset.map((row) => ({
        id: Number(row.scheduleId),
        range: "daily",
        day: row.scheduleDay || "",
        scheduleDate: /^\d{4}-\d{2}-\d{2}$/.test(String(row.scheduleDay || "")) ? String(row.scheduleDay) : "",
        title: row.scheduleTitle,
        note: row.scheduleNote || [String(row.startTime || "").slice(0, 5), String(row.endTime || "").slice(0, 5)].filter(Boolean).join(" - "),
        color: "#2563eb"
      }));
    } else if (useUnifiedCalendar) {
      schedules = await getCalendarSchedules(actorEmpId);
    }

    let meetings = [];
    if (useUnifiedCalendar) {
      meetings = await getCalendarMeetings(actorEmpId);
    } else if (await tableExists("employeeMeeting")) {
      const request = pool.request();
      let query = `
        SELECT
          meetingId,
          EmpID,
          meetingTitle,
          meetingDescription,
          meetingDate,
          startTime,
          endTime,
          meetingLink
        FROM dbo.employeeMeeting
      `;
      if (actorEmpId) {
        request.input("EmpID", sql.Int, actorEmpId);
        query += ` WHERE EmpID = @EmpID`;
      }
      query += ` ORDER BY meetingId DESC`;
      const result = await request.query(query);
      meetings = result.recordset.map(mapLegacyMeetingRow);
    }

    let holidays = [];
    if (useUnifiedCalendar) {
      holidays = await getCalendarHolidaySummaries(actorEmpId);
    } else if (await tableExists("CL_Holiday") && await tableExists("PL_Holiday") && await tableExists("Unpaid_Holiday")) {
      const currentYear = new Date().getFullYear();
      const request = pool.request().input("holiday_year", sql.Int, currentYear);
      let filter = "";
      if (actorEmpId) {
        request.input("EmpID", sql.Int, actorEmpId);
        filter = ` AND employee_code = CONCAT(N'EMP', RIGHT(CONCAT(N'000', CAST(@EmpID AS NVARCHAR(10))), 3))`;
      }
      const result = await request.query(`
        SELECT N'CL' AS holiday_name, 1 AS holiday_id,
               SUM(CASE WHEN holiday_status = 0 THEN 1 ELSE 0 END) AS used_total,
               COUNT(*) AS total_count
        FROM dbo.CL_Holiday
        WHERE holiday_year = @holiday_year${filter}
        UNION ALL
        SELECT N'PL', 2,
               SUM(CASE WHEN holiday_status = 0 THEN 1 ELSE 0 END),
               COUNT(*)
        FROM dbo.PL_Holiday
        WHERE holiday_year = @holiday_year${filter}
        UNION ALL
        SELECT N'Unpaid', 3,
               SUM(CASE WHEN holiday_status = 0 THEN 1 ELSE 0 END),
               COUNT(*)
        FROM dbo.Unpaid_Holiday
        WHERE holiday_year = @holiday_year${filter}
      `);
      holidays = result.recordset.map((row) => ({
        id: Number(row.holiday_id),
        name: row.holiday_name,
        used: Number(row.used_total || 0),
        total: Number(row.total_count || 0)
      }));
    }

    return {
      users,
      projects,
      projectUpdates,
      holidays,
      publicHolidays: useUnifiedCalendar ? await getCalendarPublicHolidays() : [],
      leaveEvents: useUnifiedCalendar ? await getCalendarLeaveEvents(actorEmpId) : [],
      todos: [],
      meetings,
      schedules,
      finances: []
    };
  }

  async function validateLogin(username, password) {
    const pool = await getPool();
    const result = await pool.request()
      .input("username", sql.NVarChar(150), normalizeText(username))
      .input("password", sql.NVarChar(255), String(password || ""))
      .query(`
        SELECT TOP 1
          EmpID,
          EmpUsername,
          EmpFullName,
          EmpDesignation
        FROM dbo.users
        WHERE (EmpUsername = @username OR EmpEmail = @username)
          AND EmpPassword = @password
      `);

    const user = result.recordset[0];
    if (!user) {
      const adminUser = process.env.DEMO_ADMIN_USERNAME || "admin";
      const adminPassword = process.env.DEMO_ADMIN_PASSWORD || "admin";
      if (username === adminUser && password === adminPassword) {
        return { username, role: "Administrator", employeeCode: null, name: "Administrator" };
      }
      return null;
    }

    return {
      username: user.EmpUsername,
      role: user.EmpDesignation || "User",
      employeeCode: String(user.EmpID),
      employeeId: Number(user.EmpID),
      name: user.EmpFullName || user.EmpUsername
    };
  }

  async function createUser(payload, actor) {
    const nextId = await getNextEmpId();
    const names = splitName(payload.name);
    const username = `${slugify(payload.name)}${nextId}`;
    const userTypeName = mapUiUserType(payload.type);
    const scheduleTypeName = pickDefaultScheduleType(payload.type);
    const fullName = buildFullName(names.first, names.last);
    const actorEmpId = await getActorEmpId(actor);
    const actorName = actorEmpId ? await getUserNameById(actorEmpId) : null;
    const userTypeId = await getLookupId("userType", "userTypeId", "userType", userTypeName);
    const scheduleTypeId = await getLookupId("scheduleType", "scheduleTypeId", "scheduleType", scheduleTypeName);
    const designationId = (await tableExists("designation"))
      ? await getLookupId("designation", "DesignationID", "DesignationName", payload.role)
      : null;

    const pool = await getPool();
    const result = await pool.request()
      .input("EmpCompany", sql.NVarChar(150), "Schedule Tracker")
      .input("EmpDesignation", sql.NVarChar(100), payload.role)
      .input("EmpDesignationID", sql.Int, designationId)
      .input("EmpFirstName", sql.NVarChar(100), names.first)
      .input("EmpLastName", sql.NVarChar(100), names.last)
      .input("EmpFullName", sql.NVarChar(250), fullName)
      .input("EmpUserTypeID", sql.Int, userTypeId)
      .input("EmpScheduleTypeID", sql.Int, scheduleTypeId)
      .input("EmpUsername", sql.NVarChar(50), username)
      .input("EmpPassword", sql.NVarChar(255), username)
      .input("EmpDept", sql.NVarChar(100), null)
      .input("EmpDeptID", sql.Int, null)
      .input("EmpReportingManager", sql.NVarChar(250), actorName)
      .input("EmpReportingManagerID", sql.Int, actorEmpId)
      .input("EmpEmail", sql.NVarChar(150), `${username}@example.com`)
      .query(`
        INSERT INTO dbo.users (
          EmpCompany,
          EmpDesignation,
          EmpDesignationID,
          EmpFirstName,
          EmpLastName,
          EmpFullName,
          EmpUserTypeID,
          EmpScheduleTypeID,
          EmpUsername,
          EmpPassword,
          EmpDept,
          EmpDeptID,
          EmpReportingManager,
          EmpReportingManagerID,
          EmpEmail
        )
        OUTPUT inserted.EmpID
        VALUES (
          @EmpCompany,
          @EmpDesignation,
          @EmpDesignationID,
          @EmpFirstName,
          @EmpLastName,
          @EmpFullName,
          @EmpUserTypeID,
          @EmpScheduleTypeID,
          @EmpUsername,
          @EmpPassword,
          @EmpDept,
          @EmpDeptID,
          @EmpReportingManager,
          @EmpReportingManagerID,
          @EmpEmail
        )
      `);

    return {
      id: Number(result.recordset[0].EmpID),
      name: fullName,
      role: payload.role,
      type: userTypeName,
      username
    };
  }

  async function createProject(payload, actor) {
    if (!(await tableExists("employeeProject"))) {
      throw new Error("employeeProject table is not available in the database.");
    }

    const ownerId = Number(payload.ownerId) || await getEffectiveEmpId(actor);
    const hasProjectPriority = await columnExists("employeeProject", "projectPriority");
    const pool = await getPool();
    const request = pool.request()
      .input("EmpID", sql.Int, ownerId)
      .input("projectName", sql.NVarChar(200), payload.name)
      .input("projectDescription", sql.NVarChar(500), `${payload.status} project`)
      .input("projectStatus", sql.NVarChar(50), payload.status);
    if (hasProjectPriority) {
      request.input("projectPriority", sql.NVarChar(20), payload.priority || "Medium");
    }
    const result = await request.query(`
        INSERT INTO dbo.employeeProject (
          EmpID,
          projectName,
          projectDescription,
          projectStatus
          ${hasProjectPriority ? ", projectPriority" : ""}
        )
        OUTPUT inserted.projectId
        VALUES (
          @EmpID,
          @projectName,
          @projectDescription,
          @projectStatus
          ${hasProjectPriority ? ", @projectPriority" : ""}
        )
      `);

    return {
      id: Number(result.recordset[0].projectId),
      name: payload.name,
      ownerId,
      status: payload.status,
      priority: payload.priority || "Medium"
    };
  }

  async function updateProject(projectId, payload, actor) {
    if (!(await tableExists("employeeProject"))) {
      throw new Error("employeeProject table is not available in the database.");
    }

    const hasProjectStatusRemark = await columnExists("employeeProject", "projectStatusRemark");
    const hasProjectStatusUpdatedAt = await columnExists("employeeProject", "projectStatusUpdatedAt");
    const hasProjectPriority = await columnExists("employeeProject", "projectPriority");
    const hasProjectBudget = await columnExists("employeeProject", "projectBudget");
    const hasProjectSpentAmount = await columnExists("employeeProject", "projectSpentAmount");
    const hasProjectPendingAmount = await columnExists("employeeProject", "projectPendingAmount");
    const hasProjectRemainingAmount = await columnExists("employeeProject", "projectRemainingAmount");
    const hasProjectFinanceRemark = await columnExists("employeeProject", "projectFinanceRemark");
    const hasProjectFinanceUpdatedAt = await columnExists("employeeProject", "projectFinanceUpdatedAt");
    const hasDeadlineDate = await columnExists("employeeProject", "endDate");
    const hasHistoryTable = await tableExists("employeeProjectUpdateHistory");
    const hasHistoryPriority = hasHistoryTable ? await columnExists("employeeProjectUpdateHistory", "projectPriority") : false;
    const actorEmpId = await getEffectiveEmpId(actor);
    const pool = await getPool();

    const currentRequest = pool.request()
      .input("projectId", sql.Int, Number(projectId));
    let currentQuery = `
      SELECT
        projectId,
        EmpID,
        projectName,
        projectStatus,
        ${hasProjectPriority ? "projectPriority" : "N'Medium' AS projectPriority"},
        ${hasProjectStatusRemark ? "projectStatusRemark" : "CAST(NULL AS NVARCHAR(1000)) AS projectStatusRemark"},
        ${hasProjectStatusUpdatedAt ? "projectStatusUpdatedAt" : "CAST(NULL AS DATETIME2) AS projectStatusUpdatedAt"},
        ${hasProjectBudget ? "projectBudget" : "CAST(0 AS DECIMAL(18,2)) AS projectBudget"},
        ${hasProjectSpentAmount ? "projectSpentAmount" : "CAST(0 AS DECIMAL(18,2)) AS projectSpentAmount"},
        ${hasProjectPendingAmount ? "projectPendingAmount" : "CAST(0 AS DECIMAL(18,2)) AS projectPendingAmount"},
        ${hasProjectRemainingAmount ? "projectRemainingAmount" : "CAST(0 AS DECIMAL(18,2)) AS projectRemainingAmount"},
        ${hasProjectFinanceRemark ? "projectFinanceRemark" : "CAST(NULL AS NVARCHAR(1000)) AS projectFinanceRemark"},
        ${hasProjectFinanceUpdatedAt ? "projectFinanceUpdatedAt" : "CAST(NULL AS DATETIME2) AS projectFinanceUpdatedAt"},
        ${hasDeadlineDate ? "endDate" : "CAST(NULL AS DATE) AS endDate"}
      FROM dbo.employeeProject
      WHERE projectId = @projectId
    `;
    if (actorEmpId) {
      currentRequest.input("EmpID", sql.Int, actorEmpId);
      currentQuery += ` AND EmpID = @EmpID`;
    }
    const currentResult = await currentRequest.query(currentQuery);
    const current = currentResult.recordset[0];
    if (!current) {
      return null;
    }

    const nextBudget = payload.budget ?? Number(current.projectBudget || 0);
    const nextSpent = payload.spentAmount ?? (Number(current.projectSpentAmount || 0) + Number(payload.expenseDelta || 0));
    const nextPending = payload.pendingAmount ?? Number(current.projectPendingAmount || 0);
    const baseRemaining = payload.remainingAmount ?? Number(current.projectRemainingAmount || 0);
    const nextRemaining = payload.remainingAmount !== undefined
      ? Number(payload.remainingAmount)
      : (payload.savingsDelta !== undefined
        ? baseRemaining + Number(payload.savingsDelta || 0) - Number(payload.expenseDelta || 0)
        : nextBudget - nextSpent);
    const nextStatus = payload.status ?? current.projectStatus;
    const nextPriority = payload.priority ?? current.projectPriority ?? "Medium";
    const nextStatusRemark = payload.statusRemark ?? current.projectStatusRemark ?? null;
    const nextStatusUpdatedAt = coerceProjectDateTime(payload.statusUpdatedAt) || coerceDate(current.projectStatusUpdatedAt) || new Date();
    const nextFinanceRemark = payload.financeRemark ?? current.projectFinanceRemark ?? null;
    const nextFinanceUpdatedAt = coerceProjectDateTime(payload.financeUpdatedAt) || coerceDate(current.projectFinanceUpdatedAt) || new Date();
    const nextDeadlineDate = payload.deadlineDate ? formatLocalDate(payload.deadlineDate) : formatLocalDate(current.endDate);

    const setClauses = [];
    const updateRequest = pool.request()
      .input("projectId", sql.Int, Number(projectId));
    if (actorEmpId) {
      updateRequest.input("EmpID", sql.Int, actorEmpId);
    }
    updateRequest.input("projectStatus", sql.NVarChar(50), nextStatus);
    setClauses.push("projectStatus = @projectStatus");
    if (hasProjectPriority) {
      updateRequest.input("projectPriority", sql.NVarChar(20), nextPriority);
      setClauses.push("projectPriority = @projectPriority");
    }
    if (hasProjectStatusRemark) {
      updateRequest.input("projectStatusRemark", sql.NVarChar(1000), nextStatusRemark);
      setClauses.push("projectStatusRemark = @projectStatusRemark");
    }
    if (hasProjectStatusUpdatedAt) {
      updateRequest.input("projectStatusUpdatedAt", sql.DateTime2, nextStatusUpdatedAt);
      setClauses.push("projectStatusUpdatedAt = @projectStatusUpdatedAt");
    }
    if (hasProjectBudget) {
      updateRequest.input("projectBudget", sql.Decimal(18, 2), nextBudget);
      setClauses.push("projectBudget = @projectBudget");
    }
    if (hasProjectSpentAmount) {
      updateRequest.input("projectSpentAmount", sql.Decimal(18, 2), nextSpent);
      setClauses.push("projectSpentAmount = @projectSpentAmount");
    }
    if (hasProjectPendingAmount) {
      updateRequest.input("projectPendingAmount", sql.Decimal(18, 2), nextPending);
      setClauses.push("projectPendingAmount = @projectPendingAmount");
    }
    if (hasProjectRemainingAmount) {
      updateRequest.input("projectRemainingAmount", sql.Decimal(18, 2), nextRemaining);
      setClauses.push("projectRemainingAmount = @projectRemainingAmount");
    }
    if (hasProjectFinanceRemark) {
      updateRequest.input("projectFinanceRemark", sql.NVarChar(1000), nextFinanceRemark);
      setClauses.push("projectFinanceRemark = @projectFinanceRemark");
    }
    if (hasProjectFinanceUpdatedAt) {
      updateRequest.input("projectFinanceUpdatedAt", sql.DateTime2, nextFinanceUpdatedAt);
      setClauses.push("projectFinanceUpdatedAt = @projectFinanceUpdatedAt");
    }
    if (hasDeadlineDate && nextDeadlineDate) {
      updateRequest.input("endDate", sql.Date, nextDeadlineDate);
      setClauses.push("endDate = @endDate");
    }

    if (setClauses.length) {
      await updateRequest.query(`
        UPDATE dbo.employeeProject
        SET ${setClauses.join(", ")}
        WHERE projectId = @projectId
        ${actorEmpId ? "AND EmpID = @EmpID" : ""}
      `);
    }

    if (hasHistoryTable) {
      await pool.request()
        .input("projectId", sql.Int, Number(projectId))
        .input("EmpID", sql.Int, Number(current.EmpID))
        .input("projectStatus", sql.NVarChar(100), nextStatus)
        .input("projectPriority", sql.NVarChar(20), nextPriority)
        .input("projectStatusRemark", sql.NVarChar(1000), nextStatusRemark)
        .input("projectStatusUpdatedAt", sql.DateTime2, nextStatusUpdatedAt)
        .input("projectBudget", sql.Decimal(18, 2), nextBudget)
        .input("projectSpentAmount", sql.Decimal(18, 2), nextSpent)
        .input("projectPendingAmount", sql.Decimal(18, 2), nextPending)
        .input("projectRemainingAmount", sql.Decimal(18, 2), nextRemaining)
        .input("projectFinanceRemark", sql.NVarChar(1000), nextFinanceRemark)
        .input("projectFinanceUpdatedAt", sql.DateTime2, nextFinanceUpdatedAt)
        .query(`
          INSERT INTO dbo.employeeProjectUpdateHistory (
            projectId,
            EmpID,
            projectStatus,
            ${hasHistoryPriority ? "projectPriority," : ""}
            projectStatusRemark,
            projectStatusUpdatedAt,
            projectBudget,
            projectSpentAmount,
            projectPendingAmount,
            projectRemainingAmount,
            projectFinanceRemark,
            projectFinanceUpdatedAt
          )
          VALUES (
            @projectId,
            @EmpID,
            @projectStatus,
            ${hasHistoryPriority ? "@projectPriority," : ""}
            @projectStatusRemark,
            @projectStatusUpdatedAt,
            @projectBudget,
            @projectSpentAmount,
            @projectPendingAmount,
            @projectRemainingAmount,
            @projectFinanceRemark,
            @projectFinanceUpdatedAt
          )
        `);
    }

    const bootstrap = await getBootstrap(actor);
    return {
      project: bootstrap.projects.find((item) => Number(item.id) === Number(projectId)) || null,
      projectUpdates: bootstrap.projectUpdates.filter((item) => Number(item.projectId) === Number(projectId))
    };
  }

  async function deleteProject(projectId, actor) {
    if (!(await tableExists("employeeProject"))) {
      throw new Error("employeeProject table is not available in the database.");
    }

    const actorEmpId = await getEffectiveEmpId(actor);
    const pool = await getPool();
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      if (await tableExists("employeeProjectUpdateHistory")) {
        const historyRequest = new sql.Request(transaction).input("projectId", sql.Int, Number(projectId));
        if (actorEmpId) {
          historyRequest.input("EmpID", sql.Int, actorEmpId);
        }
        await historyRequest.query(`
          DELETE FROM dbo.employeeProjectUpdateHistory
          WHERE projectId = @projectId
          ${actorEmpId ? "AND EmpID = @EmpID" : ""}
        `);
      }

      const deleteRequest = new sql.Request(transaction).input("projectId", sql.Int, Number(projectId));
      if (actorEmpId) {
        deleteRequest.input("EmpID", sql.Int, actorEmpId);
      }
      const result = await deleteRequest.query(`
        DELETE FROM dbo.employeeProject
        OUTPUT deleted.projectId
        WHERE projectId = @projectId
        ${actorEmpId ? "AND EmpID = @EmpID" : ""}
      `);

      if (!result.recordset[0]) {
        await transaction.rollback();
        return false;
      }

      await transaction.commit();
      return true;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async function createSchedule(payload, actor) {
    const empId = await getEffectiveEmpId(actor);
    if (!empId) {
      throw new Error("No employee is available for schedule creation.");
    }

    if (!(await tableExists("employeeSchedule"))) {
      throw new Error("employeeSchedule table is not available in the database.");
    }

    const scheduleTypeId = await getLookupId("scheduleType", "scheduleTypeId", "scheduleType", "Daily");
    const scheduleDate = payload.scheduleDate || payload.day;
    const pool = await getPool();
    const result = await pool.request()
      .input("EmpID", sql.Int, empId)
      .input("scheduleTypeId", sql.Int, scheduleTypeId)
      .input("scheduleTitle", sql.NVarChar(200), payload.title)
      .input("scheduleNote", sql.NVarChar(500), payload.note)
      .input("scheduleDay", sql.NVarChar(20), scheduleDate)
      .query(`
        INSERT INTO dbo.employeeSchedule (
          EmpID,
          scheduleTypeId,
          scheduleTitle,
          scheduleNote,
          scheduleDay
        )
        OUTPUT inserted.scheduleId
        VALUES (
          @EmpID,
          @scheduleTypeId,
          @scheduleTitle,
          @scheduleNote,
          @scheduleDay
        )
      `);

    return {
      id: Number(result.recordset[0].scheduleId),
      range: "daily",
      day: scheduleDate,
      scheduleDate,
      title: payload.title,
      note: payload.note,
      color: payload.color
    };
  }

  async function updateSchedule(id, payload, actor) {
    const empId = await getActorEmpId(actor);
    if (!(await tableExists("employeeSchedule"))) {
      return null;
    }

    const scheduleTypeId = await getLookupId("scheduleType", "scheduleTypeId", "scheduleType", "Daily");
    const pool = await getPool();
    const request = pool.request()
      .input("scheduleId", sql.Int, Number(id))
      .input("scheduleTypeId", sql.Int, scheduleTypeId)
      .input("scheduleTitle", sql.NVarChar(200), payload.title ?? null)
      .input("scheduleNote", sql.NVarChar(500), payload.note ?? null)
      .input("scheduleDay", sql.NVarChar(20), payload.scheduleDate ?? payload.day ?? null);
    if (empId) {
      request.input("EmpID", sql.Int, empId);
    }

    const result = await request.query(`
      UPDATE dbo.employeeSchedule
      SET
        scheduleTypeId = COALESCE(@scheduleTypeId, scheduleTypeId),
        scheduleTitle = COALESCE(@scheduleTitle, scheduleTitle),
        scheduleNote = COALESCE(@scheduleNote, scheduleNote),
        scheduleDay = COALESCE(@scheduleDay, scheduleDay)
      OUTPUT inserted.scheduleId, inserted.scheduleTitle, inserted.scheduleNote, inserted.scheduleDay
      WHERE scheduleId = @scheduleId
        ${empId ? "AND EmpID = @EmpID" : ""}
    `);

    const row = result.recordset[0];
    if (!row) {
      return null;
    }

    return {
      id: Number(row.scheduleId),
      range: "daily",
      day: row.scheduleDay || "",
      scheduleDate: row.scheduleDay || "",
      title: row.scheduleTitle,
      note: row.scheduleNote || "",
      color: payload.color || "#2563eb"
    };
  }

  async function deleteSchedule(id, actor) {
    const empId = await getActorEmpId(actor);
    if (!(await tableExists("employeeSchedule"))) {
      return false;
    }

    const pool = await getPool();
    const request = pool.request().input("scheduleId", sql.Int, Number(id));
    if (empId) {
      request.input("EmpID", sql.Int, empId);
    }

    const result = await request.query(`
      DELETE FROM dbo.employeeSchedule
      OUTPUT deleted.scheduleId
      WHERE scheduleId = @scheduleId
        ${empId ? "AND EmpID = @EmpID" : ""}
    `);

    return Boolean(result.recordset[0]);
  }

  async function createMeeting(payload, actor) {
    const empId = await getEffectiveEmpId(actor);
    if (!empId) {
      throw new Error("No employee is available for meeting creation.");
    }

    if (await hasUnifiedEmployeeCalendar()) {
      const pool = await getPool();
      const meetingFields = await getMeetingFieldSupport();
      const startDateTime = coerceDate(payload.startDateTime);
      const endDateTime = coerceDate(payload.endDateTime || payload.startDateTime);
      if (!startDateTime || !endDateTime) {
        throw new Error("Meeting date and time are required.");
      }

      const columns = [
        "EmpID",
        "entryCategory",
        "entryType",
        "title",
        "description",
        "startDateTime",
        "endDateTime",
        "isAllDay",
        "leaveDays",
        "entryStatus",
        "referenceTable"
      ];
      const values = [
        "@EmpID",
        "N'MEETING'",
        "N'MEETING'",
        "@title",
        "@description",
        "@startDateTime",
        "@endDateTime",
        "0",
        "0",
        "N'ACTIVE'",
        "N'employeeCalendar:meeting'"
      ];
      if (meetingFields.location) {
        columns.push("meetingLocation");
        values.push("@meetingLocation");
      }
      if (meetingFields.link) {
        columns.push("meetingLink");
        values.push("@meetingLink");
      }
      if (meetingFields.summary) {
        columns.push("meetingSummary");
        values.push("@meetingSummary");
      }

      const result = await pool.request()
        .input("EmpID", sql.Int, empId)
        .input("title", sql.NVarChar(200), payload.title)
        .input("description", sql.NVarChar(sql.MAX), payload.notes || "")
        .input("startDateTime", sql.DateTime2, startDateTime)
        .input("endDateTime", sql.DateTime2, endDateTime)
        .input("meetingLocation", sql.NVarChar(300), payload.location || null)
        .input("meetingLink", sql.NVarChar(500), payload.link || null)
        .input("meetingSummary", sql.NVarChar(sql.MAX), payload.summary || null)
        .query(`
          INSERT INTO dbo.employeeCalendar (${columns.join(", ")})
          OUTPUT
            inserted.calendarId,
            inserted.title,
            inserted.description,
            inserted.startDateTime,
            inserted.endDateTime,
            ${meetingFields.location ? "inserted.meetingLocation" : "CAST(NULL AS NVARCHAR(300)) AS meetingLocation"},
            ${meetingFields.link ? "inserted.meetingLink" : "CAST(NULL AS NVARCHAR(500)) AS meetingLink"},
            ${meetingFields.summary ? "inserted.meetingSummary" : "CAST(NULL AS NVARCHAR(MAX)) AS meetingSummary"}
          VALUES (${values.join(", ")})
        `);

      return mapCalendarMeetingRow(result.recordset[0]);
    }

    if (!(await tableExists("employeeMeeting"))) {
      throw new Error("employeeMeeting table is not available in the database.");
    }

    const pool = await getPool();
    const result = await pool.request()
      .input("EmpID", sql.Int, empId)
      .input("meetingTitle", sql.NVarChar(200), payload.title)
      .input("meetingDescription", sql.NVarChar(500), payload.notes || "")
      .input("meetingDate", sql.Date, formatLocalDate(payload.startDateTime))
      .input("startTime", sql.Time, formatLocalTime(payload.startDateTime) || "00:00")
      .input("endTime", sql.Time, formatLocalTime(payload.endDateTime || payload.startDateTime) || formatLocalTime(payload.startDateTime) || "00:00")
      .input("meetingLink", sql.NVarChar(300), payload.link || null)
      .query(`
        INSERT INTO dbo.employeeMeeting (
          EmpID,
          meetingTitle,
          meetingDescription,
          meetingDate,
          startTime,
          endTime,
          meetingLink
        )
        OUTPUT
          inserted.meetingId,
          inserted.meetingTitle,
          inserted.meetingDescription,
          inserted.meetingDate,
          inserted.startTime,
          inserted.endTime,
          inserted.meetingLink
        VALUES (
          @EmpID,
          @meetingTitle,
          @meetingDescription,
          @meetingDate,
          @startTime,
          @endTime,
          @meetingLink
        )
      `);

    return mapLegacyMeetingRow(result.recordset[0]);
  }

  async function updateMeeting(id, payload, actor) {
    const empId = await getActorEmpId(actor);
    if (await hasUnifiedEmployeeCalendar()) {
      const pool = await getPool();
      const meetingFields = await getMeetingFieldSupport();
      const request = pool.request()
        .input("calendarId", sql.Int, Number(id))
        .input("title", sql.NVarChar(200), payload.title ?? null)
        .input("description", sql.NVarChar(sql.MAX), payload.notes ?? null)
        .input("startDateTime", sql.DateTime2, payload.startDateTime ? coerceDate(payload.startDateTime) : null)
        .input("endDateTime", sql.DateTime2, payload.endDateTime ? coerceDate(payload.endDateTime) : null)
        .input("meetingLocation", sql.NVarChar(300), payload.location ?? null)
        .input("meetingLink", sql.NVarChar(500), payload.link ?? null)
        .input("meetingSummary", sql.NVarChar(sql.MAX), payload.summary ?? null);
      if (empId) {
        request.input("EmpID", sql.Int, empId);
      }

      const result = await request.query(`
        UPDATE dbo.employeeCalendar
        SET
          title = COALESCE(@title, title),
          description = COALESCE(@description, description),
          startDateTime = COALESCE(@startDateTime, startDateTime),
          endDateTime = COALESCE(@endDateTime, endDateTime)
          ${meetingFields.location ? ", meetingLocation = COALESCE(@meetingLocation, meetingLocation)" : ""}
          ${meetingFields.link ? ", meetingLink = COALESCE(@meetingLink, meetingLink)" : ""}
          ${meetingFields.summary ? ", meetingSummary = COALESCE(@meetingSummary, meetingSummary)" : ""}
        OUTPUT
          inserted.calendarId,
          inserted.title,
          inserted.description,
          inserted.startDateTime,
          inserted.endDateTime,
          ${meetingFields.location ? "inserted.meetingLocation" : "CAST(NULL AS NVARCHAR(300)) AS meetingLocation"},
          ${meetingFields.link ? "inserted.meetingLink" : "CAST(NULL AS NVARCHAR(500)) AS meetingLink"},
          ${meetingFields.summary ? "inserted.meetingSummary" : "CAST(NULL AS NVARCHAR(MAX)) AS meetingSummary"}
        WHERE calendarId = @calendarId
          AND entryCategory = N'MEETING'
          ${empId ? "AND EmpID = @EmpID" : ""}
      `);

      const row = result.recordset[0];
      if (!row) {
        return null;
      }

      return mapCalendarMeetingRow(row);
    }

    if (!(await tableExists("employeeMeeting"))) {
      return null;
    }

    const pool = await getPool();
    const request = pool.request()
      .input("meetingId", sql.Int, Number(id))
      .input("meetingTitle", sql.NVarChar(200), payload.title ?? null)
      .input("meetingDescription", sql.NVarChar(500), payload.notes ?? null)
      .input("meetingDate", sql.Date, payload.startDateTime ? formatLocalDate(payload.startDateTime) : null)
      .input("startTime", sql.Time, payload.startDateTime ? formatLocalTime(payload.startDateTime) || "00:00" : null)
      .input("endTime", sql.Time, payload.endDateTime ? formatLocalTime(payload.endDateTime) || formatLocalTime(payload.startDateTime) || "00:00" : null)
      .input("meetingLink", sql.NVarChar(300), payload.link ?? null);
    if (empId) {
      request.input("EmpID", sql.Int, empId);
    }

    const result = await request.query(`
      UPDATE dbo.employeeMeeting
      SET
        meetingTitle = COALESCE(@meetingTitle, meetingTitle),
        meetingDescription = COALESCE(@meetingDescription, meetingDescription),
        meetingDate = COALESCE(@meetingDate, meetingDate),
        startTime = COALESCE(@startTime, startTime),
        endTime = COALESCE(@endTime, endTime),
        meetingLink = COALESCE(@meetingLink, meetingLink)
      OUTPUT
        inserted.meetingId,
        inserted.meetingTitle,
        inserted.meetingDescription,
        inserted.meetingDate,
        inserted.startTime,
        inserted.endTime,
        inserted.meetingLink
      WHERE meetingId = @meetingId
        ${empId ? "AND EmpID = @EmpID" : ""}
    `);

    const row = result.recordset[0];
    if (!row) {
      return null;
    }

    return mapLegacyMeetingRow(row);
  }

  async function deleteMeeting(id, actor) {
    const empId = await getActorEmpId(actor);
    if (await hasUnifiedEmployeeCalendar()) {
      const pool = await getPool();
      const request = pool.request().input("calendarId", sql.Int, Number(id));
      if (empId) {
        request.input("EmpID", sql.Int, empId);
      }

      const result = await request.query(`
        DELETE FROM dbo.employeeCalendar
        OUTPUT deleted.calendarId
        WHERE calendarId = @calendarId
          AND entryCategory = N'MEETING'
          ${empId ? "AND EmpID = @EmpID" : ""}
      `);

      return Boolean(result.recordset[0]);
    }

    if (!(await tableExists("employeeMeeting"))) {
      return false;
    }

    const pool = await getPool();
    const request = pool.request().input("meetingId", sql.Int, Number(id));
    if (empId) {
      request.input("EmpID", sql.Int, empId);
    }

    const result = await request.query(`
      DELETE FROM dbo.employeeMeeting
      OUTPUT deleted.meetingId
      WHERE meetingId = @meetingId
        ${empId ? "AND EmpID = @EmpID" : ""}
    `);

    return Boolean(result.recordset[0]);
  }

  async function createHoliday(payload, actor) {
    if (!(await hasUnifiedEmployeeCalendar())) {
      throw new Error("Holiday is not connected to the current database schema yet.");
    }

    const empId = await getEffectiveEmpId(actor);
    if (!empId) {
      throw new Error("No employee is available for holiday creation.");
    }

    if (payload.holidayDate) {
      const holidayDate = normalizeHolidayDate(payload.holidayDate);
      if (!holidayDate) {
        throw new Error("A valid holiday date is required.");
      }

      const pool = await getPool();
      const existing = await pool.request()
        .input("title", sql.NVarChar(200), payload.name)
        .input("holidayDate", sql.Date, holidayDate)
        .query(`
          SELECT TOP 1 calendarId
          FROM dbo.employeeCalendar
          WHERE entryCategory = N'HOLIDAY'
            AND entryType = N'PUBLIC_HOLIDAY'
            AND title = @title
            AND CAST(startDateTime AS DATE) = @holidayDate
        `);

      if (existing.recordset[0]) {
        throw new Error("That public holiday already exists for the selected date.");
      }

      const result = await pool.request()
        .input("EmpID", sql.Int, empId)
        .input("title", sql.NVarChar(200), payload.name)
        .input("description", sql.NVarChar(1000), null)
        .input("startDateTime", sql.DateTime2, holidayDate)
        .query(`
          INSERT INTO dbo.employeeCalendar (
            EmpID,
            entryCategory,
            entryType,
            title,
            description,
            startDateTime,
            endDateTime,
            isAllDay,
            leaveDays,
            entryStatus
          )
          OUTPUT inserted.calendarId, inserted.EmpID, inserted.title, inserted.startDateTime, inserted.description
          VALUES (
            @EmpID,
            N'HOLIDAY',
            N'PUBLIC_HOLIDAY',
            @title,
            @description,
            @startDateTime,
            @startDateTime,
            1,
            0,
            N'ACTIVE'
          )
        `);

      const row = result.recordset[0];
      return {
        id: Number(row.calendarId),
        empId: Number(row.EmpID),
        name: row.title,
        holidayDate: formatLocalDate(row.startDateTime),
        year: coerceDate(row.startDateTime)?.getFullYear() || 0,
        month: formatMonthName(row.startDateTime),
        date: coerceDate(row.startDateTime)?.getDate() || 0,
        day: formatDayName(row.startDateTime),
        description: row.description || ""
      };
    }

    if (isDerivedHolidayName(payload.name)) {
      throw new Error("CL, PL, and Unpaid balances are calculated automatically from employeeCalendar leave entries.");
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const pool = await getPool();
    const result = await pool.request()
      .input("EmpID", sql.Int, empId)
      .input("title", sql.NVarChar(200), payload.name)
      .input("description", sql.NVarChar(sql.MAX), buildHolidaySummaryMetadata(payload))
      .input("startDateTime", sql.DateTime2, today)
      .query(`
        INSERT INTO dbo.employeeCalendar (
          EmpID,
          entryCategory,
          entryType,
          title,
          description,
          startDateTime,
          endDateTime,
          isAllDay,
          leaveDays,
          entryStatus
        )
        OUTPUT inserted.calendarId
        VALUES (
          @EmpID,
          N'HOLIDAY',
          N'SUMMARY',
          @title,
          @description,
          @startDateTime,
          @startDateTime,
          1,
          0,
          N'ACTIVE'
        )
      `);

    return {
      id: Number(result.recordset[0].calendarId),
      name: payload.name,
      used: Number(payload.used || 0),
      total: Number(payload.total || 0),
      editable: true
    };
  }

  async function updateHoliday(id, payload, actor) {
    if (!(await hasUnifiedEmployeeCalendar())) {
      return null;
    }

    const empId = await getActorEmpId(actor);
    const pool = await getPool();

    if (payload.holidayDate !== undefined) {
      const holidayDate = normalizeHolidayDate(payload.holidayDate);
      if (!holidayDate) {
        throw new Error("A valid holiday date is required.");
      }

      const request = pool.request()
        .input("calendarId", sql.Int, Number(id))
        .input("title", sql.NVarChar(200), payload.name ?? null)
        .input("startDateTime", sql.DateTime2, holidayDate);
      if (empId) {
        request.input("EmpID", sql.Int, empId);
      }

      const result = await request.query(`
        UPDATE dbo.employeeCalendar
        SET
          title = COALESCE(@title, title),
          startDateTime = @startDateTime,
          endDateTime = @startDateTime
        OUTPUT inserted.calendarId, inserted.EmpID, inserted.title, inserted.startDateTime, inserted.description
        WHERE calendarId = @calendarId
          AND entryCategory = N'HOLIDAY'
          AND entryType = N'PUBLIC_HOLIDAY'
          ${empId ? "AND EmpID = @EmpID" : ""}
      `);

      const row = result.recordset[0];
      if (!row) {
        return null;
      }
      return {
        id: Number(row.calendarId),
        empId: Number(row.EmpID),
        name: row.title,
        holidayDate: formatLocalDate(row.startDateTime),
        year: coerceDate(row.startDateTime)?.getFullYear() || 0,
        month: formatMonthName(row.startDateTime),
        date: coerceDate(row.startDateTime)?.getDate() || 0,
        day: formatDayName(row.startDateTime),
        description: row.description || ""
      };
    }

    if (payload.name && isDerivedHolidayName(payload.name)) {
      throw new Error("CL, PL, and Unpaid balances are calculated automatically from employeeCalendar leave entries.");
    }

    const request = pool.request()
      .input("calendarId", sql.Int, Number(id))
      .input("title", sql.NVarChar(200), payload.name ?? null)
      .input("description", sql.NVarChar(sql.MAX), buildHolidaySummaryMetadata(payload));
    if (empId) {
      request.input("EmpID", sql.Int, empId);
    }

    const result = await request.query(`
      UPDATE dbo.employeeCalendar
      SET
        title = COALESCE(@title, title),
        description = COALESCE(@description, description)
      OUTPUT inserted.calendarId, inserted.title, inserted.description
      WHERE calendarId = @calendarId
        AND entryCategory = N'HOLIDAY'
        AND entryType = N'SUMMARY'
        ${empId ? "AND EmpID = @EmpID" : ""}
    `);

    const row = result.recordset[0];
    if (!row) {
      return null;
    }
    const metadata = parseHolidaySummaryMetadata(row.description) || { used: 0, total: 0 };
    return {
      id: Number(row.calendarId),
      name: row.title,
      used: Number(metadata.used || 0),
      total: Number(metadata.total || 0),
      editable: true
    };
  }

  function unsupported(featureName) {
    return async () => {
      throw new Error(`${featureName} is not connected to the current database schema yet.`);
    };
  }

  return {
    provider: "sqlserver",
    getBootstrap,
    validateLogin,
    createUser,
    createProject,
    updateProject,
    deleteProject,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    createMeeting,
    updateMeeting,
    deleteMeeting,
    createFinance: unsupported("Finance"),
    updateFinance: unsupported("Finance"),
    deleteFinance: unsupported("Finance"),
    createHoliday,
    updateHoliday,
    createTodo: unsupported("Task"),
    updateTodo: unsupported("Task"),
    deleteTodo: unsupported("Task")
  };
}

module.exports = { createSqlServerStore };
