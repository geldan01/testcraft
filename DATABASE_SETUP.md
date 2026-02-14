# TestCraft Database Setup Guide

## Overview

TestCraft uses PostgreSQL as its database and Prisma ORM for database access and migrations. This guide will help you set up and manage the database for local development.

## Prerequisites

- Docker and Docker Compose installed
- Node.js 18+ installed
- npm or yarn package manager

## Database Schema

The database schema includes the following main entities:

### Core Entities
- **User**: User accounts with authentication and authorization
- **Organization**: Multi-tenant organization structure
- **OrganizationMember**: Join table linking users to organizations with roles
- **Project**: Projects within organizations
- **ProjectMember**: Join table for project-level access control

### RBAC System
- **RbacPermission**: Role-based access control permissions matrix

### Test Management
- **TestPlan**: Test planning and strategy documents
- **TestSuite**: Collections of test cases (smoke, regression, API, etc.)
- **TestCase**: Individual test cases (step-based or Gherkin/BDD)
- **TestPlanCase**: Many-to-many relationship between test plans and test cases
- **TestSuiteCase**: Many-to-many relationship between test suites and test cases
- **TestRun**: Execution records of test cases

### Supporting Entities
- **Attachment**: File attachments for test runs and test cases
- **Comment**: Comments on test cases and test runs
- **ActivityLog**: Audit trail of all system actions

## Quick Start

### 1. Start PostgreSQL Database

```bash
# Start the PostgreSQL container
docker-compose up -d

# Verify the database is running
docker-compose ps

# View database logs (optional)
docker-compose logs -f db
```

The database will be available at:
- Host: `localhost`
- Port: `5432`
- Database: `testcraft`
- Username: `testcraft`
- Password: `testcraft`

### 2. Install Dependencies

```bash
npm install
```

### 3. Generate Prisma Client

```bash
npm run db:generate
```

This generates the Prisma Client based on your schema in `node_modules/.prisma/client`.

### 4. Run Database Migrations

```bash
npm run db:migrate
```

This will:
- Create the database schema
- Generate migration files in `prisma/migrations/`
- Apply the migration to your database

You'll be prompted to name your migration (e.g., "initial schema").

### 5. Seed the Database

```bash
npm run db:seed
```

This will populate the database with:
- Admin user (admin@testcraft.io / Admin123!)
- QA Engineer user (qa@testcraft.io / QATest123!)
- Developer user (dev@testcraft.io / DevTest123!)
- Demo organization
- Demo project
- Default RBAC permissions
- Sample test plans, suites, and test cases
- Sample test runs

## Available Database Scripts

```bash
# Generate Prisma Client (run after schema changes)
npm run db:generate

# Create a new migration (development)
npm run db:migrate

# Apply migrations (production)
npm run db:migrate:deploy

# Seed the database
npm run db:seed

# Open Prisma Studio (database GUI)
npm run db:studio

# Reset database (WARNING: deletes all data)
npm run db:reset

# Push schema changes without migrations (development only)
npm run db:push
```

## Database Management

### Prisma Studio

Access a visual database browser:

```bash
npm run db:studio
```

This opens a GUI at `http://localhost:5555` where you can:
- View all tables and data
- Create, update, and delete records
- Run queries
- Inspect relationships

### Stopping the Database

```bash
# Stop the database container
docker-compose down

# Stop and remove all data (WARNING: deletes all data)
docker-compose down -v
```

### Database Backups

```bash
# Backup the database
docker exec testcraft-postgres pg_dump -U testcraft testcraft > backup.sql

# Restore from backup
docker exec -i testcraft-postgres psql -U testcraft testcraft < backup.sql
```

## Schema Modifications

When you need to modify the database schema:

1. Edit `prisma/schema.prisma`
2. Generate a new migration:
   ```bash
   npm run db:migrate
   ```
3. The migration will be created in `prisma/migrations/`
4. Review the migration SQL before applying
5. Update your seed file if needed

## Indexes

The schema includes indexes on frequently queried fields:

- `organizationId` on all related tables
- `projectId` on test-related tables
- `userId` and `authorId` on user-related tables
- `status` and `debugFlag` on TestCase
- `createdAt` on time-series data (TestRun, ActivityLog)
- Unique constraints on join tables

## Relationships and Cascading

The schema uses cascading deletes to maintain referential integrity:

- Deleting an Organization cascades to all Projects, Members, and Permissions
- Deleting a Project cascades to all TestPlans, TestSuites, and TestCases
- Deleting a TestCase cascades to all TestRuns and Attachments

## Environment Variables

Required environment variables in `.env`:

```env
# PostgreSQL connection string
DATABASE_URL="postgresql://testcraft:testcraft@localhost:5432/testcraft?schema=public"

# JWT secret for authentication
JWT_SECRET="your-super-secret-jwt-key-change-in-production"

# Node environment
NODE_ENV="development"
```

## Production Considerations

For production deployment:

1. **Change Database Credentials**: Update the PostgreSQL username and password
2. **Use Managed Database**: Consider using AWS RDS, Google Cloud SQL, or similar
3. **Update DATABASE_URL**: Point to your production database
4. **Connection Pooling**: Enable Prisma's connection pooling or use PgBouncer
5. **SSL/TLS**: Enable SSL connections for security
6. **Backups**: Set up automated backups
7. **Monitoring**: Monitor query performance and slow queries
8. **Migrations**: Use `npm run db:migrate:deploy` for production migrations

Example production DATABASE_URL with SSL:

```env
DATABASE_URL="postgresql://user:password@host:5432/database?schema=public&sslmode=require&connection_limit=10&pool_timeout=20"
```

## Troubleshooting

### Cannot connect to database

```bash
# Check if the container is running
docker-compose ps

# Check container logs
docker-compose logs db

# Restart the container
docker-compose restart db
```

### Port 5432 already in use

If you have another PostgreSQL instance running:

```bash
# Option 1: Stop your local PostgreSQL
brew services stop postgresql  # macOS with Homebrew
sudo systemctl stop postgresql  # Linux

# Option 2: Change the port in docker-compose.yml
# Change "5432:5432" to "5433:5432" and update DATABASE_URL
```

### Migration conflicts

```bash
# Reset the database and reapply all migrations
npm run db:reset

# Or manually delete problematic migrations and re-run
rm -rf prisma/migrations/XXXX_migration_name
npm run db:migrate
```

### Prisma Client out of sync

```bash
# Regenerate the Prisma Client
npm run db:generate
```

## Schema Visualization

To visualize the database schema, you can:

1. Use Prisma Studio: `npm run db:studio`
2. Use a tool like [dbdiagram.io](https://dbdiagram.io) with the Prisma schema
3. Use [Prisma ERD Generator](https://github.com/keonik/prisma-erd-generator)

## Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs)
- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
- [Prisma Client API](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference)
