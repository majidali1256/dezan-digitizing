const { query, pool } = require('../server/config/db');
const fs = require('fs');
const path = require('path');

async function run() {
    try {
        console.log('Connecting to PostgreSQL database...');
        const sqlPath = path.resolve(__dirname, '../migrations/20260911130000_order_workflow_viewed_started.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        console.log('Executing migration...');
        await query(sql);
        console.log('Migration applied successfully!');
    } catch (err) {
        console.warn('Migration run notice (offline or pool error):', err.message);
    } finally {
        await pool.end().catch(() => {});
    }
}

run();
