import { PrismaClient, AuthProvider, UserStatus, OrganizationRole, ObjectType, RbacAction, TestType, TestRunStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // ============================================================================
  // 1. ADMIN USER
  // ============================================================================
  console.log('Creating admin user...')
  const adminPasswordHash = await bcrypt.hash('Admin123!', 10)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@testcraft.io' },
    update: {},
    create: {
      email: 'admin@testcraft.io',
      passwordHash: adminPasswordHash,
      name: 'System Administrator',
      authProvider: AuthProvider.EMAIL,
      isAdmin: true,
      status: UserStatus.ACTIVE,
    },
  })
  console.log(`✓ Admin user created: ${admin.email}`)

  // Create additional test users
  const qaEngineerPasswordHash = await bcrypt.hash('QATest123!', 10)
  const qaEngineer = await prisma.user.upsert({
    where: { email: 'qa@testcraft.io' },
    update: {},
    create: {
      email: 'qa@testcraft.io',
      passwordHash: qaEngineerPasswordHash,
      name: 'QA Engineer',
      authProvider: AuthProvider.EMAIL,
      isAdmin: false,
      status: UserStatus.ACTIVE,
    },
  })

  const developerPasswordHash = await bcrypt.hash('DevTest123!', 10)
  const developer = await prisma.user.upsert({
    where: { email: 'dev@testcraft.io' },
    update: {},
    create: {
      email: 'dev@testcraft.io',
      passwordHash: developerPasswordHash,
      name: 'Developer',
      authProvider: AuthProvider.EMAIL,
      isAdmin: false,
      status: UserStatus.ACTIVE,
    },
  })

  // ============================================================================
  // 2. ORGANIZATION
  // ============================================================================
  console.log('Creating demo organization...')
  const organization = await prisma.organization.upsert({
    where: { id: 'demo-org-id' },
    update: {},
    create: {
      id: 'demo-org-id',
      name: 'TestCraft Demo Org',
      maxProjects: 10,
      maxTestCasesPerProject: 1000,
    },
  })
  console.log(`✓ Organization created: ${organization.name}`)

  // ============================================================================
  // 3. ORGANIZATION MEMBERS
  // ============================================================================
  console.log('Adding organization members...')
  await prisma.organizationMember.upsert({
    where: {
      organizationId_userId: {
        organizationId: organization.id,
        userId: admin.id,
      },
    },
    update: {},
    create: {
      organizationId: organization.id,
      userId: admin.id,
      role: OrganizationRole.ORGANIZATION_MANAGER,
    },
  })

  await prisma.organizationMember.upsert({
    where: {
      organizationId_userId: {
        organizationId: organization.id,
        userId: qaEngineer.id,
      },
    },
    update: {},
    create: {
      organizationId: organization.id,
      userId: qaEngineer.id,
      role: OrganizationRole.QA_ENGINEER,
    },
  })

  await prisma.organizationMember.upsert({
    where: {
      organizationId_userId: {
        organizationId: organization.id,
        userId: developer.id,
      },
    },
    update: {},
    create: {
      organizationId: organization.id,
      userId: developer.id,
      role: OrganizationRole.DEVELOPER,
    },
  })
  console.log('✓ Organization members added')

  // ============================================================================
  // 4. RBAC PERMISSIONS
  // ============================================================================
  console.log('Setting up RBAC permissions...')

  const roles = [
    OrganizationRole.ORGANIZATION_MANAGER,
    OrganizationRole.PROJECT_MANAGER,
    OrganizationRole.PRODUCT_OWNER,
    OrganizationRole.QA_ENGINEER,
    OrganizationRole.DEVELOPER,
  ]

  const objectTypes = [
    ObjectType.TEST_SUITE,
    ObjectType.TEST_PLAN,
    ObjectType.TEST_CASE,
    ObjectType.TEST_RUN,
    ObjectType.REPORT,
  ]

  const actions = [RbacAction.READ, RbacAction.EDIT, RbacAction.DELETE]

  // Default permissions matrix
  const permissionsMatrix: Record<OrganizationRole, Record<ObjectType, Record<RbacAction, boolean>>> = {
    [OrganizationRole.ORGANIZATION_MANAGER]: {
      [ObjectType.TEST_SUITE]: { READ: true, EDIT: true, DELETE: true },
      [ObjectType.TEST_PLAN]: { READ: true, EDIT: true, DELETE: true },
      [ObjectType.TEST_CASE]: { READ: true, EDIT: true, DELETE: true },
      [ObjectType.TEST_RUN]: { READ: true, EDIT: true, DELETE: true },
      [ObjectType.REPORT]: { READ: true, EDIT: true, DELETE: true },
    },
    [OrganizationRole.PROJECT_MANAGER]: {
      [ObjectType.TEST_SUITE]: { READ: true, EDIT: true, DELETE: true },
      [ObjectType.TEST_PLAN]: { READ: true, EDIT: true, DELETE: true },
      [ObjectType.TEST_CASE]: { READ: true, EDIT: true, DELETE: true },
      [ObjectType.TEST_RUN]: { READ: true, EDIT: true, DELETE: false },
      [ObjectType.REPORT]: { READ: true, EDIT: true, DELETE: false },
    },
    [OrganizationRole.PRODUCT_OWNER]: {
      [ObjectType.TEST_SUITE]: { READ: true, EDIT: true, DELETE: false },
      [ObjectType.TEST_PLAN]: { READ: true, EDIT: true, DELETE: false },
      [ObjectType.TEST_CASE]: { READ: true, EDIT: true, DELETE: false },
      [ObjectType.TEST_RUN]: { READ: true, EDIT: false, DELETE: false },
      [ObjectType.REPORT]: { READ: true, EDIT: false, DELETE: false },
    },
    [OrganizationRole.QA_ENGINEER]: {
      [ObjectType.TEST_SUITE]: { READ: true, EDIT: true, DELETE: false },
      [ObjectType.TEST_PLAN]: { READ: true, EDIT: true, DELETE: false },
      [ObjectType.TEST_CASE]: { READ: true, EDIT: true, DELETE: false },
      [ObjectType.TEST_RUN]: { READ: true, EDIT: true, DELETE: true },
      [ObjectType.REPORT]: { READ: true, EDIT: false, DELETE: false },
    },
    [OrganizationRole.DEVELOPER]: {
      [ObjectType.TEST_SUITE]: { READ: true, EDIT: false, DELETE: false },
      [ObjectType.TEST_PLAN]: { READ: true, EDIT: false, DELETE: false },
      [ObjectType.TEST_CASE]: { READ: true, EDIT: false, DELETE: false },
      [ObjectType.TEST_RUN]: { READ: true, EDIT: true, DELETE: false },
      [ObjectType.REPORT]: { READ: true, EDIT: false, DELETE: false },
    },
  }

  for (const role of roles) {
    for (const objectType of objectTypes) {
      for (const action of actions) {
        const allowed = permissionsMatrix[role][objectType][action]
        await prisma.rbacPermission.upsert({
          where: {
            organizationId_role_objectType_action: {
              organizationId: organization.id,
              role,
              objectType,
              action,
            },
          },
          update: { allowed },
          create: {
            organizationId: organization.id,
            role,
            objectType,
            action,
            allowed,
          },
        })
      }
    }
  }
  console.log('✓ RBAC permissions configured')

  // ============================================================================
  // 5. PROJECT
  // ============================================================================
  console.log('Creating demo project...')
  const project = await prisma.project.upsert({
    where: { id: 'demo-project-id' },
    update: {},
    create: {
      id: 'demo-project-id',
      name: 'Demo Project',
      description: 'A sample project to demonstrate TestCraft capabilities',
      organizationId: organization.id,
    },
  })
  console.log(`✓ Project created: ${project.name}`)

  // Add project members
  await prisma.projectMember.upsert({
    where: {
      projectId_userId: {
        projectId: project.id,
        userId: admin.id,
      },
    },
    update: {},
    create: {
      projectId: project.id,
      userId: admin.id,
    },
  })

  await prisma.projectMember.upsert({
    where: {
      projectId_userId: {
        projectId: project.id,
        userId: qaEngineer.id,
      },
    },
    update: {},
    create: {
      projectId: project.id,
      userId: qaEngineer.id,
    },
  })

  await prisma.projectMember.upsert({
    where: {
      projectId_userId: {
        projectId: project.id,
        userId: developer.id,
      },
    },
    update: {},
    create: {
      projectId: project.id,
      userId: developer.id,
    },
  })

  // ============================================================================
  // 6. TEST PLAN
  // ============================================================================
  console.log('Creating test plan...')
  const testPlan = await prisma.testPlan.upsert({
    where: { id: 'demo-test-plan-id' },
    update: {},
    create: {
      id: 'demo-test-plan-id',
      name: 'Sprint 1 Test Plan',
      description: 'Comprehensive testing plan for Sprint 1 features',
      projectId: project.id,
      scope: 'User authentication and profile management',
      schedule: 'Week of Feb 11-15, 2026',
      testTypes: 'Functional, Integration, UI',
      entryCriteria: 'All features developed and code reviewed',
      exitCriteria: '95% pass rate, all critical bugs resolved',
      createdById: admin.id,
    },
  })
  console.log(`✓ Test plan created: ${testPlan.name}`)

  // ============================================================================
  // 7. TEST SUITE
  // ============================================================================
  console.log('Creating test suites...')
  const smokeSuite = await prisma.testSuite.upsert({
    where: { id: 'smoke-suite-id' },
    update: {},
    create: {
      id: 'smoke-suite-id',
      name: 'Smoke Test Suite',
      description: 'Critical path tests to verify basic functionality',
      projectId: project.id,
      suiteType: 'smoke',
      createdById: qaEngineer.id,
    },
  })

  const regressionSuite = await prisma.testSuite.upsert({
    where: { id: 'regression-suite-id' },
    update: {},
    create: {
      id: 'regression-suite-id',
      name: 'Regression Test Suite',
      description: 'Full regression testing for release validation',
      projectId: project.id,
      suiteType: 'regression',
      createdById: qaEngineer.id,
    },
  })

  const apiSuite = await prisma.testSuite.upsert({
    where: { id: 'api-suite-id' },
    update: {},
    create: {
      id: 'api-suite-id',
      name: 'API Test Suite',
      description: 'Backend API endpoint testing',
      projectId: project.id,
      suiteType: 'api',
      createdById: developer.id,
    },
  })
  console.log('✓ Test suites created')

  // ============================================================================
  // 8. TEST CASES
  // ============================================================================
  console.log('Creating test cases...')

  // Step-based test case 1
  const loginTestCase = await prisma.testCase.upsert({
    where: { id: 'test-case-login-id' },
    update: {},
    create: {
      id: 'test-case-login-id',
      name: 'User Login - Valid Credentials',
      description: 'Verify that a user can successfully log in with valid credentials',
      projectId: project.id,
      testType: TestType.STEP_BASED,
      preconditions: {
        items: [
          'User account exists in the system',
          'User is not already logged in',
        ],
      },
      steps: {
        steps: [
          {
            stepNumber: 1,
            action: 'Navigate to the login page',
            expectedResult: 'Login page is displayed with email and password fields',
          },
          {
            stepNumber: 2,
            action: 'Enter valid email address',
            expectedResult: 'Email is accepted',
          },
          {
            stepNumber: 3,
            action: 'Enter valid password',
            expectedResult: 'Password is accepted (masked)',
          },
          {
            stepNumber: 4,
            action: 'Click the Login button',
            expectedResult: 'User is redirected to dashboard with welcome message',
          },
        ],
      },
      lastRunStatus: TestRunStatus.PASS,
      lastRunAt: new Date('2026-02-10T14:30:00Z'),
      createdById: qaEngineer.id,
    },
  })

  // Step-based test case 2
  const createProjectTestCase = await prisma.testCase.upsert({
    where: { id: 'test-case-create-project-id' },
    update: {},
    create: {
      id: 'test-case-create-project-id',
      name: 'Create New Project',
      description: 'Verify that an authorized user can create a new project',
      projectId: project.id,
      testType: TestType.STEP_BASED,
      preconditions: {
        items: [
          'User is logged in',
          'User has PROJECT_MANAGER role or higher',
          'Organization has not reached max projects limit',
        ],
      },
      steps: {
        steps: [
          {
            stepNumber: 1,
            action: 'Navigate to Projects page',
            expectedResult: 'Projects list is displayed',
          },
          {
            stepNumber: 2,
            action: 'Click "Create New Project" button',
            expectedResult: 'Project creation form is displayed',
          },
          {
            stepNumber: 3,
            action: 'Enter project name and description',
            expectedResult: 'Form accepts input',
          },
          {
            stepNumber: 4,
            action: 'Click Save button',
            expectedResult: 'Project is created and appears in the projects list',
          },
        ],
      },
      lastRunStatus: TestRunStatus.NOT_RUN,
      createdById: qaEngineer.id,
    },
  })

  // Gherkin test case 1
  const searchTestCase = await prisma.testCase.upsert({
    where: { id: 'test-case-search-id' },
    update: {},
    create: {
      id: 'test-case-search-id',
      name: 'Test Case Search Functionality',
      description: 'Verify that users can search for test cases by name',
      projectId: project.id,
      testType: TestType.GHERKIN,
      gherkinSyntax: `Feature: Test Case Search
  As a QA Engineer
  I want to search for test cases by name
  So that I can quickly find relevant tests

Scenario: Search with exact match
  Given I am logged in as a QA Engineer
  And there are test cases in the project
  When I enter "User Login" in the search field
  Then I should see all test cases containing "User Login" in the name
  And the results should be sorted by relevance

Scenario: Search with partial match
  Given I am logged in as a QA Engineer
  And there are test cases in the project
  When I enter "login" in the search field
  Then I should see all test cases containing "login" (case-insensitive)

Scenario: Search with no results
  Given I am logged in as a QA Engineer
  When I enter "xyz123nonexistent" in the search field
  Then I should see a "No results found" message
  And I should see a suggestion to modify the search`,
      lastRunStatus: TestRunStatus.FAIL,
      lastRunAt: new Date('2026-02-09T10:15:00Z'),
      debugFlag: true,
      debugFlaggedAt: new Date('2026-02-09T10:20:00Z'),
      debugFlaggedById: qaEngineer.id,
      createdById: qaEngineer.id,
    },
  })

  // Gherkin test case 2 - API test
  const apiTestCase = await prisma.testCase.upsert({
    where: { id: 'test-case-api-auth-id' },
    update: {},
    create: {
      id: 'test-case-api-auth-id',
      name: 'API Authentication Endpoint',
      description: 'Verify the /api/auth/login endpoint behavior',
      projectId: project.id,
      testType: TestType.GHERKIN,
      gherkinSyntax: `Feature: API Authentication
  As a developer
  I want to test the authentication API
  So that I can verify login functionality works correctly

Scenario: Successful login
  Given the API is running
  When I POST to "/api/auth/login" with valid credentials
  Then the response status should be 200
  And the response should include a JWT token
  And the token should be valid for 24 hours

Scenario: Invalid credentials
  Given the API is running
  When I POST to "/api/auth/login" with invalid credentials
  Then the response status should be 401
  And the response should include an error message
  And no token should be returned

Scenario: Missing required fields
  Given the API is running
  When I POST to "/api/auth/login" without email
  Then the response status should be 400
  And the response should include a validation error`,
      lastRunStatus: TestRunStatus.PASS,
      lastRunAt: new Date('2026-02-10T09:00:00Z'),
      createdById: developer.id,
    },
  })

  // Step-based test case 3 - with debug flag
  const deleteTestCase = await prisma.testCase.upsert({
    where: { id: 'test-case-delete-project-id' },
    update: {},
    create: {
      id: 'test-case-delete-project-id',
      name: 'Delete Project - Permission Check',
      description: 'Verify that only authorized users can delete projects',
      projectId: project.id,
      testType: TestType.STEP_BASED,
      preconditions: {
        items: [
          'User is logged in',
          'Test project exists',
        ],
      },
      steps: {
        steps: [
          {
            stepNumber: 1,
            action: 'Login as DEVELOPER role user',
            expectedResult: 'Successfully logged in',
          },
          {
            stepNumber: 2,
            action: 'Navigate to project settings',
            expectedResult: 'Settings page is displayed',
          },
          {
            stepNumber: 3,
            action: 'Look for Delete Project button',
            expectedResult: 'Delete button should NOT be visible for DEVELOPER role',
          },
          {
            stepNumber: 4,
            action: 'Logout and login as ORGANIZATION_MANAGER',
            expectedResult: 'Successfully logged in as manager',
          },
          {
            stepNumber: 5,
            action: 'Navigate to same project settings',
            expectedResult: 'Delete button IS visible for ORGANIZATION_MANAGER',
          },
        ],
      },
      lastRunStatus: TestRunStatus.BLOCKED,
      lastRunAt: new Date('2026-02-08T16:45:00Z'),
      debugFlag: true,
      debugFlaggedAt: new Date('2026-02-08T17:00:00Z'),
      debugFlaggedById: admin.id,
      createdById: qaEngineer.id,
    },
  })

  console.log('✓ Test cases created')

  // ============================================================================
  // 9. LINK TEST CASES TO TEST PLAN AND SUITES
  // ============================================================================
  console.log('Linking test cases to test plan and suites...')

  // Link to test plan
  await prisma.testPlanCase.createMany({
    data: [
      { testPlanId: testPlan.id, testCaseId: loginTestCase.id },
      { testPlanId: testPlan.id, testCaseId: createProjectTestCase.id },
      { testPlanId: testPlan.id, testCaseId: searchTestCase.id },
    ],
    skipDuplicates: true,
  })

  // Link to smoke suite
  await prisma.testSuiteCase.createMany({
    data: [
      { testSuiteId: smokeSuite.id, testCaseId: loginTestCase.id },
      { testSuiteId: smokeSuite.id, testCaseId: createProjectTestCase.id },
    ],
    skipDuplicates: true,
  })

  // Link to regression suite
  await prisma.testSuiteCase.createMany({
    data: [
      { testSuiteId: regressionSuite.id, testCaseId: loginTestCase.id },
      { testSuiteId: regressionSuite.id, testCaseId: createProjectTestCase.id },
      { testSuiteId: regressionSuite.id, testCaseId: searchTestCase.id },
      { testSuiteId: regressionSuite.id, testCaseId: deleteTestCase.id },
    ],
    skipDuplicates: true,
  })

  // Link to API suite
  await prisma.testSuiteCase.createMany({
    data: [
      { testSuiteId: apiSuite.id, testCaseId: apiTestCase.id },
    ],
    skipDuplicates: true,
  })

  console.log('✓ Test cases linked to plans and suites')

  // ============================================================================
  // 10. TEST RUNS
  // ============================================================================
  console.log('Creating sample test runs...')

  await prisma.testRun.createMany({
    data: [
      {
        testCaseId: loginTestCase.id,
        executedById: qaEngineer.id,
        executedAt: new Date('2026-02-10T14:30:00Z'),
        environment: 'staging',
        status: TestRunStatus.PASS,
        duration: 45,
        notes: 'All steps passed successfully. No issues found.',
      },
      {
        testCaseId: loginTestCase.id,
        executedById: qaEngineer.id,
        executedAt: new Date('2026-02-09T11:00:00Z'),
        environment: 'qa',
        status: TestRunStatus.PASS,
        duration: 42,
      },
      {
        testCaseId: searchTestCase.id,
        executedById: qaEngineer.id,
        executedAt: new Date('2026-02-09T10:15:00Z'),
        environment: 'qa',
        status: TestRunStatus.FAIL,
        duration: 120,
        notes: 'Partial match scenario failed. Search is case-sensitive when it should be case-insensitive.',
      },
      {
        testCaseId: apiTestCase.id,
        executedById: developer.id,
        executedAt: new Date('2026-02-10T09:00:00Z'),
        environment: 'dev',
        status: TestRunStatus.PASS,
        duration: 15,
        notes: 'All API scenarios validated successfully.',
      },
      {
        testCaseId: deleteTestCase.id,
        executedById: qaEngineer.id,
        executedAt: new Date('2026-02-08T16:45:00Z'),
        environment: 'staging',
        status: TestRunStatus.BLOCKED,
        duration: null,
        notes: 'Test blocked - RBAC permissions not fully implemented yet.',
      },
    ],
    skipDuplicates: true,
  })

  console.log('✓ Test runs created')

  // ============================================================================
  // 11. ACTIVITY LOGS
  // ============================================================================
  console.log('Creating activity logs...')

  await prisma.activityLog.createMany({
    data: [
      {
        userId: admin.id,
        actionType: 'CREATED',
        objectType: 'Organization',
        objectId: organization.id,
        timestamp: new Date('2026-02-01T09:00:00Z'),
      },
      {
        userId: admin.id,
        actionType: 'CREATED',
        objectType: 'Project',
        objectId: project.id,
        timestamp: new Date('2026-02-01T09:30:00Z'),
      },
      {
        userId: qaEngineer.id,
        actionType: 'CREATED',
        objectType: 'TestCase',
        objectId: loginTestCase.id,
        timestamp: new Date('2026-02-05T10:00:00Z'),
      },
      {
        userId: qaEngineer.id,
        actionType: 'UPDATED',
        objectType: 'TestCase',
        objectId: searchTestCase.id,
        changes: {
          field: 'debugFlag',
          oldValue: false,
          newValue: true,
        },
        timestamp: new Date('2026-02-09T10:20:00Z'),
      },
    ],
    skipDuplicates: true,
  })

  console.log('✓ Activity logs created')

  console.log('\n✅ Database seed completed successfully!')
  console.log('\nSample credentials:')
  console.log('  Admin: admin@testcraft.io / Admin123!')
  console.log('  QA Engineer: qa@testcraft.io / QATest123!')
  console.log('  Developer: dev@testcraft.io / DevTest123!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('Error during seed:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
