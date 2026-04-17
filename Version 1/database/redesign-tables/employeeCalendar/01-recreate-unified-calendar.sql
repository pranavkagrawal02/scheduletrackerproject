USE ScheduleTracker;
GO

SET NOCOUNT ON;
SET XACT_ABORT ON;
GO

/*
  Unified employee calendar redesign

  Business rules implemented:
  - CL accrual: 1 day per month, carries forward only within the same year.
  - PL accrual: 5 days per month, carries forward only within the same year.
  - PL cap: cannot accumulate above 45 days.
  - Unpaid leave: stored separately and reported after paid leave is exhausted.

  Notes:
  - Only calendarId and EmpID are retained from the old employeeCalendar shape.
  - Old columns such as eventTitle, eventDescription, eventStart, eventEnd, eventType
    are removed by recreating the table.
  - The new table supports leave, meetings, project schedules, deadlines, tasks,
    holidays, and general calendar entries in one place.
  - This script uses dbo.employeeCalendar_new first, then swaps it in.
    That avoids SQL Server compile errors against the old table definition.
*/

BEGIN TRY
    BEGIN TRANSACTION;

    IF OBJECT_ID(N'tempdb..#employeeCalendar_legacy', N'U') IS NOT NULL
    BEGIN
        DROP TABLE #employeeCalendar_legacy;
    END;

    IF OBJECT_ID(N'dbo.employeeCalendar_new', N'U') IS NOT NULL
    BEGIN
        DROP TABLE dbo.employeeCalendar_new;
    END;

    IF OBJECT_ID(N'dbo.employeeCalendar', N'U') IS NOT NULL
    BEGIN
        SELECT *
        INTO #employeeCalendar_legacy
        FROM dbo.employeeCalendar;
    END;

    CREATE TABLE dbo.employeeCalendar_new (
        calendarId INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        EmpID INT NOT NULL,
        entryCategory NVARCHAR(30) NOT NULL,
        entryType NVARCHAR(40) NOT NULL CONSTRAINT DF_employeeCalendarNew_entryType DEFAULT (N'GENERAL'),
        title NVARCHAR(200) NOT NULL,
        description NVARCHAR(1000) NULL,
        startDateTime DATETIME2(0) NOT NULL,
        endDateTime DATETIME2(0) NULL,
        isAllDay BIT NOT NULL CONSTRAINT DF_employeeCalendarNew_isAllDay DEFAULT (0),
        leaveDays DECIMAL(10,2) NOT NULL CONSTRAINT DF_employeeCalendarNew_leaveDays DEFAULT (0),
        entryStatus NVARCHAR(20) NOT NULL CONSTRAINT DF_employeeCalendarNew_entryStatus DEFAULT (N'APPROVED'),
        projectId INT NULL,
        referenceTable NVARCHAR(50) NULL,
        referenceId INT NULL,
        createdAt DATETIME2(0) NOT NULL CONSTRAINT DF_employeeCalendarNew_createdAt DEFAULT (SYSDATETIME()),
        updatedAt DATETIME2(0) NOT NULL CONSTRAINT DF_employeeCalendarNew_updatedAt DEFAULT (SYSDATETIME()),
        CONSTRAINT CK_employeeCalendarNew_entryCategory CHECK (
            entryCategory IN (N'LEAVE', N'MEETING', N'PROJECT', N'DEADLINE', N'TASK', N'HOLIDAY', N'GENERAL')
        ),
        CONSTRAINT CK_employeeCalendarNew_entryStatus CHECK (
            entryStatus IN (N'PENDING', N'APPROVED', N'REJECTED', N'CANCELLED', N'PLANNED', N'ACTIVE', N'COMPLETED')
        ),
        CONSTRAINT CK_employeeCalendarNew_dates CHECK (
            endDateTime IS NULL OR endDateTime >= startDateTime
        ),
        CONSTRAINT CK_employeeCalendarNew_leaveDays CHECK (
            leaveDays >= 0
        ),
        CONSTRAINT CK_employeeCalendarNew_leaveCategory CHECK (
            (entryCategory = N'LEAVE' AND entryType IN (N'CL', N'PL', N'UNPAID') AND leaveDays > 0)
            OR
            (entryCategory <> N'LEAVE' AND leaveDays = 0)
        )
    );

    IF OBJECT_ID(N'tempdb..#employeeCalendar_legacy', N'U') IS NOT NULL
       AND COL_LENGTH(N'tempdb..#employeeCalendar_legacy', N'calendarId') IS NOT NULL
       AND COL_LENGTH(N'tempdb..#employeeCalendar_legacy', N'EmpID') IS NOT NULL
       AND COL_LENGTH(N'tempdb..#employeeCalendar_legacy', N'eventTitle') IS NOT NULL
       AND COL_LENGTH(N'tempdb..#employeeCalendar_legacy', N'eventStart') IS NOT NULL
    BEGIN
        SET IDENTITY_INSERT dbo.employeeCalendar_new ON;

        INSERT INTO dbo.employeeCalendar_new (
            calendarId,
            EmpID,
            entryCategory,
            entryType,
            title,
            description,
            startDateTime,
            endDateTime,
            isAllDay,
            leaveDays,
            entryStatus,
            projectId,
            referenceTable,
            referenceId,
            createdAt,
            updatedAt
        )
        SELECT
            legacy.calendarId,
            legacy.EmpID,
            CASE
                WHEN UPPER(LTRIM(RTRIM(ISNULL(legacy.eventType, N'')))) IN (N'CL', N'PL', N'UNPAID', N'UNPAID LEAVE') THEN N'LEAVE'
                WHEN UPPER(LTRIM(RTRIM(ISNULL(legacy.eventType, N'')))) IN (N'MEETING', N'OFFICIAL') THEN N'MEETING'
                WHEN UPPER(LTRIM(RTRIM(ISNULL(legacy.eventType, N'')))) IN (N'PROJECT', N'PROJECT_SCHEDULE') THEN N'PROJECT'
                WHEN UPPER(LTRIM(RTRIM(ISNULL(legacy.eventType, N'')))) = N'DEADLINE' THEN N'DEADLINE'
                WHEN UPPER(LTRIM(RTRIM(ISNULL(legacy.eventType, N'')))) = N'TASK' THEN N'TASK'
                WHEN UPPER(LTRIM(RTRIM(ISNULL(legacy.eventType, N'')))) = N'HOLIDAY' THEN N'HOLIDAY'
                ELSE N'GENERAL'
            END,
            CASE
                WHEN UPPER(LTRIM(RTRIM(ISNULL(legacy.eventType, N'')))) = N'UNPAID LEAVE' THEN N'UNPAID'
                WHEN NULLIF(LTRIM(RTRIM(ISNULL(legacy.eventType, N''))), N'') IS NULL THEN N'GENERAL'
                ELSE UPPER(REPLACE(LTRIM(RTRIM(legacy.eventType)), N' ', N'_'))
            END,
            COALESCE(NULLIF(LTRIM(RTRIM(ISNULL(legacy.eventTitle, N''))), N''), N'Untitled event'),
            NULLIF(LTRIM(RTRIM(ISNULL(legacy.eventDescription, N''))), N''),
            CAST(legacy.eventStart AS DATETIME2(0)),
            CAST(COALESCE(legacy.eventEnd, legacy.eventStart) AS DATETIME2(0)),
            CASE
                WHEN CAST(COALESCE(legacy.eventEnd, legacy.eventStart) AS DATE) = CAST(legacy.eventStart AS DATE)
                     AND CONVERT(TIME(0), CAST(legacy.eventStart AS DATETIME2(0))) = '00:00:00'
                     AND CONVERT(TIME(0), CAST(COALESCE(legacy.eventEnd, legacy.eventStart) AS DATETIME2(0))) = '00:00:00'
                THEN 1
                ELSE 0
            END,
            CASE
                WHEN UPPER(LTRIM(RTRIM(ISNULL(legacy.eventType, N'')))) IN (N'CL', N'PL', N'UNPAID', N'UNPAID LEAVE')
                THEN CAST(DATEDIFF(DAY, CAST(legacy.eventStart AS DATE), CAST(COALESCE(legacy.eventEnd, legacy.eventStart) AS DATE)) + 1 AS DECIMAL(10,2))
                ELSE CAST(0 AS DECIMAL(10,2))
            END,
            CASE
                WHEN UPPER(LTRIM(RTRIM(ISNULL(legacy.eventType, N'')))) IN (N'CL', N'PL', N'UNPAID', N'UNPAID LEAVE') THEN N'APPROVED'
                ELSE N'ACTIVE'
            END,
            NULL,
            N'employeeCalendar_legacy',
            legacy.calendarId,
            SYSDATETIME(),
            SYSDATETIME()
        FROM #employeeCalendar_legacy AS legacy;

        SET IDENTITY_INSERT dbo.employeeCalendar_new OFF;
    END;

    IF OBJECT_ID(N'dbo.employeeMeeting', N'U') IS NOT NULL
       AND COL_LENGTH(N'dbo.employeeMeeting', N'meetingId') IS NOT NULL
       AND COL_LENGTH(N'dbo.employeeMeeting', N'EmpID') IS NOT NULL
       AND COL_LENGTH(N'dbo.employeeMeeting', N'meetingTitle') IS NOT NULL
       AND COL_LENGTH(N'dbo.employeeMeeting', N'meetingDate') IS NOT NULL
    BEGIN
        INSERT INTO dbo.employeeCalendar_new (
            EmpID,
            entryCategory,
            entryType,
            title,
            description,
            startDateTime,
            endDateTime,
            isAllDay,
            leaveDays,
            entryStatus,
            projectId,
            referenceTable,
            referenceId
        )
        SELECT
            m.EmpID,
            N'MEETING',
            N'MEETING',
            COALESCE(NULLIF(LTRIM(RTRIM(ISNULL(m.meetingTitle, N''))), N''), N'Untitled meeting'),
            NULLIF(LTRIM(RTRIM(ISNULL(m.meetingDescription, N''))), N''),
            DATEADD(
                SECOND,
                DATEDIFF(SECOND, CAST('00:00:00' AS TIME(0)), CAST(COALESCE(m.startTime, CAST('00:00:00' AS TIME(0))) AS TIME(0))),
                CAST(COALESCE(m.meetingDate, CAST(GETDATE() AS DATE)) AS DATETIME2(0))
            ),
            DATEADD(
                SECOND,
                DATEDIFF(
                    SECOND,
                    CAST('00:00:00' AS TIME(0)),
                    CAST(COALESCE(m.endTime, m.startTime, CAST('00:00:00' AS TIME(0))) AS TIME(0))
                ),
                CAST(COALESCE(m.meetingDate, CAST(GETDATE() AS DATE)) AS DATETIME2(0))
            ),
            CASE
                WHEN m.startTime IS NULL AND m.endTime IS NULL THEN 1
                ELSE 0
            END,
            0,
            N'ACTIVE',
            NULL,
            N'employeeMeeting',
            m.meetingId
        FROM dbo.employeeMeeting AS m;
    END;

    IF OBJECT_ID(N'dbo.employeeSchedule', N'U') IS NOT NULL
       AND COL_LENGTH(N'dbo.employeeSchedule', N'scheduleId') IS NOT NULL
       AND COL_LENGTH(N'dbo.employeeSchedule', N'EmpID') IS NOT NULL
       AND COL_LENGTH(N'dbo.employeeSchedule', N'scheduleTitle') IS NOT NULL
    BEGIN
        INSERT INTO dbo.employeeCalendar_new (
            EmpID,
            entryCategory,
            entryType,
            title,
            description,
            startDateTime,
            endDateTime,
            isAllDay,
            leaveDays,
            entryStatus,
            projectId,
            referenceTable,
            referenceId
        )
        SELECT
            s.EmpID,
            N'GENERAL',
            UPPER(COALESCE(st.scheduleType, N'WEEKLY')),
            COALESCE(NULLIF(LTRIM(RTRIM(ISNULL(s.scheduleTitle, N''))), N''), N'Untitled schedule'),
            NULLIF(LTRIM(RTRIM(ISNULL(s.scheduleNote, N''))), N''),
            DATEADD(
                SECOND,
                DATEDIFF(SECOND, CAST('00:00:00' AS TIME(0)), CAST(COALESCE(s.startTime, CAST('00:00:00' AS TIME(0))) AS TIME(0))),
                CAST(CAST(GETDATE() AS DATE) AS DATETIME2(0))
            ),
            DATEADD(
                SECOND,
                DATEDIFF(
                    SECOND,
                    CAST('00:00:00' AS TIME(0)),
                    CAST(COALESCE(s.endTime, s.startTime, CAST('00:00:00' AS TIME(0))) AS TIME(0))
                ),
                CAST(CAST(GETDATE() AS DATE) AS DATETIME2(0))
            ),
            CASE
                WHEN s.startTime IS NULL AND s.endTime IS NULL THEN 1
                ELSE 0
            END,
            0,
            N'ACTIVE',
            NULL,
            N'employeeSchedule',
            s.scheduleId
        FROM dbo.employeeSchedule AS s
        LEFT JOIN dbo.scheduleType AS st
            ON st.scheduleTypeId = s.scheduleTypeId;
    END;

    IF OBJECT_ID(N'dbo.users', N'U') IS NOT NULL
       AND NOT EXISTS (
            SELECT 1
            FROM sys.foreign_keys
            WHERE name = N'FK_employeeCalendarNew_users'
       )
    BEGIN
        ALTER TABLE dbo.employeeCalendar_new
        ADD CONSTRAINT FK_employeeCalendarNew_users
        FOREIGN KEY (EmpID) REFERENCES dbo.users(EmpID);
    END;

    CREATE INDEX IX_employeeCalendarNew_EmpID_startDateTime
        ON dbo.employeeCalendar_new (EmpID, startDateTime);

    CREATE INDEX IX_employeeCalendarNew_entryCategory_entryType
        ON dbo.employeeCalendar_new (entryCategory, entryType, entryStatus);

    CREATE INDEX IX_employeeCalendarNew_reference
        ON dbo.employeeCalendar_new (referenceTable, referenceId);

    IF OBJECT_ID(N'dbo.employeeCalendar', N'U') IS NOT NULL
    BEGIN
        DROP TABLE dbo.employeeCalendar;
    END;

    EXEC sp_rename N'dbo.employeeCalendar_new', N'employeeCalendar';

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
    BEGIN
        ROLLBACK TRANSACTION;
    END;

    THROW;
END CATCH;
GO

CREATE OR ALTER TRIGGER dbo.trg_employeeCalendar_setUpdatedAt
ON dbo.employeeCalendar
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    IF TRIGGER_NESTLEVEL() > 1
    BEGIN
        RETURN;
    END;

    UPDATE cal
    SET updatedAt = SYSDATETIME()
    FROM dbo.employeeCalendar AS cal
    INNER JOIN inserted AS i
        ON i.calendarId = cal.calendarId;
END;
GO

CREATE OR ALTER PROCEDURE dbo.usp_EmployeeCalendarLeaveLedger
    @EmpID INT = NULL,
    @CalendarYear INT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SET @CalendarYear = ISNULL(@CalendarYear, YEAR(GETDATE()));

    ;WITH Employees AS (
        SELECT EmpID
        FROM dbo.users
        UNION
        SELECT DISTINCT EmpID
        FROM dbo.employeeCalendar
    ),
    TargetEmployees AS (
        SELECT DISTINCT EmpID
        FROM Employees
        WHERE @EmpID IS NULL OR EmpID = @EmpID
    ),
    Months AS (
        SELECT 1 AS CalendarMonth
        UNION ALL SELECT 2
        UNION ALL SELECT 3
        UNION ALL SELECT 4
        UNION ALL SELECT 5
        UNION ALL SELECT 6
        UNION ALL SELECT 7
        UNION ALL SELECT 8
        UNION ALL SELECT 9
        UNION ALL SELECT 10
        UNION ALL SELECT 11
        UNION ALL SELECT 12
    ),
    UsageByMonth AS (
        SELECT
            c.EmpID,
            YEAR(c.startDateTime) AS CalendarYear,
            MONTH(c.startDateTime) AS CalendarMonth,
            SUM(CASE WHEN c.entryCategory = N'LEAVE' AND c.entryType = N'CL' AND c.entryStatus = N'APPROVED' THEN c.leaveDays ELSE 0 END) AS CLUsed,
            SUM(CASE WHEN c.entryCategory = N'LEAVE' AND c.entryType = N'PL' AND c.entryStatus = N'APPROVED' THEN c.leaveDays ELSE 0 END) AS PLUsed,
            SUM(CASE WHEN c.entryCategory = N'LEAVE' AND c.entryType = N'UNPAID' AND c.entryStatus = N'APPROVED' THEN c.leaveDays ELSE 0 END) AS UnpaidUsed
        FROM dbo.employeeCalendar AS c
        WHERE YEAR(c.startDateTime) = @CalendarYear
        GROUP BY
            c.EmpID,
            YEAR(c.startDateTime),
            MONTH(c.startDateTime)
    ),
    BaseMonths AS (
        SELECT
            e.EmpID,
            @CalendarYear AS CalendarYear,
            m.CalendarMonth,
            CAST(COALESCE(u.CLUsed, 0) AS DECIMAL(10,2)) AS CLUsed,
            CAST(COALESCE(u.PLUsed, 0) AS DECIMAL(10,2)) AS PLUsed,
            CAST(COALESCE(u.UnpaidUsed, 0) AS DECIMAL(10,2)) AS UnpaidUsed
        FROM TargetEmployees AS e
        CROSS JOIN Months AS m
        LEFT JOIN UsageByMonth AS u
            ON u.EmpID = e.EmpID
           AND u.CalendarYear = @CalendarYear
           AND u.CalendarMonth = m.CalendarMonth
    ),
    CLLedger AS (
        SELECT
            b.EmpID,
            b.CalendarYear,
            b.CalendarMonth,
            CAST(0.00 AS DECIMAL(10,2)) AS OpeningCL,
            CAST(1.00 AS DECIMAL(10,2)) AS CreditedCL,
            b.CLUsed AS UsedCL,
            CAST(CASE WHEN 1.00 - b.CLUsed < 0 THEN 0.00 ELSE 1.00 - b.CLUsed END AS DECIMAL(10,2)) AS ClosingCL
        FROM BaseMonths AS b
        WHERE b.CalendarMonth = 1

        UNION ALL

        SELECT
            b.EmpID,
            b.CalendarYear,
            b.CalendarMonth,
            c.ClosingCL AS OpeningCL,
            CAST(1.00 AS DECIMAL(10,2)) AS CreditedCL,
            b.CLUsed AS UsedCL,
            CAST(CASE WHEN c.ClosingCL + 1.00 - b.CLUsed < 0 THEN 0.00 ELSE c.ClosingCL + 1.00 - b.CLUsed END AS DECIMAL(10,2)) AS ClosingCL
        FROM BaseMonths AS b
        INNER JOIN CLLedger AS c
            ON c.EmpID = b.EmpID
           AND c.CalendarYear = b.CalendarYear
           AND c.CalendarMonth = b.CalendarMonth - 1
        WHERE b.CalendarMonth > 1
    ),
    PLLedger AS (
        SELECT
            b.EmpID,
            b.CalendarYear,
            b.CalendarMonth,
            CAST(0.00 AS DECIMAL(10,2)) AS OpeningPL,
            CAST(5.00 AS DECIMAL(10,2)) AS CreditedPL,
            CAST(5.00 AS DECIMAL(10,2)) AS AvailablePLBeforeUse,
            b.PLUsed AS UsedPL,
            CAST(CASE WHEN 5.00 - b.PLUsed < 0 THEN 0.00 ELSE 5.00 - b.PLUsed END AS DECIMAL(10,2)) AS ClosingPL
        FROM BaseMonths AS b
        WHERE b.CalendarMonth = 1

        UNION ALL

        SELECT
            b.EmpID,
            b.CalendarYear,
            b.CalendarMonth,
            p.ClosingPL AS OpeningPL,
            CAST(5.00 AS DECIMAL(10,2)) AS CreditedPL,
            CAST(CASE WHEN p.ClosingPL + 5.00 > 45.00 THEN 45.00 ELSE p.ClosingPL + 5.00 END AS DECIMAL(10,2)) AS AvailablePLBeforeUse,
            b.PLUsed AS UsedPL,
            CAST(
                CASE
                    WHEN (CASE WHEN p.ClosingPL + 5.00 > 45.00 THEN 45.00 ELSE p.ClosingPL + 5.00 END) - b.PLUsed < 0
                    THEN 0.00
                    ELSE (CASE WHEN p.ClosingPL + 5.00 > 45.00 THEN 45.00 ELSE p.ClosingPL + 5.00 END) - b.PLUsed
                END
                AS DECIMAL(10,2)
            ) AS ClosingPL
        FROM BaseMonths AS b
        INNER JOIN PLLedger AS p
            ON p.EmpID = b.EmpID
           AND p.CalendarYear = b.CalendarYear
           AND p.CalendarMonth = b.CalendarMonth - 1
        WHERE b.CalendarMonth > 1
    )
    SELECT
        bm.EmpID,
        u.EmpFullName,
        bm.CalendarYear,
        bm.CalendarMonth,
        cl.OpeningCL,
        cl.CreditedCL,
        cl.UsedCL,
        cl.ClosingCL,
        pl.OpeningPL,
        pl.CreditedPL,
        pl.AvailablePLBeforeUse,
        pl.UsedPL,
        pl.ClosingPL,
        bm.UnpaidUsed,
        CAST(cl.ClosingCL + pl.ClosingPL AS DECIMAL(10,2)) AS TotalPaidLeaveRemaining
    FROM BaseMonths AS bm
    INNER JOIN CLLedger AS cl
        ON cl.EmpID = bm.EmpID
       AND cl.CalendarYear = bm.CalendarYear
       AND cl.CalendarMonth = bm.CalendarMonth
    INNER JOIN PLLedger AS pl
        ON pl.EmpID = bm.EmpID
       AND pl.CalendarYear = bm.CalendarYear
       AND pl.CalendarMonth = bm.CalendarMonth
    LEFT JOIN dbo.users AS u
        ON u.EmpID = bm.EmpID
    ORDER BY
        bm.EmpID,
        bm.CalendarMonth;
END;
GO

/*
  Examples:

  1. Insert one CL leave
     INSERT INTO dbo.employeeCalendar
     (
         EmpID, entryCategory, entryType, title, description,
         startDateTime, endDateTime, isAllDay, leaveDays, entryStatus
     )
     VALUES
     (
         1, N'LEAVE', N'CL', N'Casual Leave', N'Personal work',
         '2026-04-10T00:00:00', '2026-04-10T00:00:00', 1, 1, N'APPROVED'
     );

  2. Insert one meeting
     INSERT INTO dbo.employeeCalendar
     (
         EmpID, entryCategory, entryType, title, description,
         startDateTime, endDateTime, isAllDay, leaveDays, entryStatus
     )
     VALUES
     (
         1, N'MEETING', N'MEETING', N'Month Start Review', N'Planning and review event',
         '2026-04-08T11:00:00', '2026-04-08T12:00:00', 0, 0, N'ACTIVE'
     );

  3. Check leave balance ledger
     EXEC dbo.usp_EmployeeCalendarLeaveLedger @EmpID = 1, @CalendarYear = 2026;
*/
