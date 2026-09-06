/**
 * Dezan Digitizing — Transactional Email Service
 * Luxury branded HTML emails for Order Confirmations, Admin Alerts, Task Assignments, and Deliverables.
 */

const nodemailer = require('nodemailer');
const path = require('path');
const config = require('../config/config');

// In-memory log buffer for development and test assertions
const sentEmailsLog = [];

class EmailService {
    constructor() {
        this.transporter = null;
        this.adminEmail = process.env.ADMIN_EMAIL || 'fdezan91@gmail.com';
        this.fromAddress = `"Dezan Digitizing" <${process.env.SMTP_USER || 'notifications@dezandigitizing.com'}>`;
        this.initTransporter();
    }

    initTransporter() {
        if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
            try {
                this.transporter = nodemailer.createTransport({
                    host: process.env.SMTP_HOST,
                    port: parseInt(process.env.SMTP_PORT || '587', 10),
                    secure: process.env.SMTP_SECURE === 'true',
                    auth: {
                        user: process.env.SMTP_USER,
                        pass: process.env.SMTP_PASS
                    }
                });
                console.log('📧 [EmailService] SMTP transporter initialized with host:', process.env.SMTP_HOST);
            } catch (err) {
                console.warn('⚠️ [EmailService] Failed to initialize SMTP transporter:', err.message);
                this.transporter = null;
            }
        } else {
            console.log('ℹ️ [EmailService] SMTP credentials not set; running in dev/simulation mode with console logging.');
        }
    }

    /**
     * Core email sending wrapper with error safety
     */
    async sendMail({ to, subject, html, text }) {
        const emailRecord = {
            timestamp: new Date().toISOString(),
            to,
            subject,
            preview: text ? text.substring(0, 120) : ''
        };
        sentEmailsLog.unshift(emailRecord);
        if (sentEmailsLog.length > 50) sentEmailsLog.pop();

        if (!this.transporter) {
            console.log(`\n📨 [Simulated Email Sent] To: ${to} | Subject: "${subject}"`);
            return { success: true, simulated: true, to, subject };
        }

        try {
            const info = await this.transporter.sendMail({
                from: this.fromAddress,
                to,
                subject,
                text,
                html
            });
            console.log(`✅ [Email Sent] MessageId: ${info.messageId} to: ${to}`);
            return { success: true, messageId: info.messageId };
        } catch (error) {
            console.error(`❌ [Email Delivery Failed] to: ${to} - Error:`, error.message);
            // Return failure without bubbling unhandled rejection
            return { success: false, error: error.message };
        }
    }

    /**
     * Base Luxury HTML Email Template
     */
    wrapTemplate({ title, preheader, content, actionBtn }) {
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body { margin: 0; padding: 0; background-color: #0d0c07; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #e2e8f0; }
        .wrapper { width: 100%; max-width: 600px; margin: 0 auto; background-color: #16140c; border: 1px solid rgba(212, 175, 53, 0.25); border-radius: 16px; overflow: hidden; }
        .header { background: linear-gradient(180deg, #201d12 0%, #16140c 100%); padding: 32px 24px; text-align: center; border-bottom: 1px solid rgba(212, 175, 53, 0.2); }
        .logo-title { font-size: 20px; font-weight: 900; letter-spacing: 0.1em; color: #ffffff; margin: 0; }
        .logo-subtitle { font-size: 10px; font-weight: 800; letter-spacing: 0.2em; color: #d4af35; text-transform: uppercase; margin-top: 4px; }
        .body-content { padding: 32px 24px; line-height: 1.6; font-size: 15px; color: #cbd5e1; }
        .badge { display: inline-block; padding: 4px 12px; background: rgba(212, 175, 53, 0.15); border: 1px solid rgba(212, 175, 53, 0.3); border-radius: 9999px; color: #d4af35; font-size: 12px; font-weight: bold; margin-bottom: 16px; }
        .info-card { background-color: #201d12; border: 1px solid rgba(212, 175, 53, 0.2); border-radius: 12px; padding: 18px; margin: 20px 0; }
        .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.06); font-size: 14px; }
        .info-row:last-child { border-bottom: none; }
        .info-label { color: #94a3b8; font-weight: 500; }
        .info-val { color: #f8fafc; font-weight: 700; text-align: right; }
        .btn-cta { display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, #d4af35 0%, #b89228 100%); color: #0d0c07; text-decoration: none; font-weight: 900; font-size: 14px; border-radius: 10px; text-align: center; margin: 24px 0 12px 0; }
        .footer { background-color: #0d0c07; padding: 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid rgba(255, 255, 255, 0.05); }
        .footer a { color: #d4af35; text-decoration: none; }
    </style>
</head>
<body>
    <div style="display:none;font-size:1px;color:#333333;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
        ${preheader || title}
    </div>
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="padding: 24px 12px;">
        <tr>
            <td align="center">
                <div class="wrapper">
                    <div class="header">
                        <div class="logo-title">DEZAN</div>
                        <div class="logo-subtitle">DIGITIZING</div>
                    </div>
                    <div class="body-content">
                        ${content}
                        ${actionBtn ? `<div style="text-align: center;">${actionBtn}</div>` : ''}
                    </div>
                    <div class="footer">
                        <p style="margin: 0 0 8px 0;"><strong>Dezan Digitizing</strong> — Operating since 2016</p>
                        <p style="margin: 0 0 8px 0;">Rawalpindi & Global Atelier · High-Precision Stitch Craftsmanship</p>
                        <p style="margin: 0;">Inquiries: <a href="mailto:fdezan91@gmail.com">fdezan91@gmail.com</a> | <a href="https://dezan-digitizing.vercel.app">dezan-digitizing.vercel.app</a></p>
                    </div>
                </div>
            </td>
        </tr>
    </table>
</body>
</html>
        `;
    }

    /**
     * 1. Send Order Confirmation to Client
     */
    async sendOrderConfirmation(order, clientEmail) {
        if (!clientEmail) return;
        const subject = `Order Confirmed: ${order.order_number} · Dezan Digitizing`;
        const trackUrl = `https://dezan-digitizing.vercel.app/track-order.html?order=${order.order_number}&email=${encodeURIComponent(clientEmail)}`;
        const claimUrl = `https://dezan-digitizing.vercel.app/portal-login.html?tab=register&email=${encodeURIComponent(clientEmail)}&order=${order.order_number}&name=${encodeURIComponent(order.customer_name || '')}`;

        const content = `
            <div class="badge">Order Confirmed</div>
            <h2 style="color: #ffffff; margin-top: 0; font-size: 20px;">Your order has been created!</h2>
            <p>Your embroidery / vector artwork has been received and routed into our production queue. Our master digitizers are reviewing your stitch parameters.</p>
            
            <div class="info-card">
                <div class="info-row"><span class="info-label">Order Number</span><span class="info-val" style="color: #d4af35;">${order.order_number}</span></div>
                <div class="info-row"><span class="info-label">Service</span><span class="info-val">${order.service_type || 'Embroidery Digitizing'}</span></div>
                <div class="info-row"><span class="info-label">Design Name</span><span class="info-val">${order.design_name || 'Custom Artwork'}</span></div>
                <div class="info-row"><span class="info-label">Placement / Sizing</span><span class="info-val">${order.placement || 'Left Chest'} ${order.target_size ? `(${order.target_size})` : ''}</span></div>
                <div class="info-row"><span class="info-label">Total Amount</span><span class="info-val">$${parseFloat(order.price || 0).toFixed(2)}</span></div>
                <div class="info-row"><span class="info-label">Payment Status</span><span class="info-val" style="color: #10b981;">${(order.payment_status || 'Paid').toUpperCase()}</span></div>
            </div>

            <p style="font-size: 13px; color: #94a3b8;">Standard turnaround is 12–24 hours. You can track live production progress and download your stitch files (.DST, .EMB, .PDF) as soon as they are ready.</p>

            <div style="margin-top: 24px; padding: 20px; border-radius: 12px; background: rgba(212, 175, 53, 0.08); border: 1px dashed rgba(212, 175, 53, 0.35); text-align: center;">
                <h4 style="margin: 0 0 8px 0; color: #d4af35; font-size: 15px; font-weight: 800;">✨ Add This Order to Your Permanent Design Catalog</h4>
                <p style="margin: 0 0 14px 0; font-size: 13px; color: #cbd5e1; line-height: 1.5;">Create your free client account using this email to organize all your stitch files in your personal catalog, submit free sew-out revisions, and re-order with 1-click.</p>
                <a href="${claimUrl}" style="display: inline-block; padding: 11px 24px; background: #d4af35; color: #0d0c07; text-decoration: none; font-weight: 900; font-size: 13px; border-radius: 8px;">Create Free Account & Claim Order &rarr;</a>
            </div>
        `;
        const actionBtn = `<a href="${trackUrl}" class="btn-cta">Track Order & Download Files &rarr;</a>`;
        
        return this.sendMail({
            to: clientEmail,
            subject,
            html: this.wrapTemplate({ title: subject, preheader: `Order ${order.order_number} confirmed. Track progress or create account.`, content, actionBtn }),
            text: `Your order ${order.order_number} has been created! Track live progress and get ready files at: ${trackUrl} — Or create your account to add to your catalog: ${claimUrl}`
        });
    }

    /**
     * Send Password Reset OTP Code to User
     */
    async sendPasswordResetOTP({ email, otpCode, displayName }) {
        if (!email) return;
        const subject = `Your Password Reset Code: ${otpCode} · Dezan Digitizing`;
        const resetUrl = `https://dezan-digitizing.vercel.app/portal-login.html?tab=forgot&email=${encodeURIComponent(email)}&code=${otpCode}`;

        const content = `
            <div class="badge" style="background: rgba(239, 68, 68, 0.15); border-color: rgba(239, 68, 68, 0.3); color: #f87171;">Account Security</div>
            <h2 style="color: #ffffff; margin-top: 0; font-size: 20px;">Password Reset Request</h2>
            <p>Hello ${displayName || 'Valued Client'},</p>
            <p>We received a request to reset your password for your Dezan Digitizing portal account. Use the 6-digit verification code below to set a new password:</p>

            <div style="text-align: center; margin: 28px 0;">
                <div style="display: inline-block; padding: 16px 32px; background: #201d12; border: 2px solid #d4af35; border-radius: 12px; font-family: monospace; font-size: 32px; font-weight: 900; letter-spacing: 0.35em; color: #d4af35;">
                    ${otpCode}
                </div>
                <p style="font-size: 12px; color: #94a3b8; margin-top: 8px;">This verification code expires in <strong>15 minutes</strong>.</p>
            </div>

            <p style="font-size: 13px; color: #94a3b8;">If you did not request this password reset, you can safely ignore this email. Your account remains secure.</p>
        `;
        const actionBtn = `<a href="${resetUrl}" class="btn-cta">Reset Password Now &rarr;</a>`;

        return this.sendMail({
            to: email,
            subject,
            html: this.wrapTemplate({ title: subject, preheader: `Your verification code is ${otpCode}`, content, actionBtn }),
            text: `Your Dezan Digitizing password reset code is ${otpCode}. It expires in 15 minutes. Reset online: ${resetUrl}`
        });
    }

    /**
     * 2. Send New Order Alert to Admin
     */
    async sendNewOrderAdminAlert(order) {
        const subject = `🔔 NEW ORDER: ${order.order_number} ($${parseFloat(order.price || 0).toFixed(2)})`;
        const content = `
            <div class="badge" style="background: rgba(16, 185, 129, 0.15); border-color: rgba(16, 185, 129, 0.3); color: #10b981;">Admin Dispatch Alert</div>
            <h2 style="color: #ffffff; margin-top: 0; font-size: 20px;">A new order was placed!</h2>
            <p>A new customer order requires digitizer assignment.</p>

            <div class="info-card">
                <div class="info-row"><span class="info-label">Order Number</span><span class="info-val" style="color: #d4af35;">${order.order_number}</span></div>
                <div class="info-row"><span class="info-label">Customer</span><span class="info-val">${order.customer_name || 'Guest'} (${order.customer_email || 'N/A'})</span></div>
                <div class="info-row"><span class="info-label">Service / Tier</span><span class="info-val">${order.service_type || 'Digitizing'} · ${order.plan || 'Flat-Rate'}</span></div>
                <div class="info-row"><span class="info-label">Placement / Dimensions</span><span class="info-val">${order.placement || 'Left Chest'} · ${order.target_size || 'N/A'}</span></div>
                <div class="info-row"><span class="info-label">Payment</span><span class="info-val">$${parseFloat(order.price || 0).toFixed(2)} (${order.payment_method || 'PayPal'} - ${order.payment_status || 'paid'})</span></div>
            </div>
        `;
        const actionBtn = `<a href="https://dezan-digitizing.vercel.app/admin-orders.html?order=${order.order_number}" class="btn-cta">Assign in Admin Console &rarr;</a>`;

        return this.sendMail({
            to: this.adminEmail,
            subject,
            html: this.wrapTemplate({ title: subject, preheader: `New order ${order.order_number} needs assignment`, content, actionBtn }),
            text: `New order ${order.order_number} received for $${order.price}. View in admin: https://dezan-digitizing.vercel.app/admin-orders.html`
        });
    }

    /**
     * 3. Send Task Assigned Alert to Digitizer Worker
     */
    async sendTaskAssignedAlert(task, workerEmail) {
        if (!workerEmail) return;
        const subject = `⚡ New Production Ticket Assigned: ${task.order_number || task.order_id}`;
        const content = `
            <div class="badge">Production Assignment</div>
            <h2 style="color: #ffffff; margin-top: 0; font-size: 20px;">New Ticket on Your Workbench</h2>
            <p>Admin has assigned a new embroidery ticket to your workstation. Please review technical specifications and stitch parameters:</p>

            <div class="info-card">
                <div class="info-row"><span class="info-label">Ticket ID</span><span class="info-val" style="color: #d4af35;">${task.id || task.order_number}</span></div>
                <div class="info-row"><span class="info-label">Order Ref</span><span class="info-val">${task.order_number || task.order_id}</span></div>
                <div class="info-row"><span class="info-label">Substrate / Placement</span><span class="info-val">${task.fabric_type || 'Pique Knit'} · ${task.placement || 'Left Chest'}</span></div>
                <div class="info-row"><span class="info-label">Required Formats</span><span class="info-val">${task.format || '.DST, .EMB'}</span></div>
                <div class="info-row"><span class="info-label">Target Size</span><span class="info-val">${task.target_size || '3.5 in'}</span></div>
            </div>

            <p style="font-size: 13px; color: #94a3b8;">Remember to adhere to zero-PII data standards and verify sew-out density rules in the SOP guide.</p>
        `;
        const actionBtn = `<a href="https://dezan-digitizing.vercel.app/worker-tasks.html" class="btn-cta">Open Digitizer Workbench &rarr;</a>`;

        return this.sendMail({
            to: workerEmail,
            subject,
            html: this.wrapTemplate({ title: subject, preheader: `Production ticket ${task.order_number} assigned to you`, content, actionBtn }),
            text: `New production ticket ${task.order_number} assigned. Open workbench: https://dezan-digitizing.vercel.app/worker-tasks.html`
        });
    }

    /**
     * 4. Send Deliverables Ready Alert to Client
     */
    async sendDeliverablesReadyAlert(order, clientEmail) {
        if (!clientEmail) return;
        const subject = `✨ Your Stitch Files are Ready: ${order.order_number} · Dezan Digitizing`;
        const content = `
            <div class="badge" style="background: rgba(16, 185, 129, 0.15); border-color: rgba(16, 185, 129, 0.3); color: #10b981;">Deliverables Complete</div>
            <h2 style="color: #ffffff; margin-top: 0; font-size: 20px;">Your files are ready for production!</h2>
            <p>Our quality control team has approved your production files for order <strong>${order.order_number}</strong>. You can now download your production package.</p>

            <div class="info-card">
                <div class="info-row"><span class="info-label">Order Number</span><span class="info-val" style="color: #d4af35;">${order.order_number}</span></div>
                <div class="info-row"><span class="info-label">Design Name</span><span class="info-val">${order.design_name || 'Artwork'}</span></div>
                <div class="info-row"><span class="info-label">Verified Stitch Count</span><span class="info-val">${order.stitch_count ? Number(order.stitch_count).toLocaleString() + ' sts' : 'Verified'}</span></div>
                <div class="info-row"><span class="info-label">Included Formats</span><span class="info-val">${order.format || '.DST, .EMB, .PDF Approval Sheet'}</span></div>
            </div>

            <p style="font-size: 13px; color: #94a3b8;">Need an adjustment or sizing tweak? We offer 100% free revisions directly through your Client Portal.</p>
        `;
        const actionBtn = `<a href="https://dezan-digitizing.vercel.app/client-orders.html?order=${order.order_number}" class="btn-cta">Download Deliverables &rarr;</a>`;

        return this.sendMail({
            to: clientEmail,
            subject,
            html: this.wrapTemplate({ title: subject, preheader: `Deliverables ready for ${order.order_number}`, content, actionBtn }),
            text: `Deliverables for ${order.order_number} are ready! Download at https://dezan-digitizing.vercel.app/client-orders.html`
        });
    }

    /**
     * 5. Send Quote Estimation Alert to Client
     */
    async sendQuoteEstimationAlert(quote, clientEmail) {
        if (!clientEmail) return;
        const subject = `Free Quote Estimate: ${quote.quote_number || quote.id} · Dezan Digitizing`;
        const content = `
            <div class="badge">Quote Received</div>
            <h2 style="color: #ffffff; margin-top: 0; font-size: 20px;">We are reviewing your artwork</h2>
            <p>Thank you for submitting a quote request. Our head digitizer is analyzing your design for stitch estimation and color sequencing.</p>

            <div class="info-card">
                <div class="info-row"><span class="info-label">Quote Reference</span><span class="info-val" style="color: #d4af35;">${quote.quote_number || quote.id}</span></div>
                <div class="info-row"><span class="info-label">Design Name</span><span class="info-val">${quote.design_name || 'Artwork'}</span></div>
                <div class="info-row"><span class="info-label">Estimated Turnaround</span><span class="info-val">2–4 Hours</span></div>
            </div>
        `;
        const actionBtn = `<a href="https://dezan-digitizing.vercel.app/client-quotes.html" class="btn-cta">View Quotes in Portal &rarr;</a>`;

        return this.sendMail({
            to: clientEmail,
            subject,
            html: this.wrapTemplate({ title: subject, preheader: `Quote received for ${quote.design_name || 'artwork'}`, content, actionBtn }),
            text: `Quote ${quote.quote_number || quote.id} received. View details at https://dezan-digitizing.vercel.app/client-quotes.html`
        });
    }

    /**
     * Get recent sent emails log (for testing)
     */
    getSentEmailsLog() {
        return sentEmailsLog;
    }
}

module.exports = new EmailService();
