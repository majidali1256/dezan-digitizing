/**
 * Dezan Digitizing — InsForge Client & RBAC State Engine
 * Backend Base: https://e8rw998g.us-east.insforge.app
 * Handles Authentication, Orders, Worker Tasks, and S3 Storage uploads
 */

const INSFORGE_CONFIG = {
    baseUrl: 'https://e8rw998g.us-east.insforge.app',
    anonKey: 'anon_a03544f925bc8c2e24164c92d6ee1a411c1226559f6dbcce44e28e8c5f1a1a50',
    storageUrl: 'https://e8rw998g.us-east.insforge.app/api/storage'
};

// ===================================================================
//  DEMO MOCK ACCOUNTS (For Instant 1-Click Role Testing & Verifications)
// ===================================================================
const DEMO_USERS = {
    admin: {
        id: '00000000-0000-0000-0000-000000000001',
        email: 'admin@dezandigitizing.com',
        displayName: 'Faisal Dezan (Admin)',
        role: 'admin',
        company: 'Dezan Digitizing HQ',
        status: 'active'
    },
    client: {
        id: '00000000-0000-0000-0000-000000000002',
        email: 'client@falconapparel.com',
        displayName: 'John Falcon',
        role: 'client',
        company: 'Falcon Apparel Co.',
        status: 'active'
    },
    digitizer: {
        id: '00000000-0000-0000-0000-000000000003',
        email: 'worker.alex@dezandigitizing.com',
        displayName: 'Alex Miller (Lead Digitizer)',
        role: 'digitizer',
        status: 'active'
    }
};

// Initial Sample Orders for Demonstration & Testing
const INITIAL_DEMO_ORDERS = [
    {
        id: 'ord-8841',
        order_number: 'ORD-8841',
        client_id: '00000000-0000-0000-0000-000000000002',
        client_name: 'John Falcon',
        client_email: 'client@falconapparel.com',
        client_company: 'Falcon Apparel Co.',
        service_type: 'Digitizing',
        plan_name: 'Jacket Back',
        project_name: 'Falcon Wings Crest',
        placement: 'Jacket Back',
        sizing: '11.5" W x 8.0" H',
        file_format: 'DST, EMB',
        instructions: 'High density stitch, 3D puff on the letter F, fabric is heavy denim. Keep color changes to max 5 stops.',
        raw_artwork_files: [
            { name: 'falcon_wings_crest.png', url: 'images/dezan-logo.png', size: 245000 }
        ],
        price: 55.00,
        currency: 'USD',
        payment_status: 'paid',
        payment_method: 'PayPal',
        assigned_digitizer_id: '00000000-0000-0000-0000-000000000003',
        assigned_digitizer_name: 'Alex Miller (Lead Digitizer)',
        assigned_at: new Date(Date.now() - 3600000 * 4).toISOString(),
        status: 'in_progress',
        deliverables: [],
        created_at: new Date(Date.now() - 3600000 * 12).toISOString()
    },
    {
        id: 'ord-8842',
        order_number: 'ORD-8842',
        client_id: '00000000-0000-0000-0000-000000000002',
        client_name: 'John Falcon',
        client_email: 'client@falconapparel.com',
        client_company: 'Falcon Apparel Co.',
        service_type: 'Digitizing',
        plan_name: 'Left Chest / Hat',
        project_name: 'Falcon Mini Cap Logo',
        placement: 'Cap Front / Hat',
        sizing: '2.5" W x 2.2" H',
        file_format: 'DST, EMB',
        instructions: 'Center-out sequencing for structured 6-panel baseball cap. Needle 75/11.',
        raw_artwork_files: [
            { name: 'falcon_cap_badge.png', url: 'logo.png', size: 142000 }
        ],
        price: 15.00,
        currency: 'USD',
        payment_status: 'paid',
        payment_method: 'PayPal',
        assigned_digitizer_id: null,
        assigned_digitizer_name: null,
        assigned_at: null,
        status: 'pending_review',
        deliverables: [],
        created_at: new Date(Date.now() - 3600000 * 2).toISOString()
    },
    {
        id: 'ord-8839',
        order_number: 'ORD-8839',
        client_id: '00000000-0000-0000-0000-000000000002',
        client_name: 'John Falcon',
        client_email: 'client@falconapparel.com',
        client_company: 'Falcon Apparel Co.',
        service_type: 'Digitizing',
        plan_name: 'Left Chest',
        project_name: 'Falcon Corporate Polo',
        placement: 'Left Chest',
        sizing: '3.5" W x 1.8" H',
        file_format: 'DST, EMB',
        instructions: 'Pique knit fabric, underlay tatami with satin border.',
        raw_artwork_files: [
            { name: 'falcon_polo_vector.svg', url: 'logo.png', size: 98000 }
        ],
        price: 20.00,
        currency: 'USD',
        payment_status: 'paid',
        payment_method: 'PayPal',
        assigned_digitizer_id: '00000000-0000-0000-0000-000000000003',
        assigned_digitizer_name: 'Alex Miller (Lead Digitizer)',
        assigned_at: new Date(Date.now() - 3600000 * 48).toISOString(),
        status: 'completed',
        deliverables: [
            { format: 'DST', name: 'Falcon_Polo_LeftChest.dst', url: '#', size: 28400 },
            { format: 'EMB', name: 'Falcon_Polo_LeftChest.emb', url: '#', size: 148200 }
        ],
        created_at: new Date(Date.now() - 3600000 * 54).toISOString()
    }
];

class InsForgeClient {
    constructor() {
        this.baseUrl = INSFORGE_CONFIG.baseUrl;
        this.anonKey = INSFORGE_CONFIG.anonKey;
        this.initStorage();
    }

    initStorage() {
        if (!localStorage.getItem('dezan_orders')) {
            localStorage.setItem('dezan_orders', JSON.stringify(INITIAL_DEMO_ORDERS));
        }
        if (!localStorage.getItem('dezan_digitizers')) {
            localStorage.setItem('dezan_digitizers', JSON.stringify([
                DEMO_USERS.digitizer,
                {
                    id: '00000000-0000-0000-0000-000000000004',
                    email: 'worker.sam@dezandigitizing.com',
                    displayName: 'Sam Chen (Vector Specialist)',
                    role: 'digitizer',
                    status: 'active'
                },
                {
                    id: '00000000-0000-0000-0000-000000000005',
                    email: 'worker.maria@dezandigitizing.com',
                    displayName: 'Maria Garcia (3D Puff Master)',
                    role: 'digitizer',
                    status: 'active'
                }
            ]));
        }
    }

    // ===================================================================
    //  AUTHENTICATION & SESSION MANAGEMENT
    // ===================================================================

    getCurrentUser() {
        const session = localStorage.getItem('dezan_session');
        if (!session) return null;
        try {
            return JSON.parse(session);
        } catch {
            return null;
        }
    }

    setSession(user) {
        localStorage.setItem('dezan_session', JSON.stringify(user));
    }

    signOut() {
        localStorage.removeItem('dezan_session');
        window.location.href = 'portal-login.html';
    }

    // 1-Click Demo Login Switcher
    loginAsDemo(role) {
        const user = DEMO_USERS[role];
        if (!user) return false;
        this.setSession(user);
        this.redirectToDashboard(user.role);
        return true;
    }

    // Standard Sign In
    async signIn(email, password) {
        // First check demo users
        const demoUser = Object.values(DEMO_USERS).find(u => u.email.toLowerCase() === email.toLowerCase());
        if (demoUser) {
            this.setSession(demoUser);
            return { user: demoUser, error: null };
        }

        // Check local registered users
        const registered = JSON.parse(localStorage.getItem('dezan_registered_users') || '[]');
        const existing = registered.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (existing) {
            this.setSession(existing);
            return { user: existing, error: null };
        }

        return { user: null, error: 'Invalid email or password. Please try a demo account or sign up.' };
    }

    // Standard Sign Up
    async signUp({ email, password, displayName, role = 'client', company = '' }) {
        const user = {
            id: 'usr-' + Date.now(),
            email,
            displayName,
            role,
            company,
            status: 'active',
            created_at: new Date().toISOString()
        };

        const registered = JSON.parse(localStorage.getItem('dezan_registered_users') || '[]');
        registered.push(user);
        localStorage.setItem('dezan_registered_users', JSON.stringify(registered));

        this.setSession(user);
        return { user, error: null };
    }

    // Automatic Role-Based Routing
    redirectToDashboard(role) {
        if (role === 'admin') {
            window.location.href = 'admin-portal.html';
        } else if (role === 'digitizer') {
            window.location.href = 'worker-portal.html';
        } else {
            window.location.href = 'client-portal.html';
        }
    }

    // Guard page access
    requireAuth(allowedRoles = []) {
        const user = this.getCurrentUser();
        if (!user) {
            window.location.href = 'portal-login.html';
            return null;
        }
        if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
            // Redirect to their respective authorized dashboard
            this.redirectToDashboard(user.role);
            return null;
        }
        return user;
    }

    // ===================================================================
    //  ORDER OPERATIONS (RBAC & MASKING GOVERNED)
    // ===================================================================

    // Get orders respecting RBAC permissions
    getOrders() {
        const user = this.getCurrentUser();
        if (!user) return [];

        const allOrders = JSON.parse(localStorage.getItem('dezan_orders') || '[]');

        if (user.role === 'admin') {
            // Admin sees everything
            return allOrders;
        }

        if (user.role === 'client') {
            // Client sees only their own orders
            return allOrders.filter(o => o.client_id === user.id);
        }

        // Digitizers NEVER access full orders table
        return [];
    }

    // Get Digitizer Tasks (STRICT DATA MASKING)
    getDigitizerTasks() {
        const user = this.getCurrentUser();
        if (!user || (user.role !== 'digitizer' && user.role !== 'admin')) return [];

        const allOrders = JSON.parse(localStorage.getItem('dezan_orders') || '[]');

        // Filter to orders assigned to this digitizer
        const assignedOrders = user.role === 'admin'
            ? allOrders.filter(o => o.assigned_digitizer_id)
            : allOrders.filter(o => o.assigned_digitizer_id === user.id);

        // MAP TO SANITIZED TASKS (STRIPPING ALL CLIENT PII & PRICING)
        return assignedOrders.map(order => ({
            taskId: 'TSK-' + order.order_number.replace('ORD-', ''),
            orderNumber: order.order_number,
            serviceType: order.service_type,
            placement: order.placement,
            sizing: order.sizing,
            fileFormat: order.file_format,
            instructions: order.instructions,
            rawArtworkFiles: order.raw_artwork_files || [],
            status: order.status,
            deliverables: order.deliverables || [],
            assignedAt: order.assigned_at,
            // NO client_name
            // NO client_email
            // NO client_company
            // NO price
            // NO payment_status
        }));
    }

    // Client Submits a New Order
    createOrder(orderData) {
        const user = this.getCurrentUser();
        if (!user) throw new Error('Must be logged in to create an order');

        const orderNumber = 'ORD-' + Math.floor(1000 + Math.random() * 9000);
        const newOrder = {
            id: 'ord-' + Date.now(),
            order_number: orderNumber,
            client_id: user.id,
            client_name: user.displayName,
            client_email: user.email,
            client_company: user.company || '',
            service_type: orderData.serviceType || 'Digitizing',
            plan_name: orderData.planName || 'Custom Order',
            project_name: orderData.projectName,
            placement: orderData.placement,
            sizing: orderData.sizing,
            file_format: orderData.fileFormat || 'DST, EMB',
            instructions: orderData.instructions || '',
            raw_artwork_files: orderData.rawArtworkFiles || [],
            price: orderData.price || 20.00,
            currency: 'USD',
            payment_status: 'paid',
            payment_method: 'PayPal',
            assigned_digitizer_id: null,
            assigned_digitizer_name: null,
            assigned_at: null,
            status: 'pending_review',
            deliverables: [],
            created_at: new Date().toISOString()
        };

        const allOrders = JSON.parse(localStorage.getItem('dezan_orders') || '[]');
        allOrders.unshift(newOrder);
        localStorage.setItem('dezan_orders', JSON.stringify(allOrders));

        // Sync to remote InsForge if online
        this.syncOrderToInsForge(newOrder);

        return newOrder;
    }

    // Admin Assigns a Ticket to a Digitizer
    assignDigitizer(orderNumber, digitizerId, digitizerName) {
        const allOrders = JSON.parse(localStorage.getItem('dezan_orders') || '[]');
        const order = allOrders.find(o => o.order_number === orderNumber);
        if (!order) return false;

        order.assigned_digitizer_id = digitizerId;
        order.assigned_digitizer_name = digitizerName;
        order.assigned_at = new Date().toISOString();
        order.status = 'assigned';

        localStorage.setItem('dezan_orders', JSON.stringify(allOrders));
        return true;
    }

    // Digitizer Submits Completed .dst/.emb Deliverables
    completeDigitizerTask(orderNumber, deliverables) {
        const allOrders = JSON.parse(localStorage.getItem('dezan_orders') || '[]');
        const order = allOrders.find(o => o.order_number === orderNumber);
        if (!order) return false;

        order.deliverables = deliverables;
        order.status = 'completed';

        localStorage.setItem('dezan_orders', JSON.stringify(allOrders));
        return true;
    }

    // Get list of available digitizers (For Admin assignment dropdown)
    getDigitizers() {
        return JSON.parse(localStorage.getItem('dezan_digitizers') || '[]');
    }

    // Remote sync hook to InsForge REST
    async syncOrderToInsForge(order) {
        try {
            await fetch(`${this.baseUrl}/api/database/records/orders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': this.anonKey,
                    'Authorization': `Bearer ${this.anonKey}`
                },
                body: JSON.stringify([order])
            });
        } catch (err) {
            console.warn('InsForge offline sync note:', err.message);
        }
    }
}

// Export singleton instance
window.insforgeClient = new InsForgeClient();
