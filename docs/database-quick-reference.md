# TestCraft Database Quick Reference

## Quick Start Commands

```bash
# Start everything
docker-compose up -d && npm run db:generate && npm run db:migrate && npm run db:seed

# Open database GUI
npm run db:studio

# Stop database
docker-compose down
```

## Common Prisma Queries

### Users

```typescript
// Find user by email
const user = await prisma.user.findUnique({
  where: { email: 'user@example.com' }
})

// Get user with organizations
const user = await prisma.user.findUnique({
  where: { id: userId },
  include: {
    organizationMemberships: {
      include: { organization: true }
    }
  }
})

// Create user
const user = await prisma.user.create({
  data: {
    email: 'new@example.com',
    name: 'New User',
    passwordHash: hashedPassword,
    authProvider: 'EMAIL',
    status: 'ACTIVE'
  }
})
```

### Organizations

```typescript
// Get organization with members
const org = await prisma.organization.findUnique({
  where: { id: orgId },
  include: {
    members: {
      include: { user: true }
    },
    projects: true
  }
})

// Check if user is org member
const membership = await prisma.organizationMember.findUnique({
  where: {
    organizationId_userId: {
      organizationId: orgId,
      userId: userId
    }
  }
})
```

### Projects

```typescript
// Get project with test cases
const project = await prisma.project.findUnique({
  where: { id: projectId },
  include: {
    testCases: {
      where: { lastRunStatus: 'FAIL' },
      orderBy: { lastRunAt: 'desc' }
    }
  }
})

// Get projects for user
const projects = await prisma.project.findMany({
  where: {
    members: {
      some: { userId: userId }
    }
  }
})
```

### Test Cases

```typescript
// Get test case with runs
const testCase = await prisma.testCase.findUnique({
  where: { id: testCaseId },
  include: {
    testRuns: {
      orderBy: { executedAt: 'desc' },
      take: 10,
      include: { executedBy: true }
    },
    createdBy: true
  }
})

// Get debug-flagged test cases
const debugTests = await prisma.testCase.findMany({
  where: {
    projectId: projectId,
    debugFlag: true
  },
  include: {
    debugFlaggedBy: true
  }
})

// Create test case
const testCase = await prisma.testCase.create({
  data: {
    name: 'Test Login',
    projectId: projectId,
    testType: 'STEP_BASED',
    steps: {
      steps: [
        { stepNumber: 1, action: '...', expectedResult: '...' }
      ]
    },
    createdById: userId
  }
})

// Update test case status after run
await prisma.testCase.update({
  where: { id: testCaseId },
  data: {
    lastRunStatus: 'PASS',
    lastRunAt: new Date()
  }
})
```

### Test Runs

```typescript
// Create test run
const testRun = await prisma.testRun.create({
  data: {
    testCaseId: testCaseId,
    executedById: userId,
    executedAt: new Date(),
    environment: 'staging',
    status: 'PASS',
    duration: 45,
    notes: 'All steps passed'
  }
})

// Get test runs for project
const runs = await prisma.testRun.findMany({
  where: {
    testCase: {
      projectId: projectId
    }
  },
  orderBy: { executedAt: 'desc' },
  include: {
    testCase: true,
    executedBy: true
  }
})

// Get test run statistics
const stats = await prisma.testRun.groupBy({
  by: ['status'],
  where: {
    testCase: { projectId: projectId },
    executedAt: {
      gte: new Date('2026-02-01')
    }
  },
  _count: true
})
```

### Test Plans & Suites

```typescript
// Create test plan with cases
const testPlan = await prisma.testPlan.create({
  data: {
    name: 'Sprint 1 Test Plan',
    projectId: projectId,
    createdById: userId,
    testCases: {
      create: [
        { testCaseId: testCase1Id },
        { testCaseId: testCase2Id }
      ]
    }
  }
})

// Get test suite with cases
const suite = await prisma.testSuite.findUnique({
  where: { id: suiteId },
  include: {
    testCases: {
      include: {
        testCase: {
          include: {
            testRuns: {
              orderBy: { executedAt: 'desc' },
              take: 1
            }
          }
        }
      }
    }
  }
})
```

### RBAC Permissions

```typescript
// Check permission
const permission = await prisma.rbacPermission.findUnique({
  where: {
    organizationId_role_objectType_action: {
      organizationId: orgId,
      role: userRole,
      objectType: 'TEST_CASE',
      action: 'EDIT'
    }
  }
})
const hasPermission = permission?.allowed ?? false

// Get all permissions for role
const permissions = await prisma.rbacPermission.findMany({
  where: {
    organizationId: orgId,
    role: 'QA_ENGINEER'
  }
})
```

### Activity Logs

```typescript
// Log an action
await prisma.activityLog.create({
  data: {
    userId: userId,
    actionType: 'UPDATED',
    objectType: 'TestCase',
    objectId: testCaseId,
    changes: {
      field: 'status',
      oldValue: 'NOT_RUN',
      newValue: 'PASS'
    }
  }
})

// Get activity for object
const logs = await prisma.activityLog.findMany({
  where: {
    objectType: 'TestCase',
    objectId: testCaseId
  },
  orderBy: { timestamp: 'desc' },
  include: { user: true }
})
```

### Comments

```typescript
// Add comment
const comment = await prisma.comment.create({
  data: {
    content: 'This test is failing due to...',
    authorId: userId,
    commentableType: 'TEST_CASE',
    commentableId: testCaseId
  }
})

// Get comments
const comments = await prisma.comment.findMany({
  where: {
    commentableType: 'TEST_CASE',
    commentableId: testCaseId
  },
  orderBy: { createdAt: 'asc' },
  include: { author: true }
})
```

### Attachments

```typescript
// Upload attachment
const attachment = await prisma.attachment.create({
  data: {
    fileUrl: '/uploads/screenshot.png',
    fileName: 'screenshot.png',
    fileType: 'image/png',
    fileSize: 1024000,
    uploadedById: userId,
    testRunId: testRunId
  }
})

// Get attachments
const attachments = await prisma.attachment.findMany({
  where: { testRunId: testRunId },
  include: { uploadedBy: true }
})
```

## Advanced Queries

### Transactions

```typescript
// Run multiple operations atomically
const result = await prisma.$transaction(async (tx) => {
  const testCase = await tx.testCase.update({
    where: { id: testCaseId },
    data: { lastRunStatus: 'PASS' }
  })

  const testRun = await tx.testRun.create({
    data: {
      testCaseId: testCaseId,
      executedById: userId,
      executedAt: new Date(),
      status: 'PASS'
    }
  })

  await tx.activityLog.create({
    data: {
      userId: userId,
      actionType: 'CREATED',
      objectType: 'TestRun',
      objectId: testRun.id
    }
  })

  return { testCase, testRun }
})
```

### Pagination

```typescript
// Cursor-based pagination
const testCases = await prisma.testCase.findMany({
  take: 20,
  skip: 1, // Skip the cursor
  cursor: {
    id: lastTestCaseId
  },
  orderBy: { createdAt: 'desc' }
})

// Offset pagination
const testCases = await prisma.testCase.findMany({
  take: 20,
  skip: (page - 1) * 20,
  orderBy: { createdAt: 'desc' }
})

// Get total count for pagination
const total = await prisma.testCase.count({
  where: { projectId: projectId }
})
```

### Aggregations

```typescript
// Count by status
const statusCounts = await prisma.testCase.groupBy({
  by: ['lastRunStatus'],
  where: { projectId: projectId },
  _count: true
})

// Average test duration
const avgDuration = await prisma.testRun.aggregate({
  where: { testCaseId: testCaseId },
  _avg: { duration: true },
  _max: { duration: true },
  _min: { duration: true }
})
```

### Full-text Search

```typescript
// Search test cases (case-insensitive)
const results = await prisma.testCase.findMany({
  where: {
    OR: [
      { name: { contains: searchTerm, mode: 'insensitive' } },
      { description: { contains: searchTerm, mode: 'insensitive' } }
    ],
    projectId: projectId
  }
})
```

## Performance Tips

```typescript
// ✅ Good: Select only needed fields
const users = await prisma.user.findMany({
  select: {
    id: true,
    name: true,
    email: true
  }
})

// ❌ Bad: Fetching all fields
const users = await prisma.user.findMany()

// ✅ Good: Paginate large results
const testRuns = await prisma.testRun.findMany({
  take: 50,
  skip: offset
})

// ❌ Bad: Fetching all at once
const testRuns = await prisma.testRun.findMany()

// ✅ Good: Use transactions for related operations
await prisma.$transaction([...])

// ❌ Bad: Multiple separate queries
await prisma.testCase.update(...)
await prisma.activityLog.create(...)
```

## Environment Variables

```bash
# Local development
DATABASE_URL="postgresql://testcraft:testcraft@localhost:5432/testcraft?schema=public"

# Production with connection pooling
DATABASE_URL="postgresql://user:pass@host:5432/db?schema=public&connection_limit=10&pool_timeout=20"

# With SSL
DATABASE_URL="postgresql://user:pass@host:5432/db?schema=public&sslmode=require"
```

## Useful Scripts

```bash
# Database management
npm run db:studio      # Visual browser
npm run db:generate    # Generate client
npm run db:migrate     # Run migrations
npm run db:seed        # Seed data
npm run db:reset       # Reset (DANGER!)

# Docker
docker-compose up -d           # Start
docker-compose down            # Stop
docker-compose logs -f db      # Logs
docker-compose restart db      # Restart

# Backups
docker exec testcraft-postgres pg_dump -U testcraft testcraft > backup.sql
docker exec -i testcraft-postgres psql -U testcraft testcraft < backup.sql
```

## Error Handling

```typescript
import { Prisma } from '@prisma/client'

try {
  const user = await prisma.user.create({ data: userData })
} catch (error) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // P2002: Unique constraint violation
    if (error.code === 'P2002') {
      throw new Error('A user with this email already exists')
    }
  }
  throw error
}
```

## Common Error Codes

- `P2002` - Unique constraint violation
- `P2003` - Foreign key constraint violation
- `P2025` - Record not found
- `P2016` - Query interpretation error
- `P1008` - Operations timed out

## Sample Credentials (Seeded)

- Admin: `admin@testcraft.io` / `Admin123!`
- QA: `qa@testcraft.io` / `QATest123!`
- Dev: `dev@testcraft.io` / `DevTest123!`
