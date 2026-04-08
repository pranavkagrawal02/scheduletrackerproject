Table redesign workspace

Workflow:
- Create one folder per table inside `database/redesign-tables/`.
- Folder name should match the table name.
- Add each new SQL draft as a new file in that table folder.
- Use numbered file names such as `01-create.sql`, `02-alter.sql`, `03-seed.sql`.
- Do not overwrite older SQL drafts unless we explicitly want cleanup.

Example:
- `database/redesign-tables/users/01-create.sql`
- `database/redesign-tables/users/02-seed.sql`
- `database/redesign-tables/projects/01-create.sql`
