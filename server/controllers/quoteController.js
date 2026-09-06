/**
 * Quotes Lifecycle Controller
 * Handles custom quote submissions, admin pricing appraisals, and quote-to-order conversions
 */
const crypto = require('crypto');
const { query } = require('../config/db');
const { success, error, badRequest, notFound, forbidden } = require('../utils/apiResponse');
const { generateQuoteNumber } = require('../utils/orderNumber');
const emailService = require('../services/emailService');

/**
 * Request a Free Quote
 * POST /api/quotes
 */
const requestQuote = async (req, res) => {
    try {
        const {
            serviceType,
            projectName,
            placement,
            sizing,
            fabricType,
            fileFormat,
            instructions,
            rawArtworkFiles = [],
            specialOptions = {},
            // Guest details if not logged in
            clientName,
            clientEmail,
            clientCompany
        } = req.body;

        if (!serviceType || !projectName || !placement) {
            return badRequest(res, 'Service type, project name, and placement are required');
        }

        let clientId = null;
        let finalClientName = clientName;
        let finalClientEmail = clientEmail;
        let finalClientCompany = clientCompany || null;

        if (req.user) {
            clientId = req.user.id;
            finalClientName = req.user.display_name;
            finalClientEmail = req.user.email;
            finalClientCompany = req.user.company || null;
        }

        if (!finalClientEmail || !finalClientName) {
            return badRequest(res, 'Client name and email are required to request a quote');
        }

        const quoteId = crypto.randomUUID();
        const quoteNumber = generateQuoteNumber();

        const insertRes = await query(
            `INSERT INTO public.orders 
                (id, order_number, client_id, client_name, client_email, client_company,
                 service_type, plan_name, project_name, placement, sizing, fabric_type,
                 file_format, instructions, raw_artwork_files, price, currency,
                 payment_status, status, is_quote, special_options, turnaround_speed,
                 revision_count, created_at, updated_at)
             VALUES 
                ($1, $2, $3, $4, $5, $6, $7, 'Custom Quote Appraisal', $8, $9, $10, $11,
                 $12, $13, $14, 0.00, 'USD', 'unpaid', 'quote_requested', true, $15,
                 'standard', 0, NOW(), NOW())
             RETURNING *`,
            [
                quoteId,
                quoteNumber,
                clientId,
                finalClientName,
                finalClientEmail.toLowerCase().trim(),
                finalClientCompany,
                serviceType,
                projectName,
                placement,
                sizing || 'Custom Dimensions',
                fabricType || 'Standard Material',
                fileFormat || 'DST, EMB',
                instructions || '',
                JSON.stringify(rawArtworkFiles),
                JSON.stringify(specialOptions)
            ]
        );

        const createdQuote = insertRes.rows[0];

        // Trigger asynchronous email alerts
        emailService.sendQuoteEstimationAlert(createdQuote, finalClientEmail.toLowerCase().trim())
            .catch(e => console.warn('[Quote Email Warning]:', e.message));
        emailService.sendNewOrderAdminAlert({
            order_number: createdQuote.order_number,
            customer_name: createdQuote.client_name,
            customer_email: createdQuote.client_email,
            service_type: createdQuote.service_type,
            plan: 'Quote Request',
            placement: createdQuote.placement,
            target_size: createdQuote.sizing,
            price: 0,
            payment_method: 'N/A (Quote)',
            payment_status: 'quote_requested'
        }).catch(e => console.warn('[Quote Admin Alert Warning]:', e.message));

        return success(res, createdQuote, 'Quote request submitted successfully. Admin will appraise shortly.', 201);
    } catch (err) {
        console.error('[Request Quote Error]:', err);
        return error(res, `Failed to submit quote request: ${err.message}`);
    }
};

/**
 * Get Quotes (Client or Admin)
 * GET /api/quotes
 */
const getQuotes = async (req, res) => {
    try {
        const user = req.user;
        const { status, page = 1, limit = 50 } = req.query;

        if (user.role === 'digitizer') {
            return forbidden(res, 'Digitizer workers do not have access to quote appraisals');
        }

        const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
        let whereClauses = ['is_quote = true'];
        let params = [];
        let paramIndex = 1;

        if (user.role === 'client') {
            whereClauses.push(`(client_id = $${paramIndex} OR LOWER(client_email) = LOWER($${paramIndex + 1}))`);
            params.push(user.id, user.email);
            paramIndex += 2;
        }

        if (status) {
            whereClauses.push(`status = $${paramIndex}`);
            params.push(status);
            paramIndex++;
        }

        const whereSql = `WHERE ${whereClauses.join(' AND ')}`;

        const quotesRes = await query(
            `SELECT * FROM public.orders ${whereSql} ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
            [...params, parseInt(limit, 10), offset]
        );

        const countRes = await query(`SELECT COUNT(*) as total FROM public.orders ${whereSql}`, params);
        const total = parseInt(countRes.rows[0].total, 10);

        return success(res, quotesRes.rows, 'Quotes retrieved successfully', 200, {
            total,
            page: parseInt(page, 10),
            limit: parseInt(limit, 10)
        });
    } catch (err) {
        console.error('[Get Quotes Error]:', err);
        return error(res, `Failed to retrieve quotes: ${err.message}`);
    }
};

/**
 * Admin Prices a Quote
 * PUT /api/quotes/:id/price
 */
const priceQuote = async (req, res) => {
    try {
        const { id } = req.params;
        const { price, adminNotes } = req.body;

        if (price === undefined || isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
            return badRequest(res, 'A valid numeric price greater than 0 is required');
        }

        const parsedPrice = parseFloat(price);

        const updateRes = await query(
            `UPDATE public.orders 
             SET price = $1, 
                 quote_admin_notes = $2, 
                 status = 'quote_ready', 
                 quote_priced_at = NOW(), 
                 updated_at = NOW() 
             WHERE (id::text = $3 OR order_number = $3) AND is_quote = true 
             RETURNING *`,
            [parsedPrice, adminNotes || null, id]
        );

        if (updateRes.rows.length === 0) {
            return notFound(res, 'Quote not found');
        }

        return success(res, updateRes.rows[0], 'Quote priced successfully. Client notified.');
    } catch (err) {
        console.error('[Price Quote Error]:', err);
        return error(res, `Failed to price quote: ${err.message}`);
    }
};

/**
 * Client Accepts and Converts Quote to Active Order
 * POST /api/quotes/:id/convert
 */
const convertQuoteToOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const { paymentMethod = 'PayPal', transactionId = null } = req.body;
        const user = req.user;

        // Fetch quote
        const quoteRes = await query(
            'SELECT * FROM public.orders WHERE (id::text = $1 OR order_number = $1) AND is_quote = true',
            [id]
        );

        if (quoteRes.rows.length === 0) {
            return notFound(res, 'Quote not found or already converted');
        }

        const quote = quoteRes.rows[0];

        // Ensure user is quote owner or admin
        if (user.role === 'client' && quote.client_id !== user.id && quote.client_email.toLowerCase() !== user.email.toLowerCase()) {
            return forbidden(res, 'You do not have permission to convert this quote');
        }

        if (quote.status !== 'quote_ready' || parseFloat(quote.price) <= 0) {
            return badRequest(res, 'This quote has not been priced by the admin yet');
        }

        // Convert quote to active production order
        const convertedRes = await query(
            `UPDATE public.orders 
             SET is_quote = false, 
                 status = 'pending_review', 
                 payment_status = 'paid', 
                 payment_method = $1, 
                 transaction_id = $2, 
                 updated_at = NOW() 
             WHERE id = $3 
             RETURNING *`,
            [paymentMethod, transactionId, quote.id]
        );

        return success(res, convertedRes.rows[0], 'Quote converted to active production order successfully');
    } catch (err) {
        console.error('[Convert Quote Error]:', err);
        return error(res, `Failed to convert quote to order: ${err.message}`);
    }
};

module.exports = {
    requestQuote,
    getQuotes,
    priceQuote,
    convertQuoteToOrder
};
