USE ScheduleTracker;
GO

SET NOCOUNT ON;
GO

IF OBJECT_ID(N'dbo.scheduleType', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.scheduleType (
        scheduleTypeId INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        scheduleType NVARCHAR(50) NOT NULL UNIQUE
    );
END;
GO

IF NOT EXISTS (SELECT 1 FROM dbo.scheduleType WHERE scheduleType = N'Daily')
    INSERT INTO dbo.scheduleType (scheduleType) VALUES (N'Daily');
GO

IF NOT EXISTS (SELECT 1 FROM dbo.scheduleType WHERE scheduleType = N'Weekly')
    INSERT INTO dbo.scheduleType (scheduleType) VALUES (N'Weekly');
GO

IF NOT EXISTS (SELECT 1 FROM dbo.scheduleType WHERE scheduleType = N'Monthly')
    INSERT INTO dbo.scheduleType (scheduleType) VALUES (N'Monthly');
GO

SELECT *
FROM dbo.scheduleType
ORDER BY scheduleTypeId;
GO
