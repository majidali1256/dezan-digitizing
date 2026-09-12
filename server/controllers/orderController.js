/**
 * Orders Management Controller
 * Enforces strict authorization, client isolation, and operational workflows
 */
const crypto = require('crypto');
const { query } = require('../config/db');
const { success, error, badRequest, notFound, forbidden } = require('../utils/apiResponse');
const { generateOrderNumber, generateTaskNumber } = require('../utils/orderNumber');
const emailService = require('../services/emailService');

/**
 * Create Order
 * POST /api/orders
 */
const createOrder = async (req, res) => {
    try {
        const {
            serviceType,
            planName,
            projectName,
            placement,
            sizing,
            fabricType,
            fileFormat,
            instructions,
            rawArtworkFiles = [],
            price = 0.00,
            specialOptions = {},
            turnaroundSpeed = 'standard',
            paymentMethod = 'PayPal',
            paymentStatus = 'unpaid',
            transactionId = null,
            // Guest checkout fields if unauthenticated
            clientName,
            clientEmail,
            clientCompany,
            customerName,
            customerEmail
        } = req.body;

        // Determine client metadata
        let clientId = null;
        let finalClientName = clientName || customerName;
        let finalClientEmail = clientEmail || customerEmail;
        let finalClientCompany = clientCompany || null;

        if (req.user) {
            if (req.user.role === 'admin' || req.user.role === 'digitizer') {
                return forbidden(res, "You can't place orders from this account");
            }
            clientId = req.user.id;
            finalClientName = req.user.display_name;
            finalClientEmail = req.user.email;
            finalClientCompany = req.user.company || null;
        }

        const normalizedCheckEmail = (finalClientEmail || '').trim().toLowerCase();
        if (normalizedCheckEmail === 'admin@dezandigitizing.com' || normalizedCheckEmail === 'fdezan91@gmail.com' || normalizedCheckEmail === 'digitizer@dezandigitizing.com') {
            return forbidden(res, "You can't place orders from this account");
        }

        if (!serviceType || !projectName || !placement) {
            return badRequest(res, 'Service type, project name, and target placement are required');
        }

        if (!finalClientEmail || !finalClientName) {
            return badRequest(res, 'Client name and email are required to create an order');
        }

        const orderId = crypto.randomUUID();
        const orderNumber = generateOrderNumber();
        const finalPrice = parseFloat(price) || 0.00;

        // Extract traffic and marketing attribution
        const attr = req.body.attribution || {};
        const originalSource = (req.body.originalSource || req.body.original_source || attr.original_source || attr.originalSource || 'direct').slice(0, 100);
        const lastSource = (req.body.lastSource || req.body.last_source || attr.last_source || attr.lastSource || originalSource || 'direct').slice(0, 100);
        const landingPage = req.body.landingPage || req.body.landing_page || attr.landing_page || attr.landingPage || null;
        const referralSource = req.body.referralSource || req.body.referral_source || attr.referral_source || attr.referralSource || null;
        const utmSource = req.body.utmSource || req.body.utm_source || attr.utm_source || attr.utmSource || null;
        const utmMedium = req.body.utmMedium || req.body.utm_medium || attr.utm_medium || attr.utmMedium || null;
        const utmCampaign = req.body.utmCampaign || req.body.utm_campaign || attr.utm_campaign || attr.utmCampaign || null;
        const utmContent = req.body.utmContent || req.body.utm_content || attr.utm_content || attr.utmContent || null;
        const utmTerm = req.body.utmTerm || req.body.utm_term || attr.utm_term || attr.utmTerm || null;
        const gclid = req.body.gclid || attr.gclid || null;
        const gbraid = req.body.gbraid || attr.gbraid || null;
        const wbraid = req.body.wbraid || attr.wbraid || null;
        const attributionData = JSON.stringify(attr.attributionData || attr.attribution_data || (typeof attr === 'object' ? attr : {}));

        const insertRes = await query(
            `INSERT INTO public.orders 
                (id, order_number, client_id, client_name, client_email, client_company,
                 service_type, plan_name, project_name, placement, sizing, fabric_type,
                 file_format, instructions, raw_artwork_files, price, currency,
                 payment_status, payment_method, transaction_id, status, is_quote,
                 special_options, turnaround_speed, revision_count,
                 original_source, last_source, landing_page, referral_source,
                 utm_source, utm_medium, utm_campaign, utm_content, utm_term,
                 gclid, gbraid, wbraid, attribution_data, created_at, updated_at)
             VALUES 
                ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
                 'USD', $17, $18, $19, 'pending_review', false, $20, $21, 0,
                 $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, NOW(), NOW())
             RETURNING *`,
            [
                orderId,
                orderNumber,
                clientId,
                finalClientName,
                finalClientEmail.toLowerCase().trim(),
                finalClientCompany,
                serviceType,
                planName || 'Standard Order',
                projectName,
                placement,
                sizing || 'Standard Size',
                fabricType || 'Standard Cotton / Twill',
                fileFormat || 'DST, EMB',
                instructions || '',
                JSON.stringify(rawArtworkFiles),
                finalPrice,
                paymentStatus,
                paymentMethod,
                transactionId,
                JSON.stringify(specialOptions),
                turnaroundSpeed,
                originalSource,
                lastSource,
                landingPage,
                referralSource,
                utmSource,
                utmMedium,
                utmCampaign,
                utmContent,
                utmTerm,
                gclid,
                gbraid,
                wbraid,
                attributionData
            ]
        );

        const createdOrder = insertRes.rows[0];

        // Trigger asynchronous email notifications (non-blocking)
        emailService.sendOrderConfirmation(createdOrder, finalClientEmail.toLowerCase().trim()).catch(e => console.warn('[Email Trigger Error]:', e.message));
        emailService.sendNewOrderAdminAlert(createdOrder).catch(e => console.warn('[Admin Alert Trigger Error]:', e.message));

        return success(res, createdOrder, 'Order created successfully', 201);
    } catch (err) {
        console.error('[Create Order Error]:', err);
        return error(res, `Failed to create order: ${err.message}`);
    }
};

/**
 * Get Orders (Role-Aware)
 * GET /api/orders
 */
const getOrders = async (req, res) => {
    try {
        const user = req.user;
        const { status, search, page = 1, limit = 50 } = req.query;

        // Workers are cryptographically forbidden from reading master commercial orders
        if (user.role === 'digitizer') {
            return forbidden(res, 'Digitizer workers must access assignments via /api/tasks to maintain customer privacy compliance');
        }

        const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
        let whereClauses = [];
        let params = [];
        let paramIndex = 1;

        // If client, restrict strictly to own orders
        if (user.role === 'client') {
            whereClauses.push(`(client_id = $${paramIndex} OR LOWER(client_email) = LOWER($${paramIndex + 1}))`);
            params.push(user.id, user.email);
            paramIndex += 2;
        }

        // Filter out quotes unless explicitly requested
        whereClauses.push(`is_quote = false`);

        // Status filter
        if (status && status !== 'all') {
            whereClauses.push(`status = $${paramIndex}`);
            params.push(status);
            paramIndex++;
        }

        // Search query
        if (search) {
            whereClauses.push(`(
                order_number ILIKE $${paramIndex} OR 
                project_name ILIKE $${paramIndex} OR 
                client_name ILIKE $${paramIndex}
            )`);
            params.push(`%${search}%`);
            paramIndex++;
        }

        const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

        // Query orders
        const ordersRes = await query(
            `SELECT * FROM public.orders ${whereSql} ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
            [...params, parseInt(limit, 10), offset]
        );

        // Count total matching
        const countRes = await query(
            `SELECT COUNT(*) as total FROM public.orders ${whereSql}`,
            params
        );

        const total = parseInt(countRes.rows[0].total, 10);

        return success(res, ordersRes.rows, 'Orders retrieved successfully', 200, {
            total,
            page: parseInt(page, 10),
            limit: parseInt(limit, 10),
            totalPages: Math.ceil(total / parseInt(limit, 10))
        });
    } catch (err) {
        console.error('[Get Orders Error]:', err);
        return error(res, `Failed to retrieve orders: ${err.message}`);
    }
};

/**
 * Get Order by ID
 * GET /api/orders/:id
 */
const getOrderById = async (req, res) => {
    try {
        const { id } = req.params;
        const user = req.user;

        if (user.role === 'digitizer') {
            return forbidden(res, 'Digitizers cannot query orders directly. Use /api/tasks/:id');
        }

        const orderRes = await query('SELECT * FROM public.orders WHERE (id::text = $1 OR order_number = $1)', [id]);

        if (orderRes.rows.length === 0) {
            return notFound(res, 'Order not found');
        }

        const order = orderRes.rows[0];

        // Ensure client owns the order
        if (user.role === 'client' && order.client_id !== user.id && order.client_email.toLowerCase() !== user.email.toLowerCase()) {
            return forbidden(res, 'You do not have permission to view this order');
        }

        return success(res, order, 'Order details retrieved');
    } catch (err) {
        console.error('[Get Order By ID Error]:', err);
        return error(res, `Failed to retrieve order: ${err.message}`);
    }
};

/**
 * Update Order Status (Admin Only)
 * PUT /api/orders/:id/status
 */
const updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const validStatuses = [
            'pending_review', 'assigned', 'in_progress', 'qa_review', 
            'revision_requested', 'completed', 'cancelled'
        ];

        if (!validStatuses.includes(status)) {
            return badRequest(res, `Invalid status. Valid values: ${validStatuses.join(', ')}`);
        }

        const updateRes = await query(
            'UPDATE public.orders SET status = $1, updated_at = NOW() WHERE (id::text = $2 OR order_number = $2) RETURNING *',
            [status, id]
        );

        if (updateRes.rows.length === 0) {
            return notFound(res, 'Order not found');
        }

        return success(res, updateRes.rows[0], 'Order status updated successfully');
    } catch (err) {
        console.error('[Update Order Status Error]:', err);
        return error(res, `Failed to update order status: ${err.message}`);
    }
};

/**
 * Assign Digitizer Worker to Order (Admin Only)
 * POST /api/orders/:id/assign
 */
const assignDigitizer = async (req, res) => {
    try {
        const { id } = req.params;
        const { digitizerId, digitizerName } = req.body;

        if (!digitizerId || !digitizerName) {
            return badRequest(res, 'Digitizer ID and name are required');
        }

        // Fetch order details
        const orderRes = await query('SELECT * FROM public.orders WHERE (id::text = $1 OR order_number = $1)', [id]);
        if (orderRes.rows.length === 0) {
            return notFound(res, 'Order not found');
        }
        const order = orderRes.rows[0];

        // Quotes can ONLY be appraised and handled by Admin; digitizers only work on active production orders
        if (order.is_quote === true || order.status === 'quote_requested' || (order.order_number && order.order_number.startsWith('QUO-'))) {
            return badRequest(res, 'Quotes can only be sent to and reviewed by Admin. Digitizers only receive approved production orders.');
        }

        // 1. Update Order in public.orders
        const updatedOrderRes = await query(
            `UPDATE public.orders 
             SET assigned_digitizer_id = $1, 
                 assigned_digitizer_name = $2, 
                 assigned_at = NOW(), 
                 status = 'assigned', 
                 digitizer_viewed_at = NULL,
                 started_at = NULL,
                 is_unread = TRUE,
                 updated_at = NOW() 
             WHERE id = $3 
             RETURNING *`,
            [digitizerId, digitizerName, order.id]
        );

        // 2. Synchronize to public.digitizer_tasks (Sanitized - Zero PII, Zero Pricing)
        const taskNumber = generateTaskNumber(order.order_number);
        const existingTask = await query('SELECT id FROM public.digitizer_tasks WHERE order_id = $1', [order.id]);

        if (existingTask.rows.length > 0) {
            await query(
                `UPDATE public.digitizer_tasks 
                 SET assigned_digitizer_id = $1, 
                     status = 'assigned', 
                     assigned_at = NOW(), 
                     digitizer_viewed_at = NULL,
                     started_at = NULL,
                     is_unread = TRUE,
                     updated_at = NOW() 
                 WHERE id = $2`,
                [digitizerId, existingTask.rows[0].id]
            );
        } else {
            await query(
                `INSERT INTO public.digitizer_tasks 
                    (id, task_number, order_number, order_id, assigned_digitizer_id,
                     service_type, placement, sizing, file_format, instructions,
                     raw_artwork_files, fabric_type, status, deliverables, assigned_at, 
                     digitizer_viewed_at, started_at, is_unread, updated_at)
                 VALUES 
                    ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'assigned', '[]'::jsonb, NOW(), NULL, NULL, TRUE, NOW())`,
                [
                    crypto.randomUUID(),
                    taskNumber,
                    order.order_number,
                    order.id,
                    digitizerId,
                    order.service_type,
                    order.placement,
                    order.sizing,
                    order.file_format,
                    order.instructions,
                    JSON.stringify(order.raw_artwork_files || []),
                    order.fabric_type
                ]
            );
        }

        // Trigger notification to worker
        try {
            const workerProfileRes = await query('SELECT email FROM public.profiles WHERE id = $1', [digitizerId]);
            const workerEmail = workerProfileRes.rows.length > 0 ? workerProfileRes.rows[0].email : null;
            if (workerEmail) {
                emailService.sendTaskAssignedAlert({
                    id: taskNumber,
                    order_number: order.order_number,
                    fabric_type: order.fabric_type,
                    placement: order.placement,
                    format: order.file_format,
                    target_size: order.sizing
                }, workerEmail).catch(e => console.warn('[Worker Alert Error]:', e.message));
            }
        } catch (mailErr) {
            console.warn('[Worker Email Trigger Warning]:', mailErr.message);
        }

        return success(res, updatedOrderRes.rows[0], `Order assigned to ${digitizerName} successfully`);
    } catch (err) {
        console.error('[Assign Digitizer Error]:', err);
        return error(res, `Failed to assign digitizer: ${err.message}`);
    }
};

/**
 * Confirm Order Payment
 * POST /api/orders/:id/payment
 */
const confirmPayment = async (req, res) => {
    try {
        const { id } = req.params;
        const { paymentMethod = 'PayPal', transactionId = null } = req.body;

        const updateRes = await query(
            `UPDATE public.orders 
             SET payment_status = 'paid', 
                 payment_method = $1, 
                 transaction_id = COALESCE($2, transaction_id),
                 updated_at = NOW() 
             WHERE (id::text = $3 OR order_number = $3) 
             RETURNING *`,
            [paymentMethod, transactionId, id]
        );

        if (updateRes.rows.length === 0) {
            return notFound(res, 'Order not found');
        }

        const paidOrder = updateRes.rows[0];

        // Dispatch customer confirmation email and admin dispatch notification asynchronously
        try {
            const clientEmail = paidOrder.client_email || (req.user && req.user.email);
            if (clientEmail) {
                emailService.sendOrderConfirmation(paidOrder, clientEmail).catch(e => console.warn('[Email Warning]:', e.message));
            }
            emailService.sendNewOrderAdminAlert(paidOrder).catch(e => console.warn('[Email Warning]:', e.message));
        } catch (e) {
            console.warn('[Email Dispatch Warning]:', e.message);
        }

        return success(res, paidOrder, 'Payment confirmed successfully');
    } catch (err) {
        console.error('[Confirm Payment Error]:', err);
        return error(res, `Failed to confirm payment: ${err.message}`);
    }
};

/**
 * Track Order Public Endpoint (No Auth Required)
 * GET /api/orders/track?orderNumber=ORD-XXXX&email=customer@example.com
 */
const trackOrder = async (req, res) => {
    try {
        const { orderNumber, email } = req.query;

        if (!orderNumber || !email) {
            return badRequest(res, 'Both orderNumber and email are required to track an order.');
        }

        const normalizedEmail = email.trim().toLowerCase();
        const trimmedOrderNumber = orderNumber.trim();

        // Search for order matching order_number and client_email
        const orderRes = await query(
            `SELECT * FROM public.orders 
             WHERE (LOWER(order_number) = LOWER($1) OR id::text = $1)
               AND LOWER(client_email) = $2`,
            [trimmedOrderNumber, normalizedEmail]
        );

        if (orderRes.rows.length === 0) {
            return notFound(res, 'No order found matching this order number and email combination. Please check your spelling.');
        }

        const order = orderRes.rows[0];

        // Fetch any revision requests for this order
        let revisions = [];
        try {
            const revRes = await query(
                `SELECT id, revision_number, notes, status, created_at 
                 FROM public.revisions 
                 WHERE order_id = $1 
                 ORDER BY revision_number DESC`,
                [order.id]
            );
            revisions = revRes.rows;
        } catch (_) {}

        // Map status to 4-stage stepper
        // Stage 1: Received & In Review (pending_review, pending)
        // Stage 2: Assigned to Digitizer (assigned)
        // Stage 3: In Production & QA (in_progress, qa_review, revision_requested)
        // Stage 4: Ready for Download (completed, approved)
        let step = 1;
        let stepLabel = 'Order Received & Spec Review';
        let stepDescription = 'Your artwork and specifications are being verified by our technical embroidery staff.';

        if (order.status === 'assigned') {
            step = 2;
            stepLabel = 'Assigned to Master Digitizer';
            stepDescription = 'A dedicated embroidery digitizer is mapping stitch angles, underlay density, and pull compensation.';
        } else if (['in_progress', 'qa_review', 'revision_requested'].includes(order.status)) {
            step = 3;
            stepLabel = 'Production Sew-Out & QA';
            stepDescription = order.status === 'revision_requested' 
                ? 'Your requested stitch revision is currently being modified and re-sampled.'
                : 'Digitizing is underway and undergoing machine sew-out quality control.';
        } else if (order.status === 'completed') {
            step = 4;
            stepLabel = 'Production Ready & Approved';
            stepDescription = 'Your production embroidery stitch files and approval previews are ready for download below.';
        }

        return success(res, {
            order: {
                id: order.id,
                orderNumber: order.order_number,
                projectName: order.project_name,
                serviceType: order.service_type,
                format: order.file_format || 'DST, EMB',
                size: order.sizing || 'Standard Size',
                placement: order.placement,
                fabric: order.fabric_type || 'Standard',
                status: order.status,
                paymentStatus: order.payment_status,
                price: order.price,
                turnaround: order.turnaround_speed || 'Standard',
                createdAt: order.created_at,
                deliverables: order.deliverables || [],
                clientName: order.client_name,
                clientEmail: order.client_email
            },
            tracking: {
                currentStep: step,
                totalSteps: 4,
                stepLabel,
                stepDescription
            },
            revisions
        }, 'Order tracking information retrieved successfully');
    } catch (err) {
        console.error('[Track Order Error]:', err);
        return error(res, `Failed to track order: ${err.message}`);
    }
};

/**
 * Delete / Cancel Order
 * DELETE /api/orders/:id
 */
const deleteOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await query(
            'SELECT * FROM public.orders WHERE id = $1 OR order_number = $1',
            [id]
        );
        if (result.rows.length === 0) {
            return notFound(res, 'Order not found');
        }
        const order = result.rows[0];

        // Authorization check: Admin can delete; Client can only delete their own if unpaid or pending
        if (req.user && req.user.role !== 'admin' && order.client_id !== req.user.id) {
            return forbidden(res, 'You are not authorized to delete this order');
        }
        if (req.user && req.user.role !== 'admin' && order.payment_status === 'paid' && order.status !== 'pending_review') {
            return badRequest(res, 'Paid orders in production cannot be deleted directly');
        }

        await query('DELETE FROM public.orders WHERE id = $1', [order.id]);
        return success(res, { deletedId: order.id, orderNumber: order.order_number }, 'Order removed successfully');
    } catch (err) {
        console.error('[Delete Order Error]:', err);
        return error(res, `Failed to delete order: ${err.message}`);
    }
};

module.exports = {
    createOrder,
    getOrders,
    getOrderById,
    updateOrderStatus,
    assignDigitizer,
    confirmPayment,
    trackOrder,
    deleteOrder
};
