// One-time import of users + timesheet entries from the "Timesheet" Google Sheet.
// The data lives in scripts/hoh_import.sql. It runs as one transaction and can only run once
// (it records itself in the data_imports table).
//
// Two ways to run it:
//   1. On Railway: set the variable RUN_TIMESHEET_IMPORT=true on the app service and redeploy.
//      server.js runs the import at startup if it hasn't run yet. Remove the variable afterwards.
//   2. From your computer, inside this folder:
//        DATABASE_URL="<DATABASE_PUBLIC_URL>" node scripts/import-timesheet.js --dry-run   (preview)
//        DATABASE_URL="<DATABASE_PUBLIC_URL>" node scripts/import-timesheet.js             (apply)
const fs = require('fs');
const path = require('path');

const IMPORT_NAME = 'timesheet-sheet-2026-11-18';

async function alreadyImported(db) {
  const { rows } = await db.query(
    "SELECT 1 FROM information_schema.tables WHERE table_name = 'data_imports'");
  if (!rows.length) return false;
  const r = await db.query('SELECT 1 FROM data_imports WHERE name = $1', [IMPORT_NAME]);
  return r.rows.length > 0;
}

// db: a pg Pool or Client. Returns the report rows (kept / deleted users with entry counts).
async function runTimesheetImport(db, { dryRun = false } = {}) {
  if (await alreadyImported(db)) return null;
  let sql = fs.readFileSync(path.join(__dirname, 'hoh_import.sql'), 'utf8');
  if (dryRun) sql = sql.replace(/COMMIT;\s*$/, 'ROLLBACK;\n');
  // A pool may hand each query to a different connection, so run the whole file on one client.
  const client = typeof db.connect === 'function' && db.totalCount !== undefined ? await db.connect() : db;
  try {
    const results = [].concat(await client.query(sql));
    const report = results.filter(r => r.command === 'SELECT' && r.fields.some(f => f.name === 'what')).pop();
    return report ? report.rows : [];
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {});
    throw e;
  } finally {
    if (client !== db) client.release();
  }
}

module.exports = { runTimesheetImport };

if (require.main === module) {
  const { Client } = require('pg');
  const url = process.env.DATABASE_URL;
  if (!url) { console.error('Set DATABASE_URL first (Railway → Postgres → Variables → DATABASE_PUBLIC_URL).'); process.exit(1); }
  const dryRun = process.argv.includes('--dry-run');
  const local = /localhost|127\.0\.0\.1|host=\/tmp/.test(url);
  const client = new Client({ connectionString: url, ssl: local ? false : { rejectUnauthorized: false } });
  (async () => {
    await client.connect();
    try {
      const rows = await runTimesheetImport(client, { dryRun });
      if (rows === null) { console.log('This import has already been applied — nothing to do.'); return; }
      console.table(rows);
      console.log(dryRun ? '\nDRY RUN — nothing was changed. Run again without --dry-run to apply.'
                         : '\nDone — users and timesheet entries are updated.');
    } catch (e) {
      console.error('Import failed, nothing was changed:', e.message);
      process.exitCode = 1;
    } finally { await client.end(); }
  })();
}
