/**
 * Authentication & Profile Controller
 */
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const config = require('../config/config');
const { query } = require('../config/db');
const { success, error, badRequest, unauthorized } = require('../utils/apiResponse');
const emailService = require('../services/emailService');



/**
 * Generate JWT token
 */
const generateToken = (user) => {
    return jwt.sign(
        {
            id: user.id,
            email: user.email,
            role: user.role,
            displayName: user.display_name
        },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
    );
};

/**
 * User Registration (Client Only)
 * POST /api/auth/register
 */
const register = async (req, res) => {
    try {
        const { email, password, displayName, company, phone } = req.body;

        if (!email || !password || !displayName) {
            return badRequest(res, 'Email, password, and name are required');
        }

        const normalizedEmail = email.trim().toLowerCase();

        // Check if user already exists
        const existing = await query('SELECT id FROM public.profiles WHERE LOWER(email) = $1', [normalizedEmail]);
        if (existing.rows.length > 0) {
            return badRequest(res, 'An account with this email address already exists');
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);
        const userId = crypto.randomUUID();

        // 1. Insert into auth.users first to satisfy foreign key constraint
        try {
            await query(
                `INSERT INTO auth.users 
                    (id, email, password, email_verified, is_project_admin, is_anonymous, created_at, updated_at) 
                 VALUES ($1, $2, $3, true, false, false, NOW(), NOW())`,
                [userId, normalizedEmail, passwordHash]
            );
        } catch (authErr) {
            console.warn('[auth.users insert]:', authErr.message);
        }

        // 2. Insert profile (public signups are strictly clients)
        const insertRes = await query(
            `INSERT INTO public.profiles 
                (id, role, email, display_name, company, phone, status, password_hash, created_at, updated_at) 
             VALUES ($1, 'client', $2, $3, $4, $5, 'active', $6, NOW(), NOW()) 
             RETURNING id, role, email, display_name, company, phone, status, created_at`,
            [userId, normalizedEmail, displayName.trim(), company || null, phone || null, passwordHash]
        );

        const newUser = insertRes.rows[0];

        // Claim all previous guest orders created with this email
        try {
            await query(
                'UPDATE public.orders SET client_id = $1 WHERE LOWER(client_email) = $2',
                [newUser.id, normalizedEmail]
            );
        } catch (claimErr) {
            console.warn('[Guest Order Claim Notice]:', claimErr.message);
        }

        const token = generateToken(newUser);

        return success(res, {
            user: newUser,
            token
        }, 'Registration successful', 201);
    } catch (err) {
        console.error('[Register Error]:', err);
        return error(res, `Registration failed: ${err.message}`);
    }
};

/**
 * User Login
 * POST /api/auth/login
 */
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return badRequest(res, 'Email and password are required');
        }

        const normalizedEmail = email.trim().toLowerCase();

        // Fetch user by email
        const userRes = await query(
            `SELECT id, role, email, display_name, company, phone, status, password_hash,
                    machinery_preferences, default_fabric, default_turnaround 
             FROM public.profiles WHERE LOWER(email) = $1`,
            [normalizedEmail]
        );

        if (userRes.rows.length === 0) {
            return unauthorized(res, 'Invalid email or password');
        }

        const user = userRes.rows[0];

        if (user.status === 'suspended') {
            return unauthorized(res, 'Your account has been suspended. Please contact support.');
        }

        // Verify password with secure bcrypt hash
        let passwordMatches = false;
        if (user.password_hash) {
            passwordMatches = await bcrypt.compare(password, user.password_hash);
        }

        if (!passwordMatches) {
            return unauthorized(res, 'Invalid email or password');
        }

        const token = generateToken(user);

        // Omit password hash from response
        const { password_hash, ...safeUser } = user;

        return success(res, {
            user: safeUser,
            token
        }, 'Login successful');
    } catch (err) {
        console.error('[Login Error]:', err);
        return error(res, `Login failed: ${err.message}`);
    }
};

/**
 * Get Current User Profile & Metrics
 * GET /api/auth/me
 */
const getMe = async (req, res) => {
    try {
        const user = req.user;

        // Fetch user-specific metrics
        let metrics = {
            totalOrders: 0,
            activeOrders: 0,
            completedOrders: 0,
            balanceDue: 0.00
        };

        if (user.role === 'client') {
            const statsRes = await query(
                `SELECT 
                    COUNT(*) as total_orders,
                    COUNT(*) FILTER (WHERE status NOT IN ('completed', 'cancelled')) as active_orders,
                    COUNT(*) FILTER (WHERE status = 'completed') as completed_orders,
                    COALESCE(SUM(CASE WHEN payment_status = 'unpaid' AND status != 'cancelled' THEN price ELSE 0 END), 0) as balance_due
                 FROM public.orders 
                 WHERE client_id = $1`,
                [user.id]
            );
            if (statsRes.rows.length > 0) {
                const s = statsRes.rows[0];
                metrics = {
                    totalOrders: parseInt(s.total_orders, 10),
                    activeOrders: parseInt(s.active_orders, 10),
                    completedOrders: parseInt(s.completed_orders, 10),
                    balanceDue: parseFloat(s.balance_due)
                };
            }
        } else if (user.role === 'digitizer') {
            const statsRes = await query(
                `SELECT 
                    COUNT(*) as total_tasks,
                    COUNT(*) FILTER (WHERE status IN ('assigned', 'in_progress', 'revision')) as pending_tasks,
                    COUNT(*) FILTER (WHERE status = 'completed') as completed_tasks
                 FROM public.digitizer_tasks 
                 WHERE assigned_digitizer_id = $1`,
                [user.id]
            );
            if (statsRes.rows.length > 0) {
                const s = statsRes.rows[0];
                metrics = {
                    totalTasks: parseInt(s.total_tasks, 10),
                    pendingTasks: parseInt(s.pending_tasks, 10),
                    completedTasks: parseInt(s.completed_tasks, 10)
                };
            }
        }

        return success(res, {
            user,
            metrics
        }, 'Profile fetched successfully');
    } catch (err) {
        console.error('[GetMe Error]:', err);
        return error(res, `Failed to get user profile: ${err.message}`);
    }
};

/**
 * Update Profile Details & Machinery Preferences
 * PUT /api/auth/profile
 */
const updateProfile = async (req, res) => {
    try {
        const { displayName, company, phone, machineryPreferences, defaultFabric, defaultTurnaround } = req.body;
        const userId = req.user.id;

        const updateRes = await query(
            `UPDATE public.profiles 
             SET display_name = COALESCE($1, display_name),
                 company = COALESCE($2, company),
                 phone = COALESCE($3, phone),
                 machinery_preferences = COALESCE($4, machinery_preferences),
                 default_fabric = COALESCE($5, default_fabric),
                 default_turnaround = COALESCE($6, default_turnaround),
                 updated_at = NOW()
             WHERE id = $7
             RETURNING id, role, email, display_name, company, phone, status, machinery_preferences, default_fabric, default_turnaround, updated_at`,
            [
                displayName ? displayName.trim() : null,
                company !== undefined ? company : null,
                phone !== undefined ? phone : null,
                machineryPreferences ? JSON.stringify(machineryPreferences) : null,
                defaultFabric !== undefined ? defaultFabric : null,
                defaultTurnaround !== undefined ? defaultTurnaround : null,
                userId
            ]
        );

        return success(res, updateRes.rows[0], 'Profile updated successfully');
    } catch (err) {
        console.error('[Update Profile Error]:', err);
        return error(res, `Failed to update profile: ${err.message}`);
    }
};

/**
 * Change Password
 * POST /api/auth/change-password
 */
const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user.id;

        if (!currentPassword || !newPassword) {
            return badRequest(res, 'Current password and new password are required');
        }

        if (newPassword.length < 6) {
            return badRequest(res, 'New password must be at least 6 characters');
        }

        // Get stored hash
        const userRes = await query('SELECT password_hash, email FROM public.profiles WHERE id = $1', [userId]);
        if (userRes.rows.length === 0) {
            return unauthorized(res, 'User not found');
        }

        const user = userRes.rows[0];
        let passwordValid = false;
        if (user.password_hash) {
            passwordValid = await bcrypt.compare(currentPassword, user.password_hash);
        }

        if (!passwordValid) {
            return badRequest(res, 'Current password verification failed');
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const newHash = await bcrypt.hash(newPassword, salt);

        await query(
            'UPDATE public.profiles SET password_hash = $1, updated_at = NOW() WHERE id = $2',
            [newHash, userId]
        );
        try {
            await query('UPDATE auth.users SET password = $1, updated_at = NOW() WHERE id = $2', [newHash, userId]);
        } catch (_) {}

        return success(res, null, 'Password updated successfully');
    } catch (err) {
        console.error('[Change Password Error]:', err);
        return error(res, `Failed to update password: ${err.message}`);
    }
};

// In-memory store for password reset tokens and OTP codes with TTL
const PASSWORD_RESET_TOKENS = new Map(); // key: email, value: { otp, token, expiresAt }

/**
 * Request Password Reset (Sends 6-digit OTP code)
 * POST /api/auth/forgot-password
 */
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return badRequest(res, 'Email address is required');
        }

        const normalizedEmail = email.trim().toLowerCase();

        // Check user existence
        const userRes = await query('SELECT id, email, display_name FROM public.profiles WHERE LOWER(email) = $1', [normalizedEmail]);
        const user = userRes.rows.length > 0 ? userRes.rows[0] : { email: normalizedEmail, display_name: '' };
        
        // Generate secure 6-digit numeric OTP and hex token
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const token = crypto.randomBytes(24).toString('hex');
        const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes

        PASSWORD_RESET_TOKENS.set(normalizedEmail, {
            otp,
            token,
            expiresAt
        });

        console.log(`🔑 [Password Reset OTP] Issued for ${normalizedEmail}: ${otp} (expires in 15m)`);

        // Send transactional email with OTP & direct reset link
        try {
            emailService.sendPasswordResetOTP({
                email: normalizedEmail,
                otpCode: otp,
                displayName: user.display_name
            }).catch(err => console.warn('[Password Reset Email Send Warning]:', err.message));
        } catch (e) {
            console.warn('[Password Reset Email Error]:', e.message);
        }

        return success(res, {
            email: normalizedEmail,
            expiresInMinutes: 15
        }, 'Password reset code generated and sent to your email.');
    } catch (err) {
        console.error('[Forgot Password Error]:', err);
        return error(res, `Failed to process password reset: ${err.message}`);
    }
};

/**
 * Reset Password using 6-digit OTP or Reset Token
 * POST /api/auth/reset-password
 */
const resetPassword = async (req, res) => {
    try {
        const { email, otp, token, newPassword } = req.body;

        if (!email) {
            return badRequest(res, 'Email address is required');
        }

        if (!newPassword || newPassword.length < 6) {
            return badRequest(res, 'New password must be at least 6 characters long');
        }

        const normalizedEmail = email.trim().toLowerCase();
        const stored = PASSWORD_RESET_TOKENS.get(normalizedEmail);

        // Verify OTP/token
        const isValidStoredOtp = stored && (stored.otp === otp || stored.token === token) && stored.expiresAt > Date.now();

        if (!isValidStoredOtp) {
            return badRequest(res, 'Invalid or expired reset code. Please request a new code.');
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(newPassword, salt);

        // Update database
        const updateRes = await query(
            'UPDATE public.profiles SET password_hash = $1, updated_at = NOW() WHERE LOWER(email) = $2 RETURNING id, email, role, display_name',
            [passwordHash, normalizedEmail]
        );
        try {
            await query('UPDATE auth.users SET password = $1, updated_at = NOW() WHERE LOWER(email) = $2', [passwordHash, normalizedEmail]);
        } catch (_) {}

        // Invalidate OTP
        PASSWORD_RESET_TOKENS.delete(normalizedEmail);

        if (updateRes.rows.length === 0) {
            return badRequest(res, 'No account found matching this email address.');
        }

        console.log(`✅ Password successfully reset for ${normalizedEmail}`);
        return success(res, null, 'Password has been reset successfully. You can now sign in.');
    } catch (err) {
        console.error('[Reset Password Error]:', err);
        return error(res, `Failed to reset password: ${err.message}`);
    }
};

/**
 * Google OAuth Sign In & Auto-Registration
 * POST /api/auth/google
 */
const googleAuth = async (req, res) => {
    try {
        const { email, displayName, avatarUrl, googleId } = req.body;

        if (!email) {
            return badRequest(res, 'Google account email is required');
        }

        const normalizedEmail = email.trim().toLowerCase();
        const userName = (displayName || normalizedEmail.split('@')[0] || 'Google User').trim();

        // 1. Check if profile already exists
        const userRes = await query(
            `SELECT id, role, email, display_name, company, phone, status, password_hash 
             FROM public.profiles WHERE LOWER(email) = $1`,
            [normalizedEmail]
        );

        let user;

        if (userRes.rows.length > 0) {
            user = userRes.rows[0];
            if (user.status === 'suspended') {
                return unauthorized(res, 'Your account has been suspended. Please contact support.');
            }
        } else {
            // 2. Auto-register new client account
            const userId = crypto.randomUUID();
            const salt = await bcrypt.genSalt(10);
            const randomPassword = crypto.randomBytes(24).toString('hex');
            const passwordHash = await bcrypt.hash(randomPassword, salt);

            try {
                await query(
                    `INSERT INTO auth.users 
                        (id, email, password, email_verified, is_project_admin, is_anonymous, created_at, updated_at) 
                     VALUES ($1, $2, $3, true, false, false, NOW(), NOW())`,
                    [userId, normalizedEmail, passwordHash]
                );
            } catch (authErr) {
                console.warn('[Google auth.users insert]:', authErr.message);
            }

            const insertRes = await query(
                `INSERT INTO public.profiles 
                    (id, role, email, display_name, company, phone, status, password_hash, created_at, updated_at) 
                 VALUES ($1, 'client', $2, $3, '', '', 'active', $4, NOW(), NOW()) 
                 RETURNING id, role, email, display_name, company, phone, status, created_at`,
                [userId, normalizedEmail, userName, passwordHash]
            );

            user = insertRes.rows[0];

            // Claim prior guest orders
            try {
                await query(
                    'UPDATE public.orders SET client_id = $1 WHERE LOWER(client_email) = $2 AND client_id IS NULL',
                    [user.id, normalizedEmail]
                );
            } catch (claimErr) {
                console.warn('[Google Guest Claim]:', claimErr.message);
            }
        }

        const token = generateToken(user);

        return success(res, {
            user: {
                id: user.id,
                email: user.email,
                displayName: user.display_name,
                role: user.role || 'client',
                company: user.company || '',
                phone: user.phone || '',
                status: user.status || 'active',
                provider: 'google'
            },
            token
        }, 'Google authentication successful');
    } catch (err) {
        console.error('[Google Auth Error]:', err);
        return error(res, `Google authentication failed: ${err.message}`);
    }
};

module.exports = {
    register,
    login,
    googleAuth,
    getMe,
    updateProfile,
    changePassword,
    forgotPassword,
    resetPassword
};
