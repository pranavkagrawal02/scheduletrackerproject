USE ScheduleTracker;
GO

SET NOCOUNT ON;
GO

IF NOT EXISTS (SELECT 1 FROM dbo.users WHERE EmpUsername = N'owner1')
BEGIN
    INSERT INTO dbo.users (
        EmpCompany,
        EmpDesignation,
        EmpFirstName,
        EmpLastName,
        EmpFullName,
        EmpUserTypeID,
        EmpScheduleTypeID,
        EmpUsername,
        EmpPassword,
        EmpContact,
        EmpContactCountry,
        EmpDept,
        EmpDeptID,
        EmpReportingManager,
        EmpReportingManagerID,
        EmpEmail
    )
    VALUES (
        N'Pranav Systems',
        N'Owner',
        N'Pranav',
        N'Kumar',
        N'Pranav Kumar',
        (SELECT userTypeId FROM dbo.userType WHERE userType = N'Corporate'),
        (SELECT scheduleTypeId FROM dbo.scheduleType WHERE scheduleType = N'Monthly'),
        N'owner1',
        N'owner123',
        N'9876543210',
        N'+91',
        N'Management',
        1,
        NULL,
        NULL,
        N'owner1@example.com'
    );
END;
GO

IF NOT EXISTS (SELECT 1 FROM dbo.users WHERE EmpUsername = N'manager1')
BEGIN
    INSERT INTO dbo.users (
        EmpCompany,
        EmpDesignation,
        EmpFirstName,
        EmpLastName,
        EmpFullName,
        EmpUserTypeID,
        EmpScheduleTypeID,
        EmpUsername,
        EmpPassword,
        EmpContact,
        EmpContactCountry,
        EmpDept,
        EmpDeptID,
        EmpReportingManager,
        EmpReportingManagerID,
        EmpEmail
    )
    VALUES (
        N'Pranav Systems',
        N'Manager',
        N'Anita',
        N'Sharma',
        N'Anita Sharma',
        (SELECT userTypeId FROM dbo.userType WHERE userType = N'Multi User'),
        (SELECT scheduleTypeId FROM dbo.scheduleType WHERE scheduleType = N'Weekly'),
        N'manager1',
        N'manager123',
        N'9876500001',
        N'+91',
        N'Engineering',
        2,
        N'Pranav Kumar',
        (SELECT EmpID FROM dbo.users WHERE EmpUsername = N'owner1'),
        N'manager1@example.com'
    );
END;
GO

IF NOT EXISTS (SELECT 1 FROM dbo.users WHERE EmpUsername = N'employee1')
BEGIN
    INSERT INTO dbo.users (
        EmpCompany,
        EmpDesignation,
        EmpFirstName,
        EmpLastName,
        EmpFullName,
        EmpUserTypeID,
        EmpScheduleTypeID,
        EmpUsername,
        EmpPassword,
        EmpContact,
        EmpContactCountry,
        EmpDept,
        EmpDeptID,
        EmpReportingManager,
        EmpReportingManagerID,
        EmpEmail
    )
    VALUES (
        N'Pranav Systems',
        N'Employee',
        N'Ravi',
        N'Kumar',
        N'Ravi Kumar',
        (SELECT userTypeId FROM dbo.userType WHERE userType = N'Single User'),
        (SELECT scheduleTypeId FROM dbo.scheduleType WHERE scheduleType = N'Daily'),
        N'employee1',
        N'employee123',
        N'9876500002',
        N'+91',
        N'Engineering',
        2,
        N'Anita Sharma',
        (SELECT EmpID FROM dbo.users WHERE EmpUsername = N'manager1'),
        N'employee1@example.com'
    );
END;
GO

IF NOT EXISTS (SELECT 1 FROM dbo.users WHERE EmpUsername = N'employee2')
BEGIN
    INSERT INTO dbo.users (
        EmpCompany,
        EmpDesignation,
        EmpFirstName,
        EmpLastName,
        EmpFullName,
        EmpUserTypeID,
        EmpScheduleTypeID,
        EmpUsername,
        EmpPassword,
        EmpContact,
        EmpContactCountry,
        EmpDept,
        EmpDeptID,
        EmpReportingManager,
        EmpReportingManagerID,
        EmpEmail
    )
    VALUES (
        N'Pranav Systems',
        N'Employee',
        N'Sneha',
        N'Roy',
        N'Sneha Roy',
        (SELECT userTypeId FROM dbo.userType WHERE userType = N'Corporate'),
        (SELECT scheduleTypeId FROM dbo.scheduleType WHERE scheduleType = N'Weekly'),
        N'employee2',
        N'employee234',
        N'9876500003',
        N'+91',
        N'HR',
        3,
        N'Anita Sharma',
        (SELECT EmpID FROM dbo.users WHERE EmpUsername = N'manager1'),
        N'employee2@example.com'
    );
END;
GO

IF NOT EXISTS (SELECT 1 FROM dbo.users WHERE EmpUsername = N'govuser1')
BEGIN
    INSERT INTO dbo.users (
        EmpCompany,
        EmpDesignation,
        EmpFirstName,
        EmpLastName,
        EmpFullName,
        EmpUserTypeID,
        EmpScheduleTypeID,
        EmpUsername,
        EmpPassword,
        EmpContact,
        EmpContactCountry,
        EmpDept,
        EmpDeptID,
        EmpReportingManager,
        EmpReportingManagerID,
        EmpEmail
    )
    VALUES (
        N'Public Services',
        N'Coordinator',
        N'Arjun',
        N'Singh',
        N'Arjun Singh',
        (SELECT userTypeId FROM dbo.userType WHERE userType = N'Government'),
        (SELECT scheduleTypeId FROM dbo.scheduleType WHERE scheduleType = N'Monthly'),
        N'govuser1',
        N'gov123',
        N'9876500004',
        N'+91',
        N'Operations',
        4,
        N'Pranav Kumar',
        (SELECT EmpID FROM dbo.users WHERE EmpUsername = N'owner1'),
        N'govuser1@example.com'
    );
END;
GO

SELECT
    u.EmpID,
    u.EmpFullName,
    u.EmpDesignation,
    ut.userType AS EmpUserType,
    st.scheduleType AS EmpScheduleType,
    u.EmpUsername,
    u.EmpDept,
    u.EmpReportingManager,
    u.EmpEmail
FROM dbo.users u
LEFT JOIN dbo.userType ut
    ON u.EmpUserTypeID = ut.userTypeId
LEFT JOIN dbo.scheduleType st
    ON u.EmpScheduleTypeID = st.scheduleTypeId
ORDER BY u.EmpID;
GO
