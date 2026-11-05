const path = require('path');
const { put } = require('@vercel/blob');

// Sends a file received by multer to Vercel Blob and returns its public URL
const uploadToBlob = async (file, folder) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const { url } = await put(`${folder}/${Date.now()}${extension}`, file.buffer, {
        access: 'public',
        addRandomSuffix: true,
        contentType: file.mimetype,
    });
    return url;
};

module.exports = { uploadToBlob };
