/**
 * Secure Multer File Upload Middleware
 */
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const config = require('../config/config');

// Ensure upload directories exist safely
[config.uploads.artworksDir, config.uploads.deliverablesDir].forEach((dir) => {
    try {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    } catch (err) {
        console.warn(`[Upload Dir Warning for ${dir}]:`, err.message);
    }
});


const sanitizeFilename = (filename) => {
    return filename
        .replace(/[^a-zA-Z0-9._-]/g, '_')
        .replace(/_{2,}/g, '_');
};

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const type = req.body.type || req.query.type || 'artwork';
        const targetDir = type === 'deliverable' 
            ? config.uploads.deliverablesDir 
            : config.uploads.artworksDir;
        cb(null, targetDir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const cleanName = path.basename(file.originalname, ext).slice(0, 40);
        const uniqueSuffix = `${Date.now()}_${Math.round(Math.random() * 1e6)}`;
        cb(null, `${sanitizeFilename(cleanName)}_${uniqueSuffix}${ext}`);
    }
});

const fileFilter = (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (config.uploads.allowedExtensions.includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error(`Unsupported file type: ${ext}. Allowed types: ${config.uploads.allowedExtensions.join(', ')}`), false);
    }
};

const upload = multer({
    storage,
    limits: {
        fileSize: config.uploads.maxFileSize
    },
    fileFilter
});

module.exports = upload;
