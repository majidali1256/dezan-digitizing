const { query, pool } = require('../server/config/db');

async function check() {
    try {
        const res = await query('SELECT DISTINCT status FROM public.orders');
        console.log('Distinct statuses in orders:', res.rows.map(r => r.status));
        const resTasks = await query('SELECT DISTINCT status FROM public.digitizer_tasks');
        console.log('Distinct statuses in digitizer_tasks:', resTasks.rows.map(r => r.status));
    } catch (err) {
        console.error('Check error:', err);
    } finally {
        await pool.end();
    }
}

check();
