const path = require("path");
const dotenv = require("dotenv");
dotenv.config({ path: path.resolve(__dirname, ".env") });

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const morgan = require("morgan");
const hpp = require("hpp");

const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config/swagger");
const { validateEnv } = require("./config/env");

const connectDB = require("./config/db");
const sanitizeInput = require("./middleware/sanitizeInput");

const userRoutes = require("./routes/userRoutes");
const businessRoutes = require("./routes/businessRoutes");
const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");
const publicRoutes = require("./routes/publicRoutes");
const errorHandler = require("./middleware/errorMiddleware");

validateEnv();

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: {
        success: false,
        message: "Too many requests. Please try again after 15 minutes."
    },
    standardHeaders: true,
    legacyHeaders: false
});

const app = express();
const corsOrigin = process.env.CORS_ORIGIN || "http://localhost:5173";

app.use(helmet());
app.use(limiter);
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(
    cors({
        origin: corsOrigin.split(",").map((origin) => origin.trim()),
        credentials: true
    })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "100kb" }));
app.use(sanitizeInput);
app.use(hpp());

app.get("/", (req, res) => {
    res.send("Backend + MongoDB Ready");
});

app.get("/api/health", (req, res) => {
    res.status(200).json({ success: true, message: "OK" });
});

app.use("/api/users", userRoutes);
app.use("/api/businesses", businessRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/public", publicRoutes);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use((error, req, res, next) => {
    if (error.type === "entity.too.large") {
        return res.status(413).json({
            success: false,
            message: "Request body is too large. Try importing in smaller batches."
        });
    }

    if (error.name === "MulterError") {
        const message =
            error.code === "LIMIT_FILE_SIZE"
                ? "Image must be 5 MB or smaller"
                : error.message;
        return res.status(400).json({ success: false, message });
    }

    if (error.message === "Upload a JPG, PNG, or WebP image file") {
        return res.status(400).json({ success: false, message: error.message });
    }

    next(error);
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
let server;

const startServer = async () => {
    try {
        await connectDB();
        server = app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    } catch (error) {
        console.error("Failed to start server:", error.message);
        process.exit(1);
    }
};

const shutdown = async (signal) => {
    console.log(`${signal} received. Shutting down gracefully...`);
    if (server) {
        server.close(() => process.exit(0));
    } else {
        process.exit(0);
    }
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

startServer();
