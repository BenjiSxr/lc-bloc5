const multer = require('multer');
const path = require('path');

const upload = multer({
    // Kept in memory, then sent to Vercel Blob by the controllers
    storage: multer.memoryStorage(),
    limits: { fileSize: 4 * 1024 * 1024 }, // 4MB: Vercel rejects requests over 4.5MB
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|webp/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Images only!'));
    }
});

module.exports = upload;
