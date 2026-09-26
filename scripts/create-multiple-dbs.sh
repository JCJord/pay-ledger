#!/bin/bash
# Creates all PayLedger databases on Postgres startup.
# This script is mounted at /docker-entrypoint-initdb.d/ and runs once on first start.

set -e
set -u

DATABASES=(
  "payledger_auth"
  "payledger_accounts"
  "payledger_invoices"
  "payledger_ledger"
)

for DB in "${DATABASES[@]}"; do
  echo "Creating database: $DB"
  psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE DATABASE $DB;
    GRANT ALL PRIVILEGES ON DATABASE $DB TO $POSTGRES_USER;
EOSQL
done

echo "All PayLedger databases created successfully."
