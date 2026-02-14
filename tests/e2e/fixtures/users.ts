export interface TestUser {
  email: string
  password: string
  name: string
  role: string
  isAdmin: boolean
}

export const TestUsers = {
  admin: {
    email: 'admin@testcraft.io',
    password: 'Admin123!',
    name: 'System Administrator',
    role: 'ORGANIZATION_MANAGER',
    isAdmin: true,
  },
  qa: {
    email: 'qa@testcraft.io',
    password: 'QATest123!',
    name: 'QA Engineer',
    role: 'QA_ENGINEER',
    isAdmin: false,
  },
  developer: {
    email: 'dev@testcraft.io',
    password: 'DevTest123!',
    name: 'Developer',
    role: 'DEVELOPER',
    isAdmin: false,
  },
} as const satisfies Record<string, TestUser>

export type TestUserKey = keyof typeof TestUsers
