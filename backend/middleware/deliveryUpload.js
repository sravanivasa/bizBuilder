const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

const storage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: "bizbuilder/delivery",
        allowed_formats: ["jpg", "jpeg", "png", "webp"]
    }
});

const deliveryUpload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }
});

module.exports = deliveryUpload;
