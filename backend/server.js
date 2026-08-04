const path = require("path");
const dotenv = require("dotenv");
dotenv.config({ path: path.resolve(__dirname, ".env") });

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const morgan = require("morgan");
const mongoSanitize = require("express-mongo-sanitize");
const hpp = require("hpp");

const connectDB = require("./config/db");

const userRoutes = require("./routes/userRoutes");
const businessRoutes = require("./routes/businessRoutes");
const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");
const errorHandler  = require("./middleware/errorMiddleware");


const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: {
        success: false,
        message: "Too many requests. Please try again after 15 minutes."
    },
    standardHeaders: true,
    legacyHeaders: false
});
const app = express();


app.use(helmet());
app.use(limiter);
app.use(morgan("dev"));

app.use(cors());

//middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use(mongoSanitize());
app.use(hpp());


// Test Route
app.get("/", (req, res) => {
    res.send("Backend + MongoDB Ready 🚀");
});

// Routes

app.use("/api/users", userRoutes);
app.use("/api/businesses", businessRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);

//multer error handling
app.use((error, req, res, next) => {
    if (error.name === "MulterError") {
        const message = error.code === "LIMIT_FILE_SIZE"
            ? "Image must be 5 MB or smaller"
            : error.message;
        return res.status(400).json({ success: false, message });
    }

    if (error.message === "Upload a JPG, PNG, or WebP image file") {
        return res.status(400).json({ success: false, message: error.message });
    }

    next(error);
});

//global error handler
app.use(errorHandler);


const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        await connectDB();
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    } catch (error) {
        console.error("Failed to start server:", error.message);
        process.exit(1);
    }
};


startServer();
