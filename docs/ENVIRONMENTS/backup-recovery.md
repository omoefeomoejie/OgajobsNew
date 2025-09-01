# Backup and Disaster Recovery

## Backup Strategy Overview

### Backup Types
1. **Hot Backups**: Continuous real-time backups
2. **Scheduled Backups**: Daily, weekly, monthly snapshots
3. **Code Repository**: Version-controlled source code
4. **Database Backups**: Full and incremental database backups
5. **Configuration Backups**: Environment and system configurations
6. **Media Backups**: User uploads and static assets

### Recovery Time Objectives (RTO)
- **Critical Systems**: < 15 minutes
- **Database**: < 30 minutes  
- **Full Application**: < 1 hour
- **Complete Environment**: < 4 hours

### Recovery Point Objectives (RPO)
- **Database**: < 5 minutes (Point-in-time recovery)
- **Application Files**: < 1 hour
- **User Data**: < 15 minutes
- **Configuration**: < 24 hours

## Supabase Database Backups

### Automated Supabase Backups
```sql
-- Supabase provides automatic backups, but we can create additional ones

-- Create a backup point
SELECT pg_create_restore_point('manual_backup_' || to_char(now(), 'YYYY_MM_DD_HH24_MI'));

-- Check available restore points
SELECT name, pg_wal_lsn_diff(lsn, '0/0') AS size_bytes, time
FROM pg_available_extensions 
WHERE name = 'pg_stat_statements';
```

### Manual Database Backup Script
```bash
#!/bin/bash
# /usr/local/bin/supabase-backup.sh

set -e

# Configuration
SUPABASE_PROJECT_REF="your-project-ref"
SUPABASE_DB_PASSWORD="your-db-password"
BACKUP_DIR="/var/backups/supabase"
RETENTION_DAYS=30

# Create backup directory
mkdir -p $BACKUP_DIR

# Generate timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "🗄️ Starting Supabase database backup..."

# Full database backup
pg_dump "postgresql://postgres:$SUPABASE_DB_PASSWORD@db.$SUPABASE_PROJECT_REF.supabase.co:5432/postgres" \
  --format=custom \
  --compress=9 \
  --verbose \
  --file="$BACKUP_DIR/supabase_full_$TIMESTAMP.dump"

# Schema-only backup (for quick restoration testing)
pg_dump "postgresql://postgres:$SUPABASE_DB_PASSWORD@db.$SUPABASE_PROJECT_REF.supabase.co:5432/postgres" \
  --schema-only \
  --format=plain \
  --file="$BACKUP_DIR/supabase_schema_$TIMESTAMP.sql"

# Data-only backup (excluding sensitive tables)
pg_dump "postgresql://postgres:$SUPABASE_DB_PASSWORD@db.$SUPABASE_PROJECT_REF.supabase.co:5432/postgres" \
  --data-only \
  --exclude-table=auth.users \
  --exclude-table=public.artisan_payment_methods \
  --exclude-table=public.identity_verifications \
  --format=custom \
  --file="$BACKUP_DIR/supabase_data_$TIMESTAMP.dump"

# Create backup manifest
cat > "$BACKUP_DIR/manifest_$TIMESTAMP.json" << EOF
{
  "timestamp": "$TIMESTAMP",
  "backup_type": "full",
  "database": "supabase",
  "project_ref": "$SUPABASE_PROJECT_REF",
  "files": {
    "full_dump": "supabase_full_$TIMESTAMP.dump",
    "schema_only": "supabase_schema_$TIMESTAMP.sql",
    "data_only": "supabase_data_$TIMESTAMP.dump"
  },
  "retention_policy": "${RETENTION_DAYS}_days"
}
EOF

# Compress backups
gzip "$BACKUP_DIR/supabase_schema_$TIMESTAMP.sql"

# Upload to cloud storage (optional)
if command -v aws &> /dev/null; then
    aws s3 cp "$BACKUP_DIR/" "s3://your-backup-bucket/supabase/" --recursive --exclude "*" --include "*$TIMESTAMP*"
fi

# Clean old backups
find $BACKUP_DIR -name "supabase_*" -type f -mtime +$RETENTION_DAYS -delete

echo "✅ Supabase database backup completed: $TIMESTAMP"
```

### Point-in-Time Recovery
```bash
#!/bin/bash
# /usr/local/bin/supabase-restore.sh

BACKUP_FILE="$1"
TARGET_TIME="$2"  # Format: 2024-01-15 14:30:00

if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: $0 <backup_file> [target_time]"
    exit 1
fi

echo "🔄 Starting Supabase database restore..."

# If target time is specified, use point-in-time recovery
if [ -n "$TARGET_TIME" ]; then
    echo "⏰ Performing point-in-time recovery to: $TARGET_TIME"
    # Note: Point-in-time recovery requires Supabase Pro plan
    # This would typically be done through Supabase Dashboard
    echo "Please use Supabase Dashboard for point-in-time recovery"
    exit 1
fi

# Standard restore from backup file
echo "📁 Restoring from backup file: $BACKUP_FILE"

# Create a new database for testing
createdb -h db.your-project-ref.supabase.co -U postgres test_restore_$(date +%s)

# Restore the backup
pg_restore -h db.your-project-ref.supabase.co -U postgres \
  --dbname=test_restore_$(date +%s) \
  --verbose \
  --clean \
  --if-exists \
  "$BACKUP_FILE"

echo "✅ Database restore completed"
echo "⚠️  Remember to test the restored database before switching"
```

## Application File Backups

### Static Assets and Code Backup
```bash
#!/bin/bash
# /usr/local/bin/app-backup.sh

set -e

APP_DIR="/var/www/ogajobs"
BACKUP_DIR="/var/backups/application"
RETENTION_DAYS=14
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

echo "📦 Starting application backup..."

# Backup application files
tar -czf "$BACKUP_DIR/app_files_$TIMESTAMP.tar.gz" \
  -C /var/www \
  --exclude=ogajobs/node_modules \
  --exclude=ogajobs/.git \
  --exclude=ogajobs/dist \
  --exclude=ogajobs/logs \
  ogajobs

# Backup configuration files
tar -czf "$BACKUP_DIR/config_$TIMESTAMP.tar.gz" \
  /etc/nginx/sites-available/ogajobs \
  /etc/nginx/sites-available/ogajobs-staging \
  /etc/systemd/system/ogajobs* \
  /etc/ssl/certs/ogajobs* \
  /var/www/ogajobs/.env* \
  2>/dev/null || true

# Backup logs
tar -czf "$BACKUP_DIR/logs_$TIMESTAMP.tar.gz" \
  /var/log/nginx/access.log* \
  /var/log/nginx/error.log* \
  /var/log/ogajobs* \
  2>/dev/null || true

# Create backup manifest
cat > "$BACKUP_DIR/manifest_$TIMESTAMP.json" << EOF
{
  "timestamp": "$TIMESTAMP",
  "backup_type": "application",
  "hostname": "$(hostname)",
  "files": {
    "application": "app_files_$TIMESTAMP.tar.gz",
    "configuration": "config_$TIMESTAMP.tar.gz",
    "logs": "logs_$TIMESTAMP.tar.gz"
  },
  "git_commit": "$(cd $APP_DIR && git rev-parse HEAD 2>/dev/null || echo 'unknown')",
  "git_branch": "$(cd $APP_DIR && git branch --show-current 2>/dev/null || echo 'unknown')"
}
EOF

# Upload to cloud storage
if command -v aws &> /dev/null; then
    aws s3 cp "$BACKUP_DIR/" "s3://your-backup-bucket/application/" --recursive --exclude "*" --include "*$TIMESTAMP*"
fi

# Clean old backups
find $BACKUP_DIR -name "*_$TIMESTAMP.*" -type f -mtime +$RETENTION_DAYS -delete

echo "✅ Application backup completed: $TIMESTAMP"
```

### User Uploads Backup (Supabase Storage)
```bash
#!/bin/bash
# /usr/local/bin/storage-backup.sh

set -e

SUPABASE_URL="https://your-project-ref.supabase.co"
SUPABASE_SERVICE_KEY="your-service-role-key"
BACKUP_DIR="/var/backups/storage"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

echo "🗄️ Starting Supabase Storage backup..."

# Get list of buckets
BUCKETS=$(curl -s -H "Authorization: Bearer $SUPABASE_SERVICE_KEY" \
  "$SUPABASE_URL/storage/v1/bucket" | jq -r '.[].name')

for BUCKET in $BUCKETS; do
    echo "📁 Backing up bucket: $BUCKET"
    
    # Create bucket backup directory
    mkdir -p "$BACKUP_DIR/$BUCKET"
    
    # Get list of files in bucket
    FILES=$(curl -s -H "Authorization: Bearer $SUPABASE_SERVICE_KEY" \
      "$SUPABASE_URL/storage/v1/object/list/$BUCKET" | jq -r '.[].name')
    
    # Download each file
    for FILE in $FILES; do
        if [ "$FILE" != "null" ] && [ -n "$FILE" ]; then
            echo "⬇️ Downloading: $FILE"
            curl -s -H "Authorization: Bearer $SUPABASE_SERVICE_KEY" \
              "$SUPABASE_URL/storage/v1/object/$BUCKET/$FILE" \
              -o "$BACKUP_DIR/$BUCKET/$FILE"
        fi
    done
    
    # Create archive for bucket
    tar -czf "$BACKUP_DIR/${BUCKET}_$TIMESTAMP.tar.gz" -C "$BACKUP_DIR" "$BUCKET"
    rm -rf "$BACKUP_DIR/$BUCKET"
done

echo "✅ Supabase Storage backup completed: $TIMESTAMP"
```

## Disaster Recovery Procedures

### Complete System Recovery
```bash
#!/bin/bash
# /usr/local/bin/disaster-recovery.sh

set -e

BACKUP_DATE="$1"
RECOVERY_TYPE="$2" # full, database, application

if [ -z "$BACKUP_DATE" ]; then
    echo "Usage: $0 <backup_date> [recovery_type]"
    echo "Available backups:"
    ls -la /var/backups/*/manifest_*.json | grep -o '[0-9]\{8\}_[0-9]\{6\}' | sort -u
    exit 1
fi

echo "🚨 Starting disaster recovery process..."
echo "📅 Recovery date: $BACKUP_DATE"
echo "🔧 Recovery type: ${RECOVERY_TYPE:-full}"

# Create recovery log
RECOVERY_LOG="/var/log/disaster-recovery-$BACKUP_DATE.log"
exec > >(tee -a $RECOVERY_LOG)
exec 2>&1

echo "$(date): Starting disaster recovery" >> $RECOVERY_LOG

# Stop services
echo "🛑 Stopping services..."
sudo systemctl stop nginx
sudo systemctl stop ogajobs || true

case "${RECOVERY_TYPE:-full}" in
    "database"|"full")
        echo "🗄️ Recovering database..."
        
        # Find database backup
        DB_BACKUP=$(find /var/backups/supabase -name "*$BACKUP_DATE*.dump" | head -1)
        if [ -z "$DB_BACKUP" ]; then
            echo "❌ Database backup not found for date: $BACKUP_DATE"
            exit 1
        fi
        
        echo "📁 Using database backup: $DB_BACKUP"
        
        # Create restore point before recovery
        psql -c "SELECT pg_create_restore_point('before_disaster_recovery_$BACKUP_DATE');"
        
        # Restore database
        pg_restore --clean --if-exists --verbose --dbname=postgres "$DB_BACKUP"
        ;;
esac

case "${RECOVERY_TYPE:-full}" in
    "application"|"full")
        echo "📦 Recovering application files..."
        
        # Find application backup
        APP_BACKUP=$(find /var/backups/application -name "app_files_$BACKUP_DATE*.tar.gz" | head -1)
        if [ -z "$APP_BACKUP" ]; then
            echo "❌ Application backup not found for date: $BACKUP_DATE"
            exit 1
        fi
        
        echo "📁 Using application backup: $APP_BACKUP"
        
        # Backup current application
        sudo mv /var/www/ogajobs "/var/www/ogajobs.pre-recovery.$(date +%s)" || true
        
        # Restore application files
        sudo tar -xzf "$APP_BACKUP" -C /var/www/
        
        # Set proper permissions
        sudo chown -R www-data:www-data /var/www/ogajobs
        sudo chmod -R 755 /var/www/ogajobs
        
        # Restore configuration
        CONFIG_BACKUP=$(find /var/backups/application -name "config_$BACKUP_DATE*.tar.gz" | head -1)
        if [ -n "$CONFIG_BACKUP" ]; then
            echo "⚙️ Restoring configuration..."
            sudo tar -xzf "$CONFIG_BACKUP" -C /
        fi
        
        # Install dependencies and build
        cd /var/www/ogajobs
        npm ci
        npm run build
        ;;
esac

# Start services
echo "🚀 Starting services..."
sudo systemctl start nginx
sudo systemctl start ogajobs || true

# Health check
echo "🏥 Performing health check..."
sleep 10

if curl -f http://localhost/health; then
    echo "✅ Health check passed"
else
    echo "❌ Health check failed"
    
    # Rollback if health check fails
    echo "🔄 Rolling back changes..."
    sudo systemctl stop nginx
    
    if [ -d "/var/www/ogajobs.pre-recovery.*" ]; then
        sudo rm -rf /var/www/ogajobs
        sudo mv /var/www/ogajobs.pre-recovery.* /var/www/ogajobs
    fi
    
    sudo systemctl start nginx
    exit 1
fi

echo "✅ Disaster recovery completed successfully"
echo "📊 Recovery summary:" >> $RECOVERY_LOG
echo "  - Date: $(date)" >> $RECOVERY_LOG
echo "  - Backup date: $BACKUP_DATE" >> $RECOVERY_LOG
echo "  - Recovery type: ${RECOVERY_TYPE:-full}" >> $RECOVERY_LOG
echo "  - Status: SUCCESS" >> $RECOVERY_LOG
```

### Database Migration Recovery
```sql
-- Emergency database recovery procedures

-- Check current migration status
SELECT version FROM public.schema_migrations ORDER BY version DESC LIMIT 10;

-- Rollback to specific migration (if using migration system)
-- This depends on your migration tool

-- Manual data recovery queries
-- Recover deleted records (if soft delete is implemented)
UPDATE public.profiles SET deleted_at = NULL 
WHERE deleted_at IS NOT NULL 
AND deleted_at > '2024-01-15 00:00:00';

-- Restore from audit logs
INSERT INTO public.bookings (id, client_email, artisan_id, work_type, description, status, created_at)
SELECT 
    (old_data->>'id')::uuid,
    old_data->>'client_email',
    (old_data->>'artisan_id')::uuid,
    old_data->>'work_type',
    old_data->>'description',
    old_data->>'status',
    (old_data->>'created_at')::timestamp
FROM public.audit_logs 
WHERE table_name = 'bookings' 
AND operation = 'DELETE'
AND created_at > '2024-01-15 00:00:00';
```

## Backup Monitoring and Alerts

### Backup Verification Script
```bash
#!/bin/bash
# /usr/local/bin/verify-backups.sh

BACKUP_DIR="/var/backups"
ALERT_EMAIL="admin@yourdomain.com"
MAX_AGE_HOURS=25  # Alert if latest backup is older than 25 hours

echo "🔍 Verifying backup integrity..."

# Check database backups
DB_BACKUP=$(find $BACKUP_DIR/supabase -name "supabase_full_*.dump" -mtime -1 | head -1)
if [ -z "$DB_BACKUP" ]; then
    echo "❌ No recent database backup found"
    echo "Missing database backup" | mail -s "ALERT: Backup Failure" $ALERT_EMAIL
    exit 1
fi

# Test database backup integrity
echo "🧪 Testing database backup integrity..."
pg_restore --list "$DB_BACKUP" > /dev/null
if [ $? -ne 0 ]; then
    echo "❌ Database backup is corrupted"
    echo "Corrupted database backup: $DB_BACKUP" | mail -s "ALERT: Backup Corruption" $ALERT_EMAIL
    exit 1
fi

# Check application backups
APP_BACKUP=$(find $BACKUP_DIR/application -name "app_files_*.tar.gz" -mtime -1 | head -1)
if [ -z "$APP_BACKUP" ]; then
    echo "❌ No recent application backup found"
    echo "Missing application backup" | mail -s "ALERT: Backup Failure" $ALERT_EMAIL
    exit 1
fi

# Test application backup integrity
echo "🧪 Testing application backup integrity..."
tar -tzf "$APP_BACKUP" > /dev/null
if [ $? -ne 0 ]; then
    echo "❌ Application backup is corrupted"
    echo "Corrupted application backup: $APP_BACKUP" | mail -s "ALERT: Backup Corruption" $ALERT_EMAIL
    exit 1
fi

echo "✅ All backups verified successfully"
```

### Automated Backup Schedule
```bash
# /etc/cron.d/ogajobs-backups

# Database backup every 6 hours
0 */6 * * * root /usr/local/bin/supabase-backup.sh

# Application backup daily at 2 AM
0 2 * * * root /usr/local/bin/app-backup.sh

# Storage backup daily at 3 AM
0 3 * * * root /usr/local/bin/storage-backup.sh

# Backup verification daily at 4 AM
0 4 * * * root /usr/local/bin/verify-backups.sh

# Weekly full system backup (Sundays at 1 AM)
0 1 * * 0 root /usr/local/bin/full-system-backup.sh
```

## Recovery Testing

### Monthly Disaster Recovery Test
```bash
#!/bin/bash
# /usr/local/bin/dr-test.sh

echo "🧪 Starting disaster recovery test..."

# Create test environment
TEST_DIR="/tmp/dr-test-$(date +%s)"
mkdir -p $TEST_DIR

# Get latest backup
LATEST_BACKUP=$(find /var/backups -name "manifest_*.json" -mtime -1 | head -1)
if [ -z "$LATEST_BACKUP" ]; then
    echo "❌ No recent backup found for testing"
    exit 1
fi

BACKUP_DATE=$(basename $LATEST_BACKUP | grep -o '[0-9]\{8\}_[0-9]\{6\}')

echo "📅 Testing backup from: $BACKUP_DATE"

# Test database restore in temporary database
createdb dr_test_$(date +%s)
DB_BACKUP=$(find /var/backups/supabase -name "*$BACKUP_DATE*.dump" | head -1)
pg_restore --dbname=dr_test_$(date +%s) "$DB_BACKUP"

# Verify data integrity
RECORD_COUNT=$(psql -t -c "SELECT COUNT(*) FROM public.profiles;" dr_test_$(date +%s))
if [ "$RECORD_COUNT" -lt 1 ]; then
    echo "❌ Data integrity test failed"
    exit 1
fi

# Test application restore
APP_BACKUP=$(find /var/backups/application -name "app_files_$BACKUP_DATE*.tar.gz" | head -1)
tar -xzf "$APP_BACKUP" -C $TEST_DIR

# Verify application files
if [ ! -f "$TEST_DIR/ogajobs/package.json" ]; then
    echo "❌ Application restore test failed"
    exit 1
fi

# Cleanup
dropdb dr_test_$(date +%s)
rm -rf $TEST_DIR

echo "✅ Disaster recovery test completed successfully"
```

This comprehensive backup and disaster recovery system ensures business continuity with multiple recovery options and regular testing procedures.