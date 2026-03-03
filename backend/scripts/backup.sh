#!/bin/bash
# Daily backup script for Railway PostgreSQL

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="backup_${TIMESTAMP}.sql"

echo "🔄 Starting backup: ${BACKUP_FILE}"

# Create backup
pg_dump $DATABASE_URL > $BACKUP_FILE

# Compress
gzip $BACKUP_FILE

echo "✅ Backup completed: ${BACKUP_FILE}.gz"

# Keep only last 7 days
find . -name "backup_*.sql.gz" -mtime +7 -delete

echo "🧹 Old backups cleaned up"
