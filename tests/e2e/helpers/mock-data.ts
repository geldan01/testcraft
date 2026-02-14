export const MOCK_USER = {
  id: 'user-1',
  email: 'test@example.com',
  name: 'Test User',
  avatarUrl: null,
  authProvider: 'EMAIL',
  isAdmin: false,
  status: 'ACTIVE',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

export const MOCK_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOiJ1c2VyLTEifQ.mock'

export const MOCK_ORG = {
  id: 'org-1',
  name: 'Acme Corp',
  maxProjects: 10,
  maxTestCasesPerProject: 1000,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  _count: { members: 3, projects: 2 },
}

export const MOCK_PROJECT = {
  id: 'project-1',
  name: 'Web App',
  description: 'Main web application',
  organizationId: 'org-1',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  _count: { testCases: 15, testPlans: 3, testSuites: 4, members: 5 },
  organization: { id: 'org-1', name: 'Acme Corp' },
}

export const MOCK_STATS = {
  totalTestCases: 42,
  passRate: 87,
  recentRuns: 15,
  debugFlagged: 3,
}
