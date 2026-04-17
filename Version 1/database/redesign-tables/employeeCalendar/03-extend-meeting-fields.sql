USE ScheduleTracker;
GO

SET NOCOUNT ON;
SET XACT_ABORT ON;
GO

BEGIN TRY
    BEGIN TRANSACTION;

    IF COL_LENGTH(N'dbo.employeeCalendar', N'meetingLocation') IS NULL
    BEGIN
        ALTER TABLE dbo.employeeCalendar
        ADD meetingLocation NVARCHAR(300) NULL;
    END;

    IF COL_LENGTH(N'dbo.employeeCalendar', N'meetingLink') IS NULL
    BEGIN
        ALTER TABLE dbo.employeeCalendar
        ADD meetingLink NVARCHAR(500) NULL;
    END;

    IF COL_LENGTH(N'dbo.employeeCalendar', N'meetingSummary') IS NULL
    BEGIN
        ALTER TABLE dbo.employeeCalendar
        ADD meetingSummary NVARCHAR(MAX) NULL;
    END;

    IF OBJECT_ID(N'dbo.employeeMeeting', N'U') IS NOT NULL
       AND COL_LENGTH(N'dbo.employeeMeeting', N'meetingLocation') IS NULL
    BEGIN
        ALTER TABLE dbo.employeeMeeting
        ADD meetingLocation NVARCHAR(300) NULL;
    END;

    IF OBJECT_ID(N'dbo.employeeMeeting', N'U') IS NOT NULL
       AND COL_LENGTH(N'dbo.employeeMeeting', N'meetingSummary') IS NULL
    BEGIN
        ALTER TABLE dbo.employeeMeeting
        ADD meetingSummary NVARCHAR(MAX) NULL;
    END;

    IF OBJECT_ID(N'dbo.employeeMeeting', N'U') IS NOT NULL
    BEGIN
        UPDATE cal
        SET
            cal.meetingLink = COALESCE(cal.meetingLink, legacy.meetingLink),
            cal.meetingSummary = COALESCE(cal.meetingSummary, legacy.meetingSummary, legacy.meetingDescription),
            cal.description = COALESCE(cal.description, legacy.meetingDescription)
        FROM dbo.employeeCalendar AS cal
        INNER JOIN dbo.employeeMeeting AS legacy
            ON (
                cal.referenceTable = N'employeeMeeting'
                AND cal.referenceId = legacy.meetingId
            )
            OR (
                cal.entryCategory = N'MEETING'
                AND cal.EmpID = legacy.EmpID
                AND cal.title = legacy.meetingTitle
                AND CAST(cal.startDateTime AS DATE) = legacy.meetingDate
            );
    END;

    IF NOT EXISTS (
        SELECT 1
        FROM sys.indexes
        WHERE name = N'IX_employeeCalendar_meeting_upcoming'
          AND object_id = OBJECT_ID(N'dbo.employeeCalendar')
    )
    BEGIN
        CREATE INDEX IX_employeeCalendar_meeting_upcoming
            ON dbo.employeeCalendar (entryCategory, startDateTime, EmpID);
    END;

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

SELECT
    calendarId,
    EmpID,
    title,
    meetingLocation,
    meetingLink,
    meetingSummary,
    startDateTime,
    endDateTime
FROM dbo.employeeCalendar
WHERE entryCategory = N'MEETING'
ORDER BY startDateTime, calendarId;
GO
