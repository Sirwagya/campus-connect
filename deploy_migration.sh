#!/bin/bash
# Database Migration Deployment Script
# Usage: ./deploy_migration.sh [staging|production]

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
MIGRATION_DIR="./supabase/migrations"
MIGRATION_FILE="20251201_130000_schema_enhancements.sql"
VALIDATION_FILE="20251201_130000_validation.sql"
ROLLBACK_FILE="20251201_130000_rollback.sql"

# Function to print colored output
print_green() { echo -e "${GREEN}✓ $1${NC}"; }
print_yellow() { echo -e "${YELLOW}⚠ $1${NC}"; }
print_red() { echo -e "${RED}✗ $1${NC}"; }

# Check environment
ENVIRONMENT=${1:-staging}

echo "=================================================="
echo "  Campus Connect - Database Migration Deployment"
echo "  Environment: $ENVIRONMENT"
echo "  Migration: $MIGRATION_FILE"
echo "=================================================="
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    print_red ".env.local file not found!"
    echo "Please create .env.local with DATABASE_URL"
    exit 1
fi

# Load environment variables
source .env.local

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    # Try Supabase env vars
    if [ -n "$NEXT_PUBLIC_SUPABASE_URL" ] && [ -n "$SUPABASE_SERVICE_ROLE_KEY" ]; then
        print_yellow "DATABASE_URL not found, constructing from Supabase vars..."
        # You'll need to construct this based on your Supabase project
        print_red "Please add DATABASE_URL to .env.local"
        exit 1
    else
        print_red "DATABASE_URL not found in .env.local"
        exit 1
    fi
fi

echo ""
print_yellow "WARNING: This will modify the database schema!"
print_yellow "Make sure you have a backup before proceeding."
echo ""

# Confirmation prompt
read -p "Continue with migration? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    print_yellow "Migration cancelled"
    exit 0
fi

echo ""
echo "Step 1: Creating backup..."
BACKUP_FILE="backup_before_migration_$(date +%Y%m%d_%H%M%S).sql"

# Try to create backup (may fail if pg_dump not available)
if command -v pg_dump &> /dev/null; then
    pg_dump "$DATABASE_URL" > "$BACKUP_FILE" 2>/dev/null || {
        print_yellow "Backup via pg_dump failed - continuing anyway"
        print_yellow "Please ensure you have a backup via Supabase Dashboard!"
    }
    if [ -f "$BACKUP_FILE" ]; then
        print_green "Backup created: $BACKUP_FILE"
    fi
else
    print_yellow "pg_dump not found - please backup via Supabase Dashboard"
fi

echo ""
echo "Step 2: Running migration..."
psql "$DATABASE_URL" -f "$MIGRATION_DIR/$MIGRATION_FILE" || {
    print_red "Migration failed!"
    print_yellow "To rollback: psql \$DATABASE_URL -f $MIGRATION_DIR/$ROLLBACK_FILE"
    exit 1
}
print_green "Migration completed successfully!"

echo ""
echo "Step 3: Running validation queries..."
psql "$DATABASE_URL" -f "$MIGRATION_DIR/$VALIDATION_FILE" > validation_results.txt || {
    print_yellow "Some validation queries failed - check validation_results.txt"
}
print_green "Validation complete - check validation_results.txt"

echo ""
echo "Step 4: Quick integrity check..."

# Run critical validation queries
INVALID_EMAILS=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM users WHERE email !~ '^[a-zA-Z0-9._%+-]+@vedamsot\\.org$';")
if [ "$INVALID_EMAILS" -gt 0 ]; then
    print_yellow "Found $INVALID_EMAILS users with invalid emails"
else
    print_green "All emails valid"
fi

NEW_TABLES=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('follows', 'presence', 'reactions', 'audit_log');")
if [ "$NEW_TABLES" -eq 4 ]; then
    print_green "All new tables created"
else
    print_yellow "Expected 4 new tables, found $NEW_TABLES"
fi

echo ""
echo "=================================================="
print_green "Migration deployment complete!"
echo "=================================================="
echo ""
echo "Next steps:"
echo "1. Review validation_results.txt"
echo "2. Test application functionality"
echo "3. Monitor for 24 hours"
echo ""
echo "If issues occur:"
echo "  Rollback: psql \$DATABASE_URL -f $MIGRATION_DIR/$ROLLBACK_FILE"
echo "  Restore: psql \$DATABASE_URL < $BACKUP_FILE"
echo ""
