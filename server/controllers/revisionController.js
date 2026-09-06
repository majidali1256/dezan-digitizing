/**
 * Revision & Physical Sew-Out Defect Controller
 * Handles client revision requests with physical sew-out defect proof synchronization
 */
const { query } = require('../config/db');
const { success, error, badRequest, notFound, forbidden } = require('../utils/apiResponse');

/**
 * Submit Revision Request
 * POST /api/revisions
 */
const submitRevision = async (req, res) => {
    try {
        const { orderId, revisionNotes, stitchOutPhotos = [] } = req.body;
        const user = req.user;

        if (!orderId || !revisionNotes) {
            return badRequest(res, 'Order ID and revision notes are required');
        }

        // Fetch order
        const orderRes = await query('SELECT * FROM public.orders WHERE (id::text = $1 OR order_number = $1)', [orderId]);
        if (orderRes.rows.length === 0) {
            return notFound(res, 'Order not found');
        }
        const order = orderRes.rows[0];

        // Guard: ensure client owns the order or is admin
        if (user.role === 'client' && order.client_id !== user.id && order.client_email.toLowerCase() !== user.email.toLowerCase()) {
            return forbidden(res, 'You do not have permission to request a revision on this order');
        }

        // 1. Update Order in public.orders
        const updatedOrderRes = await query(
            `UPDATE public.orders 
             SET status = 'revision_requested', 
                 revision_notes = $1, 
                 stitch_out_photos = $2, 
                 revision_count = COALESCE(revision_count, 0) + 1, 
                 revision_requested_at = NOW(), 
                 updated_at = NOW() 
             WHERE id = $3 
             RETURNING *`,
            [revisionNotes, JSON.stringify(stitchOutPhotos), order.id]
        );

        // 2. Synchronize to public.digitizer_tasks
        await query(
            `UPDATE public.digitizer_tasks 
             SET status = 'revision', 
                 revision_notes = $1, 
                 stitch_out_photos = $2, 
                 revision_requested_at = NOW(), 
                 updated_at = NOW() 
             WHERE order_id = $3`,
            [revisionNotes, JSON.stringify(stitchOutPhotos), order.id]
        );

        return success(res, updatedOrderRes.rows[0], 'Revision request submitted and assigned to digitizer for adjustment', 201);
    } catch (err) {
        console.error('[Submit Revision Error]:', err);
        return error(res, `Failed to submit revision: ${err.message}`);
    }
};

module.exports = {
    submitRevision
};
