/**
 * Dezan Digitizing — Shared JavaScript
 * Theme toggle, scroll reveal, active navigation, order system,
 * PayPal payment, and EmailJS notification
 */

document.addEventListener("DOMContentLoaded", () => {

    // ===== THEME TOGGLE =====
    const html = document.documentElement;
    const savedTheme = localStorage.getItem("theme");

    // Apply saved theme or default to light
    if (savedTheme === "dark") {
        html.classList.add("dark");
    } else {
        html.classList.remove("dark");
        localStorage.setItem("theme", "light");
    }

    // Update all theme toggle icons
    function updateThemeIcons() {
        const isDark = html.classList.contains("dark");
        document.querySelectorAll(".theme-toggle-icon").forEach(icon => {
            icon.textContent = isDark ? "light_mode" : "dark_mode";
        });
    }
    updateThemeIcons();

    // Bind click to all toggle buttons
    document.querySelectorAll(".theme-toggle-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            html.classList.toggle("dark");
            const isDark = html.classList.contains("dark");
            localStorage.setItem("theme", isDark ? "dark" : "light");
            updateThemeIcons();
        });
    });


    // ===== SCROLL REVEAL ANIMATIONS =====
    const revealElements = document.querySelectorAll(".reveal");
    if (revealElements.length > 0) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("revealed");
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });
        revealElements.forEach(el => observer.observe(el));
    }


    // ===== ACTIVE NAVIGATION STATE =====
    // Detect current page from the URL
    const currentPath = window.location.pathname;
    const currentPage = currentPath.substring(currentPath.lastIndexOf("/") + 1) || "index.html";

    // Highlight active link in desktop header nav
    document.querySelectorAll("nav a[data-nav]").forEach(link => {
        const linkPage = link.getAttribute("data-nav");
        if (linkPage === currentPage) {
            link.classList.add("text-primary");
            link.classList.remove("hover:text-primary");
        }
    });

    // Highlight active link in bottom mobile nav
    document.querySelectorAll("a[data-page]").forEach(link => {
        const linkPage = link.getAttribute("data-page");
        if (linkPage === currentPage) {
            link.classList.remove("text-slate-400");
            link.classList.add("text-primary");
        }
    });


    // ===================================================================
    //  ORDER SYSTEM (pricing.html only)
    // ===================================================================
    if (currentPage === "pricing.html" || currentPage === "pricing") {
        initOrderSystem();
    }

    // ===================================================================
    //  ORDER SUCCESS PAGE (order-success.html only)
    // ===================================================================
    if (currentPage === "order-success.html" || currentPage === "order-success") {
        initSuccessPage();
    }
    
    // ===================================================================
    //  LIGHTBOX FOR FEEDBACK IMAGES
    // ===================================================================
    initLightbox();

    // ===================================================================
    //  ARC GALLERY HERO (index.html only)
    // ===================================================================
    if (document.getElementById('arc-gallery-container')) {
        initArcGallery();
    }

});

// ===================================================================
//  ARC GALLERY HERO FUNCTIONALITY
// ===================================================================
function initArcGallery() {
    const container = document.getElementById('arc-gallery-container');
    const pivot = document.getElementById('arc-gallery-pivot');
    if (!container || !pivot) return;

    // High quality AI-generated mixed embroidery images
    const images = [
      'images/ai_flower.png',
      'images/ai_anime_1.png',
      'images/ai_car_1.png',
      'images/ai_pet.png',
      'images/ai_cartoon_1.png',
      'images/ai_fruits.png',
      'images/ai_anime_2.png',
      'images/ai_character.png',
      'images/ai_banana_2.png', // The single allowed banana
      'images/ai_car_2.png',
      'images/ai_cartoon_2.png',
      'images/ai_cartoon_3.png',
    ];

    const startAngle = 20;
    const endAngle = 160;
    
    // Configuration settings - Reduced base size slightly to better accommodate 12 images
    const config = {
        lg: { radius: 480, size: 110 },
        md: { radius: 360, size: 90 },
        sm: { radius: 260, size: 70 }
    };

    let currentConfig = config.lg;

    const count = Math.max(images.length, 2);
    const step = (endAngle - startAngle) / (count - 1);

    function renderArc() {
        const width = window.innerWidth;
        // Dynamically calculate radius and size to prevent horizontal overflow on all devices
        if (width < 640) {
            currentConfig = { 
                radius: Math.min(width * 0.38, config.sm.radius), 
                size: Math.min(width * 0.16, config.sm.size) 
            };
        } else if (width < 1024) {
            currentConfig = { 
                radius: Math.min(width * 0.42, config.md.radius), 
                size: Math.min(width * 0.12, config.md.size) 
            };
        } else {
            currentConfig = { 
                radius: Math.min(width * 0.4, config.lg.radius), 
                size: config.lg.size 
            };
        }

        container.style.height = `${Math.max(currentConfig.radius * 1.2, 160)}px`;
        pivot.innerHTML = ''; // Clear existing

        images.forEach((src, i) => {
            const angle = startAngle + step * i;
            const angleRad = (angle * Math.PI) / 180;
            const x = Math.cos(angleRad) * currentConfig.radius;
            const y = Math.sin(angleRad) * currentConfig.radius;
            
            const item = document.createElement('div');
            item.className = 'absolute opacity-0 animate-fade-in-up-arc group';
            // Styling exactly like the React component translated to standard DOM manipulation
            item.style.width = `${currentConfig.size}px`;
            item.style.height = `${currentConfig.size}px`;
            item.style.left = `calc(50% + ${x}px)`;
            item.style.bottom = `${y}px`;
            item.style.transform = `translate(-50%, 50%)`;
            item.style.animationDelay = `${i * 100}ms`;
            item.style.animationFillMode = 'forwards';
            item.style.zIndex = count - i;

            const inner = document.createElement('div');
            // Using Tailwind classes provided in the reference prompt
            inner.className = 'rounded-2xl shadow-xl overflow-hidden ring-1 ring-slate-200 dark:ring-slate-700 bg-white dark:bg-slate-800 transition-transform duration-300 hover:scale-110 w-full h-full cursor-pointer';
            inner.style.transform = `rotate(${angle / 4}deg)`;

            const img = document.createElement('img');
            img.src = src;
            img.alt = 'Embroidery Work ' + (i + 1);
            img.className = 'block w-full h-full object-cover transition-transform duration-500 group-hover:scale-110';
            img.draggable = false;
            img.onerror = () => { img.src = 'https://placehold.co/400x400/334155/e2e8f0?text=Image'; };

            inner.appendChild(img);
            item.appendChild(inner);
            pivot.appendChild(item);
        });
    }

    // Initial render
    renderArc();

    // Re-render on resize with basic debounce
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(renderArc, 100);
    });
}

//  LIGHTBOX FUNCTIONALITY
// ===================================================================
function initLightbox() {
    const feedbackImages = document.querySelectorAll('.marquee-item, .carousel-track img');
    if (feedbackImages.length === 0) return;

    // Create lightbox HTML structure
    const overlay = document.createElement('div');
    overlay.className = 'lightbox-overlay';
    
    const imgEl = document.createElement('img');
    imgEl.className = 'lightbox-image';
    
    const closeBtn = document.createElement('button');
    closeBtn.className = 'lightbox-close';
    closeBtn.innerHTML = '&times;';
    
    overlay.appendChild(imgEl);
    overlay.appendChild(closeBtn);
    document.body.appendChild(overlay);

    // Open lightbox (using pointerdown because CSS animation moves the element, breaking 'click')
    feedbackImages.forEach(img => {
        img.addEventListener('pointerdown', (e) => {
            // Ignore right-clicks
            if (e.button !== 0 && e.pointerType === 'mouse') return;
            
            imgEl.src = img.src;
            overlay.style.display = 'flex';
            // Force reflow for transition
            overlay.offsetHeight;
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden'; // Prevent background scrolling
        });
    });

    // Close lightbox
    function closeLightbox() {
        overlay.classList.remove('active');
        setTimeout(() => {
            overlay.style.display = 'none';
            document.body.style.overflow = '';
        }, 300); // Matches CSS transition duration
    }

    closeBtn.addEventListener('click', closeLightbox);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            closeLightbox();
        }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && overlay.classList.contains('active')) {
            closeLightbox();
        }
    });
}


// ===================================================================
//  GLOBAL — Plan Selection (called from onclick in pricing.html)
// ===================================================================
function selectPlan(planName, price) {
    const planInput = document.getElementById("order-plan");
    const amountInput = document.getElementById("order-amount");
    const banner = document.getElementById("selected-plan-banner");
    const nameEl = document.getElementById("selected-plan-name");
    const priceEl = document.getElementById("selected-plan-price");
    const summary = document.getElementById("order-summary");
    const summaryPlan = document.getElementById("summary-plan");
    const summaryTotal = document.getElementById("summary-total");

    // Set hidden values
    planInput.value = planName;
    amountInput.value = price;

    // Show banner
    banner.classList.remove("hidden");
    nameEl.textContent = planName;
    priceEl.textContent = "$" + price;

    // Update summary
    summary.classList.remove("hidden");
    summaryPlan.textContent = planName + " ($" + price + ")";
    summaryTotal.textContent = "$" + price;

    // Update service in summary
    const serviceType = document.getElementById("service-type");
    if (serviceType) {
        document.getElementById("summary-service").textContent = serviceType.value;
    }

    // Scroll to order form
    const orderSection = document.getElementById("order-section");
    if (orderSection) {
        orderSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    // Clear any error
    hideFormError();
}


// ===================================================================
//  ORDER SYSTEM INIT
// ===================================================================
function initOrderSystem() {

    // ----- EmailJS Init -----
    // *** REPLACE with your EmailJS public key ***
    if (typeof emailjs !== "undefined") {
        emailjs.init("YOUR_EMAILJS_PUBLIC_KEY");
    }

    // ----- File Upload -----
    const dropZone = document.getElementById("drop-zone");
    const fileInput = document.getElementById("file-input");
    const uploadIcon = document.getElementById("upload-icon");
    const uploadText = document.getElementById("upload-text");
    const uploadFilename = document.getElementById("upload-filename");

    if (fileInput) {
        fileInput.addEventListener("change", () => {
            if (fileInput.files.length > 0) {
                showUploadedFile(fileInput.files[0]);
            }
        });
    }

    if (dropZone) {
        dropZone.addEventListener("dragover", (e) => {
            e.preventDefault();
            dropZone.classList.add("drag-active");
        });
        dropZone.addEventListener("dragleave", () => {
            dropZone.classList.remove("drag-active");
        });
        dropZone.addEventListener("drop", (e) => {
            e.preventDefault();
            dropZone.classList.remove("drag-active");
            if (e.dataTransfer.files.length > 0) {
                fileInput.files = e.dataTransfer.files;
                showUploadedFile(e.dataTransfer.files[0]);
            }
        });
    }

    function showUploadedFile(file) {
        uploadIcon.textContent = "check_circle";
        uploadIcon.classList.add("text-green-500");
        uploadIcon.classList.remove("text-primary");
        uploadText.textContent = "File selected:";
        uploadFilename.textContent = file.name + " (" + (file.size / 1024).toFixed(1) + " KB)";
    }

    // ----- Service type sync with summary -----
    const serviceType = document.getElementById("service-type");
    if (serviceType) {
        serviceType.addEventListener("change", () => {
            const summaryService = document.getElementById("summary-service");
            if (summaryService) summaryService.textContent = serviceType.value;
        });
    }

    // ----- PayPal Buttons -----
    renderPayPalButtons();
}


// ===================================================================
//  PAYPAL INTEGRATION
// ===================================================================
function renderPayPalButtons() {
    const container = document.getElementById("paypal-button-container");
    if (!container || typeof paypal === "undefined") return;

    paypal.Buttons({
        style: {
            shape: "rect",
            color: "gold",
            layout: "vertical",
            label: "paypal",
            height: 50
        },

        // Validate form before creating order
        onClick: function (data, actions) {
            if (!validateOrderForm()) {
                return actions.reject();
            }
            return actions.resolve();
        },

        // Create PayPal order with the selected plan amount
        createOrder: function (data, actions) {
            const amount = document.getElementById("order-amount").value;
            const planName = document.getElementById("order-plan").value;
            const projectName = document.getElementById("project-name").value;

            return actions.order.create({
                purchase_units: [{
                    description: "Dezan Digitizing — " + planName + " Plan: " + projectName,
                    amount: {
                        currency_code: "USD",
                        value: amount
                    }
                }]
            });
        },

        // Handle successful payment
        onApprove: function (data, actions) {
            return actions.order.capture().then(function (orderData) {
                const transactionId = orderData.purchase_units[0].payments.captures[0].id;
                const amount = document.getElementById("order-amount").value;
                const planName = document.getElementById("order-plan").value;
                const projectName = document.getElementById("project-name").value;
                const customerName = document.getElementById("customer-name").value;
                const customerEmail = document.getElementById("customer-email").value;
                const serviceType = document.getElementById("service-type").value;
                const placement = document.getElementById("design-placement").value || "N/A";
                const sizing = document.getElementById("design-sizing").value || "N/A";
                const fileFormat = document.getElementById("file-format").value || "N/A";
                const notes = document.getElementById("order-notes").value || "None";

                // Send email notification
                sendOrderEmail({
                    transactionId,
                    planName,
                    amount,
                    projectName,
                    customerName,
                    customerEmail,
                    serviceType,
                    placement,
                    sizing,
                    fileFormat,
                    notes
                });

                // Redirect to success page
                const params = new URLSearchParams({
                    txn: transactionId,
                    plan: planName,
                    project: projectName,
                    service: serviceType,
                    amount: amount
                });
                window.location.href = "order-success.html?" + params.toString();
            });
        },

        onError: function (err) {
            console.error("PayPal error:", err);
            showFormError("Payment error. Please try again or contact us at fdezan91@gmail.com");
        }
    }).render("#paypal-button-container");
}


// ===================================================================
//  FORM VALIDATION
// ===================================================================
function validateOrderForm() {
    const plan = document.getElementById("order-plan").value;
    const name = document.getElementById("customer-name").value.trim();
    const email = document.getElementById("customer-email").value.trim();
    const project = document.getElementById("project-name").value.trim();

    if (!plan) {
        showFormError("Please select a plan above before proceeding to payment.");
        return false;
    }
    if (!name) {
        showFormError("Please enter your name.");
        return false;
    }
    if (!email || !email.includes("@")) {
        showFormError("Please enter a valid email address.");
        return false;
    }
    if (!project) {
        showFormError("Please enter a project name.");
        return false;
    }

    const placement = document.getElementById("design-placement").value.trim();
    const sizing = document.getElementById("design-sizing").value.trim();
    const fileFormat = document.getElementById("file-format").value.trim();

    if (!placement) {
        showFormError("Please enter the style/location (e.g. Left Chest, Hat, Jacket Back).");
        return false;
    }
    if (!sizing) {
        showFormError("Please enter the sizing details.");
        return false;
    }
    if (!fileFormat) {
        showFormError("Please enter the required file format (e.g. DST, PES, EXP).");
        return false;
    }

    hideFormError();
    return true;
}

function showFormError(message) {
    const errorDiv = document.getElementById("form-error");
    const errorText = document.getElementById("form-error-text");
    if (errorDiv) {
        errorDiv.classList.remove("hidden");
        errorText.textContent = message;
        errorDiv.scrollIntoView({ behavior: "smooth", block: "center" });
    }
}

function hideFormError() {
    const errorDiv = document.getElementById("form-error");
    if (errorDiv) {
        errorDiv.classList.add("hidden");
    }
}


// ===================================================================
//  EMAIL NOTIFICATION (EmailJS)
// ===================================================================
function sendOrderEmail(orderData) {
    if (typeof emailjs === "undefined") {
        console.warn("EmailJS not loaded — skipping email notification.");
        return;
    }

    // *** REPLACE these with your actual EmailJS Service ID and Template ID ***
    const SERVICE_ID = "YOUR_SERVICE_ID";
    const TEMPLATE_ID = "YOUR_TEMPLATE_ID";

    const templateParams = {
        to_email: "fdezan91@gmail.com",
        from_name: orderData.customerName,
        from_email: orderData.customerEmail,
        transaction_id: orderData.transactionId,
        plan: orderData.planName,
        amount: "$" + orderData.amount,
        project_name: orderData.projectName,
        service_type: orderData.serviceType,
        placement: orderData.placement,
        sizing: orderData.sizing,
        file_format: orderData.fileFormat,
        notes: orderData.notes,
        order_date: new Date().toLocaleString()
    };

    emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams)
        .then(() => {
            console.log("Order notification email sent successfully.");
        })
        .catch((error) => {
            console.error("Email sending failed:", error);
        });
}


// ===================================================================
//  ORDER SUCCESS PAGE
// ===================================================================
function initSuccessPage() {
    const params = new URLSearchParams(window.location.search);

    const txnEl = document.getElementById("success-txn-id");
    const planEl = document.getElementById("success-plan");
    const projectEl = document.getElementById("success-project");
    const serviceEl = document.getElementById("success-service");
    const amountEl = document.getElementById("success-amount");

    if (txnEl) txnEl.textContent = params.get("txn") || "—";
    if (planEl) planEl.textContent = params.get("plan") || "—";
    if (projectEl) projectEl.textContent = params.get("project") || "—";
    if (serviceEl) serviceEl.textContent = params.get("service") || "—";
    if (amountEl) amountEl.textContent = "$" + (params.get("amount") || "0");
}
