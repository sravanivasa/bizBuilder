const multer = require("multer");
const path = require("path");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

const storage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: "biz-builder/products",
        resource_type: "image",
        allowed_formats: ["jpg", "jpeg", "png", "webp"]
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedMimeTypes = new Set([
            "image/jpeg",
            "image/png",
            "image/webp"
        ]);
        const allowedExtensions = new Set([".jpg", ".jpeg", ".png", ".webp"]);
        const extension = path.extname(file.originalname).toLowerCase();
        const hasAllowedExtension = allowedExtensions.has(extension);

        // Some clients label valid image uploads as application/octet-stream.
        if (allowedMimeTypes.has(file.mimetype) ||
            (file.mimetype === "application/octet-stream" && hasAllowedExtension)) {
            return cb(null, true);
        }

        cb(new Error("Upload a JPG, PNG, or WebP image file"));
    }
});

module.exports = upload;
