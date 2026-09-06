/**
 * File Upload Controller
 * Processes uploads for artworks and deliverable stitch files
 */
const { success, badRequest, error } = require('../utils/apiResponse');

const uploadFile = async (req, res) => {
    try {
        if (!req.file && (!req.files || req.files.length === 0)) {
            return badRequest(res, 'No file was uploaded');
        }

        const type = req.body.type || req.query.type || 'artwork';
        const subfolder = type === 'deliverable' ? 'deliverables' : 'artworks';

        if (req.file) {
            const fileData = {
                name: req.file.originalname,
                url: `/uploads/${subfolder}/${req.file.filename}`,
                size: req.file.size,
                mimetype: req.file.mimetype
            };
            return success(res, fileData, 'File uploaded successfully', 201);
        }

        // Multiple files
        const uploadedFiles = req.files.map(f => ({
            name: f.originalname,
            url: `/uploads/${subfolder}/${f.filename}`,
            size: f.size,
            mimetype: f.mimetype
        }));

        return success(res, uploadedFiles, 'Files uploaded successfully', 201);
    } catch (err) {
        console.error('[Upload File Error]:', err);
        return error(res, `Upload failed: ${err.message}`);
    }
};

module.exports = {
    uploadFile
};
