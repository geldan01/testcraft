#!/bin/bash

# TestCraft Database Setup Script
# This script helps set up the PostgreSQL database for local development

set -e  # Exit on error

echo "🚀 TestCraft Database Setup"
echo "============================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "ℹ $1"
}

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker and try again."
    exit 1
fi
print_success "Docker is running"

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    print_error "docker-compose is not installed. Please install it and try again."
    exit 1
fi
print_success "docker-compose is available"

# Check if .env file exists
if [ ! -f .env ]; then
    print_warning ".env file not found"
    if [ -f .env.example ]; then
        print_info "Copying .env.example to .env"
        cp .env.example .env
        print_success ".env file created"
    else
        print_error ".env.example not found. Cannot create .env file."
        exit 1
    fi
else
    print_success ".env file exists"
fi

# Start PostgreSQL container
print_info "Starting PostgreSQL container..."
docker-compose up -d db

# Wait for PostgreSQL to be ready
print_info "Waiting for PostgreSQL to be ready..."
MAX_RETRIES=30
RETRY_COUNT=0
until docker-compose exec -T db pg_isready -U testcraft > /dev/null 2>&1; do
    RETRY_COUNT=$((RETRY_COUNT + 1))
    if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
        print_error "PostgreSQL failed to start after $MAX_RETRIES attempts"
        docker-compose logs db
        exit 1
    fi
    echo -n "."
    sleep 1
done
echo ""
print_success "PostgreSQL is ready"

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    print_info "Installing npm dependencies..."
    npm install
    print_success "Dependencies installed"
else
    print_success "Dependencies already installed"
fi

# Generate Prisma Client
print_info "Generating Prisma Client..."
npm run db:generate
print_success "Prisma Client generated"

# Ask user if they want to create a fresh database
echo ""
print_warning "Do you want to create a fresh database? This will delete all existing data."
read -p "Continue? (y/N): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_info "Creating database migration..."
    npm run db:migrate -- --name "initial_schema"
    print_success "Database migration created and applied"

    print_info "Seeding database with sample data..."
    npm run db:seed
    print_success "Database seeded"
else
    print_info "Skipping database migration and seed"
fi

echo ""
echo "============================"
print_success "Database setup complete!"
echo "============================"
echo ""
print_info "Database connection details:"
echo "  Host: localhost"
echo "  Port: 5432"
echo "  Database: testcraft"
echo "  Username: testcraft"
echo "  Password: testcraft"
echo ""
print_info "Sample user credentials (if seeded):"
echo "  Admin: admin@testcraft.io / Admin123!"
echo "  QA Engineer: qa@testcraft.io / QATest123!"
echo "  Developer: dev@testcraft.io / DevTest123!"
echo ""
print_info "Useful commands:"
echo "  npm run db:studio    - Open Prisma Studio (database GUI)"
echo "  npm run db:seed      - Reseed the database"
echo "  npm run db:reset     - Reset database (deletes all data)"
echo "  docker-compose logs db - View database logs"
echo "  docker-compose down  - Stop the database"
echo ""
print_info "To start the development server:"
echo "  npm run dev"
echo ""
