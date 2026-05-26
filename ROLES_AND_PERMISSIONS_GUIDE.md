# Roles & Permissions System - Complete Documentation

## Overview
Resumatch implements a comprehensive role-based access control (RBAC) system for three user types:
1. **Admins** - System administrators with hierarchical roles
2. **Employers** - Company representatives posting jobs
3. **Job Seekers** - Users applying for positions

---

## 1. ADMIN ROLES & PERMISSIONS

### Admin Role Hierarchy (Top to Bottom)

#### Super Admin (Level 5)
**Full system access and control**

**Permissions:**
- `create_admin` - Create new admin accounts
- `view_all_admins` - See all admin users
- `edit_admin` - Modify admin profiles
- `delete_admin` - Remove admin accounts
- `change_admin_role` - Update admin roles
- `assign_permissions` - Assign specific permissions to admins
- `view_all_users` - Access all job seeker accounts
- `suspend_user` - Temporarily disable user accounts
- `delete_user` - Remove user accounts permanently
- `verify_user_documents` - Approve/reject user documents
- `view_all_employers` - See all employer accounts
- `approve_employer` - Approve employer registrations
- `reject_employer` - Decline employer applications
- `suspend_employer` - Temporarily disable employers
- `delete_employer` - Remove employer accounts
- `view_all_jobs` - See all job postings
- `approve_job` - Publish approved jobs
- `reject_job` - Decline job postings
- `remove_job` - Delete job listings
- `edit_job` - Modify job postings
- `view_analytics` - Access system analytics dashboard
- `view_reports` - Generate system reports
- `export_data` - Download data exports
- `view_system_logs` - Access activity logs
- `manage_settings` - Configure system settings
- `manage_roles` - Create/edit role definitions
- `manage_categories` - Add/update job categories
- `manage_system_config` - Configure system parameters

#### Sector Admin (Level 4)
**Sector-specific job and employer management**

**Permissions:**
- `view_sector_jobs` - View jobs in assigned sector
- `approve_job` - Approve sector jobs
- `reject_job` - Reject sector jobs
- `view_sector_employers` - See sector employers
- `approve_employer` - Approve employers in sector
- `reject_employer` - Reject employer applications
- `view_sector_analytics` - View sector-specific analytics
- `view_sector_reports` - Generate sector reports
- `manage_sector_jobs` - Edit/manage sector jobs

#### Employer Manager (Level 3)
**Employer and job oversight**

**Permissions:**
- `manage_all_jobs` - Manage all job postings
- `approve_job` - Approve jobs
- `reject_job` - Reject jobs
- `manage_employers` - Manage employer accounts
- `view_all_employers` - See all employers

#### Moderator (Level 2)
**Content moderation and enforcement**

**Permissions:**
- `view_jobs` - View job postings
- `manage_jobs` - Manage job content
- `flag_job` - Flag inappropriate jobs
- `remove_job` - Remove jobs for violations

#### Support Staff (Level 1)
**User support and assistance**

**Permissions:**
- `view_users` - View user accounts
- `manage_users` - Manage user settings
- `view_user_tickets` - See support tickets
- `respond_to_tickets` - Reply to user tickets

---

## 2. EMPLOYER ROLES & PERMISSIONS

### Employer Role

**Used by:** Company representatives, HR managers, recruiters

**Permissions:**

**Profile Management:**
- `edit_own_profile` - Update company information
- `upload_documents` - Submit company documents
- `view_own_profile` - View company profile

**Job Posting:**
- `create_job` - Create new job listings
- `view_own_jobs` - See their job postings
- `edit_own_job` - Modify existing jobs
- `delete_own_job` - Remove job listings
- `publish_job` - Make jobs public
- `draft_job` - Save as draft

**Application Management:**
- `view_applications` - See applications to jobs
- `review_application` - Evaluate applications
- `accept_application` - Accept candidates
- `reject_application` - Decline candidates
- `message_applicant` - Contact applicants
- `view_applicant_resume` - See candidate resumes

**Analytics:**
- `view_job_analytics` - Job posting statistics
- `view_application_stats` - Application metrics

**Settings:**
- `manage_notification_settings` - Configure alerts
- `manage_job_preferences` - Set default options

---

## 3. JOB SEEKER ROLES & PERMISSIONS

### User Role (Job Seeker)

**Used by:** Job applicants, freelancers, candidates

**Permissions:**

**Profile Management:**
- `edit_own_profile` - Update personal information
- `upload_resume` - Upload resume/CV
- `upload_documents` - Submit identification/certificates
- `view_own_profile` - View profile
- `update_skills` - Add/edit skills

**Job Search:**
- `view_jobs` - Browse job listings
- `search_jobs` - Search by keyword
- `filter_jobs` - Apply filters (location, salary, etc.)
- `view_job_details` - See full job description

**Applications:**
- `apply_for_job` - Submit applications
- `view_own_applications` - See application history
- `withdraw_application` - Cancel applications
- `view_application_status` - Check application progress

**Saved Jobs:**
- `save_job` - Bookmark jobs
- `unsave_job` - Remove bookmarks
- `view_saved_jobs` - View bookmarks

**Recommendations:**
- `view_job_recommendations` - See AI-matched jobs
- `view_similarity_score` - See job match percentage

**Notifications:**
- `manage_notification_settings` - Configure alerts
- `view_notifications` - Check notifications

**Profile Completion:**
- `complete_profile` - Update profile status
- `verify_documents` - Submit documents for verification

---

## API ENDPOINTS

### Get All Roles with Permissions
```
GET /api/role/admin/all
Headers: Authorization: Bearer {token}
Permission Required: manage_roles
Response: All roles with their permissions
```

### Get Specific Role Details
```
GET /api/role/:roleName
Response: Role description, type, and permissions
```

### Assign Role to Admin
```
POST /api/role/admin/assign/:adminId
Headers: Authorization: Bearer {token}
Body: { "role": "sector_admin" }
Permission Required: change_admin_role
```

### Update Admin Permissions
```
PUT /api/role/admin/permissions/:adminId
Headers: Authorization: Bearer {token}
Body: { "permissions": ["approve_job", "reject_job"] }
Permission Required: assign_permissions
```

### Get All Admins with Roles
```
GET /api/role/admin/list
Headers: Authorization: Bearer {token}
Permission Required: view_all_admins
Response: All admins with role and permission details
```

### Verify Permission
```
POST /api/role/admin/verify-permission
Headers: Authorization: Bearer {token}
Body: { "role": "employer", "permission": "create_job" }
Permission Required: manage_roles
Response: { "role": "employer", "permission": "create_job", "hasPermission": true }
```

---

## MIDDLEWARE USAGE

### Admin Permission Check
```javascript
import { checkAdminPermission } from "./middleware/checkPermissionUniversal.js";

// In routes:
router.post('/approve-job', 
  checkAdminPermission("approve_job"),
  approveJobController
);
```

### Employer Permission Check
```javascript
import { checkEmployerPermission } from "./middleware/checkPermissionUniversal.js";

router.post('/create-job',
  checkEmployerPermission("create_job"),
  createJobController
);
```

### User Permission Check
```javascript
import { checkUserJobSeekerPermission } from "./middleware/checkPermissionUniversal.js";

router.post('/apply-job',
  checkUserJobSeekerPermission("apply_for_job"),
  applyJobController
);
```

---

## UTILITY FUNCTIONS

### Import from permissionHelper.js

```javascript
import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getPermissions,
  getRolesByType,
  isRoleType,
  hasHigherHierarchy,
  getRoleLevel,
  isValidRole,
  getRoleDescription
} from "./utils/permissionHelper.js";
```

### Examples

```javascript
// Check single permission
if (hasPermission("employer", "create_job")) {
  // User can create jobs
}

// Check multiple permissions (ANY)
if (hasAnyPermission("moderator", ["remove_job", "flag_job"])) {
  // User has at least one of these
}

// Check multiple permissions (ALL)
if (hasAllPermissions("super_admin", ["approve_job", "approve_employer"])) {
  // User has all of these
}

// Get all permissions for a role
const permissions = getPermissions("sector_admin");

// Get roles by type
const adminRoles = getRolesByType("admin");
const employerRoles = getRolesByType("employer");
const userRoles = getRolesByType("user");

// Check role type
if (isRoleType("employer", "employer")) {
  // This is an employer role
}

// Check admin hierarchy
if (hasHigherHierarchy("super_admin", "moderator")) {
  // Super admin has higher level
}

// Get role level
const level = getRoleLevel("sector_admin"); // Returns 4

// Validate role
if (isValidRole("invalid_role")) {
  // Role exists
}

// Get role description
const desc = getRoleDescription("employer");
// Returns: "Employer - Company job posting and management"
```

---

## IMPLEMENTATION GUIDE

### Step 1: Assign Roles During Registration

**For Admin:**
```javascript
const admin = await Admin.create({
  name, email, password,
  role: "moderator", // Assign initial role
  permissions: getPermissions("moderator")
});
```

**For Employer:**
```javascript
const employer = await Employer.create({
  companyName, email, password,
  role: "employer" // Fixed role
});
```

**For User:**
```javascript
const user = await User.create({
  name, email, password,
  role: "user" // Fixed role
});
```

### Step 2: Protect Routes with Permissions

```javascript
// Admin routes
router.put("/approve-job/:jobId",
  checkAdminPermission("approve_job"),
  approveJobHandler
);

// Employer routes
router.post("/jobs",
  checkEmployerPermission("create_job"),
  createJobHandler
);

// User routes
router.post("/apply",
  checkUserJobSeekerPermission("apply_for_job"),
  applyHandler
);
```

### Step 3: Log Permission Changes

```javascript
import { logAction } from "./controllers/adminController.js";

await logAction(
  "Assign Admin Role",
  `Assigned role ${role} to admin ${admin.email}`,
  req,
  "admin",
  admin._id
);
```

---

## SECURITY BEST PRACTICES

1. **Always verify permissions** before sensitive operations
2. **Use middleware** to enforce permissions automatically
3. **Log all permission changes** for audit trail
4. **Check user status** - only active users can act
5. **Validate roles** before assignment
6. **Use hierarchies** - higher roles inherit lower permissions
7. **Update permissions** only by authorized admins
8. **Review logs** periodically for suspicious activity

---

## COMMON USE CASES

### Approve a Job (Admin Only)
```javascript
// Middleware ensures user has "approve_job" permission
// Only admins/sector_admins have this

router.put("/admin/jobs/:jobId/approve",
  checkAdminPermission("approve_job"),
  async (req, res) => {
    // User confirmed to have permission
    // Proceed with approval logic
  }
);
```

### Post a Job (Employer Only)
```javascript
// Only employers have "create_job" permission
router.post("/jobs",
  checkEmployerPermission("create_job"),
  async (req, res) => {
    // Create job
  }
);
```

### Apply for Job (User Only)
```javascript
// Only users have "apply_for_job" permission
router.post("/applications",
  checkUserJobSeekerPermission("apply_for_job"),
  async (req, res) => {
    // Process application
  }
);
```

### Suspend User (Super Admin Only)
```javascript
// Only super_admin has "suspend_user" permission
router.post("/admin/users/:userId/suspend",
  checkAdminPermission("suspend_user"),
  async (req, res) => {
    // Suspend user
  }
);
```

---

## TESTING ROLES

### Test Super Admin Access
```bash
curl -X GET http://localhost:5000/api/role/admin/all \
  -H "Authorization: Bearer {super_admin_token}"
# Should succeed with all roles
```

### Test Permission Denial
```bash
curl -X POST http://localhost:5000/admin/jobs/approve \
  -H "Authorization: Bearer {moderator_token}"
# Should return 403 Permission denied
```

---

## DATABASE FIELDS

### Admin Model
- `role` - String enum: [super_admin, sector_admin, employer_manager, moderator, support]
- `permissions` - Array of permission strings
- `sector` - Sector name (for sector_admin)
- `status` - active/inactive/pending

### Employer Model
- `role` - Fixed to "employer"
- `status` - approved/rejected/pending

### User Model
- `role` - Fixed to "user"
- `status` - active/inactive/pending

---

## MIGRATION GUIDE

If upgrading from previous system:

1. Update all admin documents with new permissions based on role
2. Update all routes to use new middleware
3. Test all permission scenarios
4. Update frontend to show new role descriptions
5. Document any custom permissions specific to your deployment
