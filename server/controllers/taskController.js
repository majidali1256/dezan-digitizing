/**
 * Digitizer Worker Tasks Controller
 * Enforces strict Physical Data Masking: ZERO customer PII and ZERO pricing fields
 */
const { query } = require('../config/db');
const { success, error, badRequest, notFound, forbidden } = require('../utils/apiResponse');
const emailService = require('../services/emailService');

// Sanitized columns projection ensuring zero client PII or commercial pricing data is selected
const SANITIZED_TASK_COLUMNS = `
    id, task_number, order_number, order_id, assigned_digitizer_id,
    service_type, placement, sizing, file_format, instructions,
    raw_artwork_files, fabric_type, revision_notes, stitch_out_photos,
    status, deliverables, assigned_at, digitizer_viewed_at, started_at, is_unread,
    completed_at, updated_at
`;

/**
 * Get Digitizer Tasks Queue
 * GET /api/tasks
 */
const getTasks = async (req, res) => {
    try {
        const user = req.user;
        const { status } = req.query;

        let whereClauses = [];
        let params = [];
        let paramIndex = 1;

        // Quotes can never be digitizer tasks
        whereClauses.push("NOT (order_number LIKE 'QUO-%')");

        // If worker, strictly isolate to their assigned tasks
        if (user.role === 'digitizer') {
            whereClauses.push(`assigned_digitizer_id = $${paramIndex}`);
            params.push(user.id);
            paramIndex++;
        }

        if (status && status !== 'all') {
            whereClauses.push(`status = $${paramIndex}`);
            params.push(status);
            paramIndex++;
        }

        const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

        const tasksRes = await query(
            `SELECT ${SANITIZED_TASK_COLUMNS} 
             FROM public.digitizer_tasks 
             ${whereSql} 
             ORDER BY assigned_at DESC`,
            params
        );

        return success(res, tasksRes.rows, 'Worker task queue retrieved (Sanitized & Masked)');
    } catch (err) {
        console.error('[Get Tasks Error]:', err);
        return error(res, `Failed to retrieve worker tasks: ${err.message}`);
    }
};

/**
 * Get Single Sanitized Task
 * GET /api/tasks/:id
 */
const getTaskById = async (req, res) => {
    try {
        const { id } = req.params;
        const user = req.user;

        const taskRes = await query(
            `SELECT ${SANITIZED_TASK_COLUMNS} 
             FROM public.digitizer_tasks 
             WHERE (id::text = $1 OR task_number = $1)`,
            [id]
        );

        if (taskRes.rows.length === 0) {
            return notFound(res, 'Task not found');
        }

        const task = taskRes.rows[0];

        // Strict guard: Quotes are administrative between Admin & Client only
        if (task.order_number && task.order_number.startsWith('QUO-')) {
            return forbidden(res, 'Quotes are strictly handled by Admin. Digitizers only access active production orders.');
        }

        // Guard: ensure digitizer is assigned to this task
        if (user.role === 'digitizer' && task.assigned_digitizer_id !== user.id) {
            return forbidden(res, 'You do not have access to this task assignment');
        }

        return success(res, task, 'Sanitized task retrieved');
    } catch (err) {
        console.error('[Get Task By ID Error]:', err);
        return error(res, `Failed to retrieve task: ${err.message}`);
    }
};

/**
 * Update Task Status (Digitizer or Admin)
 * PUT /api/tasks/:id/status
 */
const updateTaskStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const user = req.user;

        const validStatuses = ['assigned', 'in_progress', 'qa_review', 'completed', 'revision'];
        if (!validStatuses.includes(status)) {
            return badRequest(res, `Invalid status. Allowed values: ${validStatuses.join(', ')}`);
        }

        // Fetch task
        const taskRes = await query('SELECT * FROM public.digitizer_tasks WHERE (id::text = $1 OR task_number = $1)', [id]);
        if (taskRes.rows.length === 0) {
            return notFound(res, 'Task not found');
        }
        const task = taskRes.rows[0];

        if (user.role === 'digitizer' && task.assigned_digitizer_id !== user.id) {
            return forbidden(res, 'You can only update tasks assigned to you');
        }

        const completedAtSql = (status === 'completed') ? 'NOW()' : 'completed_at';

        // Update task
        const updateTaskRes = await query(
            `UPDATE public.digitizer_tasks 
             SET status = $1, 
                 completed_at = ${completedAtSql}, 
                 updated_at = NOW() 
             WHERE id = $2 
             RETURNING ${SANITIZED_TASK_COLUMNS}`,
            [status, task.id]
        );

        // Sync status to master orders
        const orderStatusMap = {
            'assigned': 'assigned',
            'in_progress': 'in_progress',
            'qa_review': 'qa_review',
            'completed': 'completed',
            'revision': 'revision_requested'
        };

        const targetOrderStatus = orderStatusMap[status] || status;
        await query(
            'UPDATE public.orders SET status = $1, updated_at = NOW() WHERE id = $2',
            [targetOrderStatus, task.order_id]
        );

        return success(res, updateTaskRes.rows[0], `Task status updated to ${status}`);
    } catch (err) {
        console.error('[Update Task Status Error]:', err);
        return error(res, `Failed to update task status: ${err.message}`);
    }
};

/**
 * Upload Stitch Deliverables (.DST, .EMB)
 * POST /api/tasks/:id/deliverables
 */
const uploadDeliverables = async (req, res) => {
    try {
        const { id } = req.params;
        const { deliverables = [] } = req.body;
        const user = req.user;

        if (!Array.isArray(deliverables) || deliverables.length === 0) {
            return badRequest(res, 'At least one deliverable file specification is required');
        }

        const taskRes = await query('SELECT * FROM public.digitizer_tasks WHERE (id::text = $1 OR task_number = $1 OR order_number = $1)', [id]);
        if (taskRes.rows.length === 0) {
            return notFound(res, 'Task not found');
        }
        const task = taskRes.rows[0];

        if (user.role === 'digitizer' && task.assigned_digitizer_id !== user.id) {
            return forbidden(res, 'You can only submit deliverables for your assigned tasks');
        }

        // 1. Update digitizer_tasks
        const updatedTask = await query(
            `UPDATE public.digitizer_tasks 
             SET deliverables = $1, 
                 status = 'completed', 
                 completed_at = NOW(), 
                 updated_at = NOW() 
             WHERE id = $2 
             RETURNING ${SANITIZED_TASK_COLUMNS}`,
            [JSON.stringify(deliverables), task.id]
        );

        // 2. Sync deliverables and completion to master order
        const updatedOrderRes = await query(
            `UPDATE public.orders 
             SET deliverables = $1, 
                 status = 'completed', 
                 updated_at = NOW() 
             WHERE id = $2
             RETURNING *`,
            [JSON.stringify(deliverables), task.order_id]
        );

        if (updatedOrderRes.rows.length > 0) {
            const completedOrder = updatedOrderRes.rows[0];
            emailService.sendDeliverablesReadyAlert(completedOrder, completedOrder.customer_email || completedOrder.client_email)
                .catch(e => console.warn('[Deliverables Email Alert Warning]:', e.message));
            emailService.sendDeliverablesUploadedAdminAlert(completedOrder, deliverables)
                .catch(e => console.warn('[Admin Deliverables Alert Warning]:', e.message));
        }

        return success(res, updatedTask.rows[0], 'Deliverables submitted and synchronized to order successfully');
    } catch (err) {
        console.error('[Upload Deliverables Error]:', err);
        return error(res, `Failed to submit deliverables: ${err.message}`);
    }
};

/**
 * Mark Task as Viewed by Digitizer
 * POST /api/tasks/:id/view
 */
const markTaskViewed = async (req, res) => {
    try {
        const { id } = req.params;
        const user = req.user;

        const taskRes = await query('SELECT * FROM public.digitizer_tasks WHERE (id::text = $1 OR task_number = $1 OR order_number = $1)', [id]);
        if (taskRes.rows.length === 0) {
            return notFound(res, 'Task not found');
        }
        const task = taskRes.rows[0];

        if (user.role === 'digitizer' && task.assigned_digitizer_id !== user.id) {
            return forbidden(res, 'You can only view tasks assigned to you');
        }

        const viewedAt = new Date().toISOString();

        // Update digitizer_tasks: remove unread, set viewed timestamp (only if not already viewed)
        const updateTaskRes = await query(
            `UPDATE public.digitizer_tasks 
             SET is_unread = FALSE, 
                 digitizer_viewed_at = COALESCE(digitizer_viewed_at, $1), 
                 updated_at = NOW() 
             WHERE id = $2 
             RETURNING ${SANITIZED_TASK_COLUMNS}`,
            [viewedAt, task.id]
        );

        // Synchronize to public.orders
        await query(
            `UPDATE public.orders 
             SET is_unread = FALSE, 
                 digitizer_viewed_at = COALESCE(digitizer_viewed_at, $1), 
                 updated_at = NOW() 
             WHERE id = $2`,
            [viewedAt, task.order_id]
        );

        return success(res, updateTaskRes.rows[0], 'Task marked as viewed/seen by digitizer');
    } catch (err) {
        console.error('[Mark Task Viewed Error]:', err);
        return error(res, `Failed to mark task viewed: ${err.message}`);
    }
};

/**
 * Start Task Production (Transitions to 'in_progress')
 * POST /api/tasks/:id/start
 */
const startTask = async (req, res) => {
    try {
        const { id } = req.params;
        const user = req.user;

        const taskRes = await query('SELECT * FROM public.digitizer_tasks WHERE (id::text = $1 OR task_number = $1 OR order_number = $1)', [id]);
        if (taskRes.rows.length === 0) {
            return notFound(res, 'Task not found');
        }
        const task = taskRes.rows[0];

        if (user.role === 'digitizer' && task.assigned_digitizer_id !== user.id) {
            return forbidden(res, 'You can only start tasks assigned to you');
        }

        const startedAt = new Date().toISOString();

        // Update digitizer_tasks: status = in_progress, started_at = NOW(), is_unread = false
        const updateTaskRes = await query(
            `UPDATE public.digitizer_tasks 
             SET status = 'in_progress', 
                 started_at = COALESCE(started_at, $1), 
                 digitizer_viewed_at = COALESCE(digitizer_viewed_at, $1),
                 is_unread = FALSE, 
                 updated_at = NOW() 
             WHERE id = $2 
             RETURNING ${SANITIZED_TASK_COLUMNS}`,
            [startedAt, task.id]
        );

        // Synchronize to public.orders
        await query(
            `UPDATE public.orders 
             SET status = 'in_progress', 
                 started_at = COALESCE(started_at, $1), 
                 digitizer_viewed_at = COALESCE(digitizer_viewed_at, $1),
                 is_unread = FALSE, 
                 updated_at = NOW() 
             WHERE id = $2`,
            [startedAt, task.order_id]
        );

        return success(res, updateTaskRes.rows[0], 'Task production started (status changed to in_progress)');
    } catch (err) {
        console.error('[Start Task Error]:', err);
        return error(res, `Failed to start task: ${err.message}`);
    }
};

module.exports = {
    getTasks,
    getTaskById,
    updateTaskStatus,
    uploadDeliverables,
    markTaskViewed,
    startTask
};
