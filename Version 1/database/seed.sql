insert into users (id, name, role, type) values
  (1, 'Pranav', 'Program owner', 'Individual'),
  (2, 'Delivery Cell', 'Execution team', 'Team'),
  (3, 'Civic Admin Office', 'Department sponsor', 'Government')
on conflict (id) do nothing;

insert into projects (id, name, owner_id, status) values
  (1, 'Schedule Tracker Rollout', 1, 'On track'),
  (2, 'Attendance Policy Review', 3, 'At risk'),
  (3, 'Meeting Notes Archive', 2, 'Completed')
on conflict (id) do nothing;

insert into holidays (id, name, used, total) values
  (1, 'Annual leave', 9, 18),
  (2, 'Sick leave', 3, 10),
  (3, 'Casual leave', 4, 8),
  (4, 'Restricted holiday', 1, 3),
  (5, 'Compensatory off', 2, 5)
on conflict (id) do nothing;

insert into todos (id, text, done) values
  (1, 'Finalize monthly leave policy draft', false),
  (2, 'Update project Alpha schedule', true),
  (3, 'Send meeting summary to stakeholders', false)
on conflict (id) do nothing;

insert into meetings (id, title, meta, notes) values
  (1, 'Daily Operations Standup', '09:00 AM | Core team | 20 min', 'Review yesterday''s blockers.
Confirm today''s critical tasks.
Update any leave or meeting conflicts.'),
  (2, 'Weekly Project Governance', 'Tuesday | PMO and department leads', 'Track milestone drift.
Review risk register.
Confirm decisions and owners.'),
  (3, 'Holiday and Workforce Review', 'Thursday | HR and team managers', 'Approve pending leave.
Check holiday type allocations.
Resolve overlap in staffing schedules.')
on conflict (id) do nothing;

insert into schedules (id, range, day, title, note, color) values
  (1, 'weekly', 'Tue', 'Design workshop', 'Phase 2 planning', '#61b15a'),
  (2, 'weekly', 'Thu', 'Release prep', 'Portal upgrade', '#2563eb'),
  (3, 'monthly', 'Week 4', 'Holiday balance review', 'Carry forward planning', '#0f8b8d')
on conflict (id) do nothing;

insert into finances (id, project_id, type, amount, status, note) values
  (1, 1, 'Budget', 150000, 'Approved', 'Initial platform implementation budget'),
  (2, 2, 'Expense', 42000, 'Pending', 'Policy review and documentation support')
on conflict (id) do nothing;
