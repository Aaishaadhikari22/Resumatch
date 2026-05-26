/**
 * Role-based Permission Configuration
 * Defines all permissions for each role across the system
 */
export const rolePermissions = {
  // ============================================
  // ADMIN ROLES
  // ============================================
  super_admin: [
    // Admin Management
    "create_admin",
    "view_all_admins",
    "edit_admin",
    "delete_admin",
    "change_admin_role",
    "assign_permissions",
    "manage_admins",
    
    // User Management
    "view_all_users",
    "suspend_user",
    "delete_user",
    "verify_user_documents",
    "manage_users",
    
    // Employer Management
    "view_all_employers",
    "approve_employer",
    "reject_employer",
    "suspend_employer",
    "delete_employer",
    "manage_employers",
    "approve_employers",
    
    // Job Management
    "view_all_jobs",
    "approve_job",
    "reject_job",
    "remove_job",
    "edit_job",
    "manage_jobs",
    "manage_all_jobs",
    
    // Analytics & Reports
    "view_analytics",
    "view_reports",
    "export_data",
    "view_system_logs",
    
    // System Settings
    "manage_settings",
    "manage_roles",
    "manage_categories",
    "manage_system_config",
  ],

  sector_admin: [
    // Admin Management
    "manage_admins",
    
    // Job Approval
    "view_sector_jobs",
    "approve_job",
    "reject_job",
    "manage_jobs",
    
    // Employer Approval
    "view_sector_employers",
    "approve_employer",
    "reject_employer",
    "manage_employers",
    "approve_employers",
    
    // Analytics
    "view_sector_analytics",
    "view_sector_reports",
    "view_analytics",
    
    // Job Management
    "manage_sector_jobs",
  ],

  employer_manager: [
    // Admin Management
    "manage_admins",
    
    // Job Management
    "manage_all_jobs",
    "manage_jobs",
    "approve_job",
    "reject_job",
    
    // Employer Management
    "manage_employers",
    "view_all_employers",
    "approve_employers",
  ],

  moderator: [
    // Job Moderation
    "view_jobs",
    "manage_jobs",
    "flag_job",
    "remove_job",
  ],

  support: [
    // User Support
    "view_users",
    "manage_users",
    "view_user_tickets",
    "respond_to_tickets",
  ],

  // ============================================
  // EMPLOYER ROLES
  // ============================================
  employer: [
    // Profile Management
    "edit_own_profile",
    "upload_documents",
    "view_own_profile",
    
    // Job Posting
    "create_job",
    "view_own_jobs",
    "edit_own_job",
    "delete_own_job",
    "publish_job",
    "draft_job",
    
    // Application Management
    "view_applications",
    "review_application",
    "accept_application",
    "reject_application",
    "message_applicant",
    "view_applicant_resume",
    
    // Analytics
    "view_job_analytics",
    "view_application_stats",
    
    // Settings
    "manage_notification_settings",
    "manage_job_preferences",
  ],

  // ============================================
  // JOB SEEKER ROLES
  // ============================================
  user: [
    // Profile Management
    "edit_own_profile",
    "upload_resume",
    "upload_documents",
    "view_own_profile",
    "update_skills",
    
    // Job Search
    "view_jobs",
    "search_jobs",
    "filter_jobs",
    "view_job_details",
    
    // Applications
    "apply_for_job",
    "view_own_applications",
    "withdraw_application",
    "view_application_status",
    
    // Saved Jobs
    "save_job",
    "unsave_job",
    "view_saved_jobs",
    
    // Recommendations
    "view_job_recommendations",
    "view_similarity_score",
    
    // Notifications
    "manage_notification_settings",
    "view_notifications",
    
    // Profile Completion
    "complete_profile",
    "verify_documents",
  ]
};

/**
 * Role hierarchy for escalation and delegation
 * Higher roles can perform actions of lower roles
 */
export const roleHierarchy = {
  admin: {
    super_admin: 5,
    sector_admin: 4,
    employer_manager: 3,
    moderator: 2,
    support: 1
  },
  employer: {
    employer: 1
  },
  user: {
    user: 1
  }
};

/**
 * Get all roles
 */
export const getAllRoles = () => Object.keys(rolePermissions);

/**
 * Categorize roles by type
 */
export const rolesByType = {
  admin: ["super_admin", "sector_admin", "employer_manager", "moderator", "support"],
  employer: ["employer"],
  user: ["user"]
};