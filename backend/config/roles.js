export const rolePermissions = {
  super_admin: [
    "manage_admins",
    "manage_users",
    "manage_jobs",
    "manage_employers",
    "approve_jobs",
    "approve_employers",
    "view_analytics",
    "manage_roles",
    "manage_settings",
    "view_reports"
  ],

  sector_admin: [
    "approve_jobs",
    "approve_employers",
    "manage_jobs",
    "view_analytics",
    "view_reports"
  ],

  employer_manager: [
    "manage_jobs",
    "manage_employers",
    "approve_jobs"
  ],

  moderator: [
    "manage_jobs"
  ],

  support: [
    "manage_users"
  ]
};