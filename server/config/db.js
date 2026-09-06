/**
 * Database Connection Pool (PostgreSQL / InsForge)
 */
const { Pool } = require('pg');
const config = require('./config');

const pool = new Pool({
    connectionString: config.db.connectionString,
    ssl: config.db.ssl,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000
});

pool.on('error', (err) => {
    console.error('[Database Pool Error]:', err.message);
});

/**
 * Execute parameterized query
 * @param {string} text 
 * @param {Array} params 
 * @returns {Promise<import('pg').QueryResult>}
 */
const query = async (text, params = []) => {
    const start = Date.now();
    try {
        const res = await pool.query(text, params);
        const duration = Date.now() - start;
        if (config.nodeEnv === 'development' && duration > 500) {
            console.warn(`[Slow Query] (${duration}ms):`, text.substring(0, 80));
        }
        return res;
    } catch (error) {
        console.error('[DB Query Error]:', error.message, 'SQL:', text.substring(0, 100));
        throw error;
    }
};

/**
 * Test connectivity
 */
const testConnection = async () => {
    try {
        const res = await pool.query('SELECT NOW() as now, count(*) as count FROM public.profiles');
        console.log(`[DB Connected] Time: ${res.rows[0].now} | Active Profiles: ${res.rows[0].count}`);
        return true;
    } catch (err) {
        console.error('[DB Connection Failed]:', err.message);
        return false;
    }
};

module.exports = {
    pool,
    query,
    testConnection
};
