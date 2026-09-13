/**
 * Dezan Digitizing — PayPal Server Controller
 * 
 * Secure API endpoints for PayPal Client ID discovery, server-side order creation, 
 * and server-side payment capture & database synchronization.
 */
const paypalService = require('../services/paypalService');
const { query } = require('../config/db');
const emailService = require('../services/emailService');
const { success, error, badRequest, notFound, forbidden } = require('../utils/apiResponse');

/**
 * Get Public PayPal Configuration
 * GET /api/paypal/config
 * 
 * SECURITY: Only returns public client ID, currency, and environment mode.
 * The PAYPAL_CLIENT_SECRET is NEVER exposed.
 */
const getClientConfig = async (req, res) => {
    try {
        const publicConfig = paypalService.getPublicClientConfig();
        return success(res, publicConfig, 'PayPal public configuration retrieved');
    } catch (err) {
        console.error('[PayPal Get Config Error]:', err);
        return error(res, `Failed to retrieve PayPal configuration: ${err.message}`);
    }
};

/**
 * Create PayPal Order on Server
 * POST /api/paypal/create-order
 * 
 * Validates request against the database to prevent client-side price tampering.
 */
const createOrder = async (req, res) => {
    try {
        const { orderId, amount, currency } = req.body;
        let finalAmount = amount;
        let description = 'Dezan Digitizing Order Settlement';
        let dbOrder = null;

        // If an order reference is passed, verify against database to lock the authentic price
        if (orderId) {
            const orderRes = await query(
                'SELECT * FROM public.orders WHERE (id::text = $1 OR order_number = $1)',
                [orderId]
            );

            if (orderRes.rows.length > 0) {
                dbOrder = orderRes.rows[0];

                // Check client ownership if user is authenticated as client
                if (req.user && req.user.role === 'client') {
                    const userEmail = req.user.email?.toLowerCase();
                    const orderEmail = dbOrder.client_email?.toLowerCase();
                    if (dbOrder.client_id && dbOrder.client_id !== req.user.id && orderEmail && orderEmail !== userEmail) {
                        return forbidden(res, 'You do not have permission to pay for this order');
                    }
                }

                // Enforce verified database price
                if (dbOrder.price && parseFloat(dbOrder.price) > 0) {
                    finalAmount = parseFloat(dbOrder.price);
                }

                description = `Dezan Digitizing ${dbOrder.is_quote ? 'Quote' : 'Order'} #${dbOrder.order_number}`;
            }
        }

        if (!finalAmount || isNaN(parseFloat(finalAmount)) || parseFloat(finalAmount) <= 0) {
            return badRequest(res, 'A valid positive amount is required to create a payment order');
        }

        const paypalOrder = await paypalService.createOrder({
            orderId: dbOrder ? dbOrder.order_number : orderId,
            amount: finalAmount,
            currency: currency || 'USD',
            description
        });

        return success(res, {
            id: paypalOrder.id,
            status: paypalOrder.status
        }, 'PayPal order initialized successfully', 201);
    } catch (err) {
        console.error('[PayPal Create Order Controller Error]:', err);
        return badRequest(res, `Unable to create PayPal order: ${err.message}`);
    }
};

/**
 * Capture PayPal Order Payment on Server
 * POST /api/paypal/capture-order
 * 
 * Verifies capture status directly with PayPal using server secret,
 * then updates database record to 'paid' and triggers customer emails.
 */
const captureOrder = async (req, res) => {
    try {
        const { paypalOrderId, orderId } = req.body;

        if (!paypalOrderId) {
            return badRequest(res, 'PayPal Order ID is required for capture');
        }

        // Execute capture via server-side PayPal REST API
        const captureResult = await paypalService.captureOrder(paypalOrderId);

        let updatedOrder = null;

        // If orderId was supplied, synchronize payment status in database
        if (orderId) {
            const existingOrderRes = await query(
                'SELECT * FROM public.orders WHERE (id::text = $1 OR order_number = $1)',
                [orderId]
            );

            if (existingOrderRes.rows.length > 0) {
                const currentRecord = existingOrderRes.rows[0];
                const isQuote = currentRecord.is_quote === true || 
                                currentRecord.status === 'quote_ready' || 
                                (currentRecord.order_number && currentRecord.order_number.startsWith('QUO-'));

                let updateRes;
                if (isQuote) {
                    // Automatically convert paid quote to active production order
                    updateRes = await query(
                        `UPDATE public.orders 
                         SET is_quote = false, 
                             status = 'pending_review', 
                             payment_status = 'paid', 
                             payment_method = 'PayPal', 
                             transaction_id = $1, 
                             updated_at = NOW() 
                         WHERE id = $2 
                         RETURNING *`,
                        [captureResult.captureId, currentRecord.id]
                    );
                } else {
                    updateRes = await query(
                        `UPDATE public.orders 
                         SET payment_status = 'paid', 
                             payment_method = 'PayPal', 
                             transaction_id = $1, 
                             updated_at = NOW() 
                         WHERE id = $2 
                         RETURNING *`,
                        [captureResult.captureId, currentRecord.id]
                    );
                }

                if (updateRes.rows.length > 0) {
                    updatedOrder = updateRes.rows[0];

                    // Send confirmation emails asynchronously
                    try {
                        const clientEmail = updatedOrder.client_email || (req.user && req.user.email);
                        if (clientEmail) {
                            const normEmail = clientEmail.toLowerCase().trim();
                            emailService.sendOrderConfirmation(updatedOrder, normEmail)
                                .catch(e => console.warn('[Email Warning]:', e.message));

                            (async () => {
                                try {
                                    const userCheck = await query('SELECT id FROM public.profiles WHERE LOWER(email) = $1', [normEmail]);
                                    if (userCheck.rows.length === 0) {
                                        await emailService.sendAccountInviteEmail({
                                            email: normEmail,
                                            customerName: updatedOrder.client_name || updatedOrder.customer_name || '',
                                            orderNumber: updatedOrder.order_number
                                        });
                                    }
                                } catch (inviteErr) {
                                    console.warn('[Account Invite Trigger Warning]:', inviteErr.message);
                                }
                            })();
                        }
                        emailService.sendNewOrderAdminAlert(updatedOrder)
                            .catch(e => console.warn('[Email Warning]:', e.message));
                    } catch (emailErr) {
                        console.warn('[Email Trigger Warning]:', emailErr.message);
                    }
                }
            }
        }

        return success(res, {
            captureId: captureResult.captureId,
            status: captureResult.status,
            paypalOrderId,
            order: updatedOrder
        }, 'PayPal payment successfully captured and verified');
    } catch (err) {
        console.error('[PayPal Capture Controller Error]:', err);
        return badRequest(res, `Unable to capture PayPal payment: ${err.message}`);
    }
};

module.exports = {
    getClientConfig,
    createOrder,
    captureOrder
};
