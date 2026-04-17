USE ScheduleTracker;
GO

SET NOCOUNT ON;
SET XACT_ABORT ON;
GO

DECLARE @OwnerEmpID INT =
(
    SELECT TOP 1 EmpID
    FROM dbo.users
    ORDER BY EmpID
);

IF @OwnerEmpID IS NULL
BEGIN
    THROW 50001, 'No users found. Create at least one user before seeding public holidays.', 1;
END;

;WITH HolidaySeed AS (
    SELECT CAST('2026-01-26' AS DATE) AS holidayDate, N'Republic Day' AS holidayName
    UNION ALL SELECT CAST('2026-03-04' AS DATE), N'Holi'
    UNION ALL SELECT CAST('2026-03-26' AS DATE), N'Ram Navami'
    UNION ALL SELECT CAST('2026-03-31' AS DATE), N'Mahavir Jayanti'
    UNION ALL SELECT CAST('2026-04-03' AS DATE), N'Good Friday'
    UNION ALL SELECT CAST('2026-05-01' AS DATE), N'Budha Purnima'
    UNION ALL SELECT CAST('2026-05-27' AS DATE), N'Id-ul-Zuha (Bakrid)'
    UNION ALL SELECT CAST('2026-06-26' AS DATE), N'Muharram'
    UNION ALL SELECT CAST('2026-08-15' AS DATE), N'Independence Day'
    UNION ALL SELECT CAST('2026-08-26' AS DATE), N'Milad-un-Nabi'
    UNION ALL SELECT CAST('2026-09-04' AS DATE), N'Janmashtami'
    UNION ALL SELECT CAST('2026-10-02' AS DATE), N'Mahatma Gandhi Jayanti'
    UNION ALL SELECT CAST('2026-10-20' AS DATE), N'Dussehra'
    UNION ALL SELECT CAST('2026-11-08' AS DATE), N'Diwali'
    UNION ALL SELECT CAST('2026-11-24' AS DATE), N'Guru Nanak''s Birthday'
    UNION ALL SELECT CAST('2026-12-25' AS DATE), N'Christmas'
)
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
SELECT
    @OwnerEmpID,
    N'HOLIDAY',
    N'PUBLIC_HOLIDAY',
    hs.holidayName,
    NULL,
    CAST(hs.holidayDate AS DATETIME2(0)),
    CAST(hs.holidayDate AS DATETIME2(0)),
    1,
    0,
    N'ACTIVE'
FROM HolidaySeed AS hs
WHERE NOT EXISTS (
    SELECT 1
    FROM dbo.employeeCalendar AS ec
    WHERE ec.entryCategory = N'HOLIDAY'
      AND ec.entryType = N'PUBLIC_HOLIDAY'
      AND ec.title = hs.holidayName
      AND CAST(ec.startDateTime AS DATE) = hs.holidayDate
);
GO

SELECT
    calendarId,
    title AS holidayName,
    CAST(startDateTime AS DATE) AS holidayDate
FROM dbo.employeeCalendar
WHERE entryCategory = N'HOLIDAY'
  AND entryType = N'PUBLIC_HOLIDAY'
  AND YEAR(startDateTime) = 2026
ORDER BY startDateTime, title;
GO
