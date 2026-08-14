const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

const IMAGE_TYPES = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);
const VIDEO_TYPES = new Set(["video/mp4", "video/quicktime"]);

const storage = new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => {
        if (VIDEO_TYPES.has(file.mimetype)) {
            return {
                folder: "bizbuilder/returns",
                resource_type: "video",
                allowed_formats: ["mp4", "mov"]
            };
        }

        return {
            folder: "bizbuilder/returns",
            allowed_formats: ["jpg", "jpeg", "png", "webp"]
        };
    }
});

const returnUpload = multer({
    storage,
    limits: { fileSize: 50 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.fieldname === "photos" && IMAGE_TYPES.has(file.mimetype)) {
            return cb(null, true);
        }

        if (file.fieldname === "video" && VIDEO_TYPES.has(file.mimetype)) {
            return cb(null, true);
        }

        cb(new Error("Upload JPG, PNG, WebP images or MP4/MOV video only"));
    }
});

module.exports = returnUpload;
