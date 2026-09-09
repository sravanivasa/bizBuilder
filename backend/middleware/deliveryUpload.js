const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

const IMAGE_TYPES = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);

const storage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: "bizbuilder/delivery",
        allowed_formats: ["jpg", "jpeg", "png", "webp"]
    }
});

const deliveryUpload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (IMAGE_TYPES.has(file.mimetype)) {
            return cb(null, true);
        }

        cb(new Error("Upload a JPG, PNG, or WebP image file"));
    }
});

module.exports = deliveryUpload;
