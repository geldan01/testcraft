// =============================================================================
// ENUMS
// =============================================================================

export type AuthProvider = 'EMAIL' | 'GOOGLE' | 'FACEBOOK'

export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'PENDING_INVITATION'

export type OrganizationRole =
  | 'ORGANIZATION_MANAGER'
  | 'PROJECT_MANAGER'
  | 'PRODUCT_OWNER'
  | 'QA_ENGINEER'
  | 'DEVELOPER'

export type ObjectType =
  | 'TEST_SUITE'
  | 'TEST_PLAN'
  | 'TEST_CASE'
  | 'TEST_RUN'
  | 'REPORT'

export type RbacAction = 'READ' | 'EDIT' | 'DELETE'

export type TestType = 'STEP_BASED' | 'GHERKIN'

export type TestRunStatus =
  | 'NOT_RUN'
  | 'IN_PROGRESS'
  | 'PASS'
  | 'FAIL'
  | 'BLOCKED'
  | 'SKIPPED'

export type CommentableType = 'TEST_CASE' | 'TEST_RUN'

export type ActivityActionType = 'CREATED' | 'UPDATED' | 'DELETED'

// =============================================================================
// CORE MODELS
// =============================================================================

export interface User {
  id: string
  email: string
  name: string
  avatarUrl: string | null
  authProvider: AuthProvider
  isAdmin: boolean
  status: UserStatus
  createdAt: string
  updatedAt: string
}

export interface Organization {
  id: string
  name: string
  maxProjects: number
  maxTestCasesPerProject: number
  createdAt: string
  updatedAt: string
  members?: OrganizationMember[]
  projects?: Project[]
  _count?: {
    members: number
    projects: number
  }
}

export interface OrganizationMember {
  id: string
  organizationId: string
  userId: string
  role: OrganizationRole
  joinedAt: string
  user?: User
  organization?: Organization
}

export interface RbacPermission {
  id: string
  organizationId: string
  role: OrganizationRole
  objectType: ObjectType
  action: RbacAction
  allowed: boolean
}

export interface Project {
  id: string
  name: string
  description: string | null
  organizationId: string
  createdAt: string
  updatedAt: string
  organization?: Organization
  _count?: {
    testCases: number
    testPlans: number
    testSuites: number
    members: number
  }
}

export interface ProjectMember {
  id: string
  projectId: string
  userId: string
  user?: User
  project?: Project
}

// =============================================================================
// TEST MANAGEMENT MODELS
// =============================================================================

export interface TestPlan {
  id: string
  name: string
  description: string | null
  projectId: string
  scope: string | null
  schedule: string | null
  testTypes: string | null
  entryCriteria: string | null
  exitCriteria: string | null
  createdAt: string
  updatedAt: string
  createdById: string
  createdBy?: User
  testCases?: TestPlanCase[]
  _count?: {
    testCases: number
  }
}

export interface TestSuite {
  id: string
  name: string
  description: string | null
  projectId: string
  suiteType: string
  createdAt: string
  updatedAt: string
  createdById: string
  createdBy?: User
  testCases?: TestSuiteCase[]
  _count?: {
    testCases: number
  }
}

export interface TestStep {
  stepNumber: number
  action: string
  data: string
  expectedResult: string
}

export interface TestCase {
  id: string
  name: string
  description: string | null
  projectId: string
  preconditions: string[] | null
  testType: TestType
  steps: TestStep[] | null
  gherkinSyntax: string | null
  debugFlag: boolean
  debugFlaggedAt: string | null
  debugFlaggedById: string | null
  lastRunStatus: TestRunStatus
  lastRunAt: string | null
  createdAt: string
  updatedAt: string
  createdById: string
  createdBy?: User
  debugFlaggedBy?: User | null
  testPlans?: TestPlanCase[]
  testSuites?: TestSuiteCase[]
  testRuns?: TestRun[]
  attachments?: Attachment[]
}

export interface TestPlanCase {
  id: string
  testPlanId: string
  testCaseId: string
  testPlan?: TestPlan
  testCase?: TestCase
}

export interface TestSuiteCase {
  id: string
  testSuiteId: string
  testCaseId: string
  testSuite?: TestSuite
  testCase?: TestCase
}

export interface TestRun {
  id: string
  testCaseId: string
  executedById: string
  executedAt: string
  environment: string
  status: TestRunStatus
  duration: number | null
  notes: string | null
  createdAt: string
  updatedAt: string
  testCase?: TestCase
  executedBy?: User
  attachments?: Attachment[]
}

export interface Attachment {
  id: string
  fileUrl: string
  fileName: string
  fileType: string
  fileSize: number
  uploadedById: string
  testRunId: string | null
  testCaseId: string | null
  createdAt: string
  uploadedBy?: User
}

export interface Comment {
  id: string
  content: string
  authorId: string
  commentableType: CommentableType
  commentableId: string
  createdAt: string
  updatedAt: string
  author?: User
}

export interface ActivityLog {
  id: string
  userId: string
  actionType: ActivityActionType
  objectType: string
  objectId: string
  changes: Record<string, unknown> | null
  timestamp: string
  user?: User
}

// =============================================================================
// API REQUEST / RESPONSE TYPES
// =============================================================================

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  name: string
  email: string
  password: string
}

export interface AuthResponse {
  user: User
  token: string
}

export interface ApiResponse<T> {
  data: T
  message?: string
}

export interface ApiErrorResponse {
  statusCode: number
  message: string
  errors?: Record<string, string[]>
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// =============================================================================
// FORM INPUT TYPES
// =============================================================================

export interface CreateOrganizationInput {
  name: string
}

export interface UpdateOrganizationInput {
  name?: string
  maxProjects?: number
  maxTestCasesPerProject?: number
}

export interface CreateProjectInput {
  name: string
  description?: string
  organizationId: string
}

export interface UpdateProjectInput {
  name?: string
  description?: string
}

export interface CreateTestPlanInput {
  name: string
  description?: string
  projectId: string
  scope?: string
  schedule?: string
  testTypes?: string
  entryCriteria?: string
  exitCriteria?: string
}

export interface UpdateTestPlanInput {
  name?: string
  description?: string
  scope?: string
  schedule?: string
  testTypes?: string
  entryCriteria?: string
  exitCriteria?: string
}

export interface CreateTestSuiteInput {
  name: string
  description?: string
  projectId: string
  suiteType: string
}

export interface UpdateTestSuiteInput {
  name?: string
  description?: string
  suiteType?: string
}

export interface CreateTestCaseInput {
  name: string
  description?: string
  projectId: string
  preconditions?: string[]
  testType: TestType
  steps?: TestStep[]
  gherkinSyntax?: string
}

export interface UpdateTestCaseInput {
  name?: string
  description?: string
  preconditions?: string[]
  testType?: TestType
  steps?: TestStep[]
  gherkinSyntax?: string
}

export interface CreateTestRunInput {
  testCaseId: string
  environment: string
  status: TestRunStatus
  duration?: number
  notes?: string
}

export interface UpdateTestRunInput {
  status?: TestRunStatus
  duration?: number
  notes?: string
}

export interface CreateCommentInput {
  content: string
  commentableType: CommentableType
  commentableId: string
}

export interface InviteMemberInput {
  email: string
  role: OrganizationRole
}

// =============================================================================
// ATTACHMENT INPUT TYPES
// =============================================================================

export interface CreateAttachmentInput {
  file: File
  testRunId?: string
  testCaseId?: string
}

// =============================================================================
// TEST RUN START/COMPLETE TYPES
// =============================================================================

export interface StartTestRunInput {
  testCaseId: string
  environment: string
}

export interface CompleteTestRunInput {
  status: 'PASS' | 'FAIL' | 'BLOCKED' | 'SKIPPED'
  notes?: string
  duration?: number
}

// =============================================================================
// DEBUG FLAG TYPES
// =============================================================================

export interface ToggleDebugFlagInput {
  comment?: string
}

// =============================================================================
// ENVIRONMENT TYPES
// =============================================================================

export interface EnvironmentOption {
  label: string
  value: string
  color?: string
}

// =============================================================================
// FILTER TYPES
// =============================================================================

export interface TestCaseFilters {
  status?: TestRunStatus
  testType?: TestType
  debugFlag?: boolean
  search?: string
  page?: number
  limit?: number
}

export interface TestRunFilters {
  status?: TestRunStatus
  environment?: string
  dateFrom?: string
  dateTo?: string
  page?: number
  limit?: number
}

// =============================================================================
// DASHBOARD TYPES
// =============================================================================

export interface DashboardStats {
  totalTestCases: number
  passRate: number
  recentRuns: number
  debugFlagged: number
}

export interface QuickStat {
  label: string
  value: string | number
  icon: string
  trend?: {
    value: number
    direction: 'up' | 'down' | 'neutral'
  }
  color?: string
}

// =============================================================================
// NAVIGATION TYPES
// =============================================================================

export interface NavigationItem {
  label: string
  icon: string
  to: string
  badge?: string | number
}

export interface BreadcrumbItem {
  label: string
  to?: string
  icon?: string
}
