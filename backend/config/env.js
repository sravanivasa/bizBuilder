const requiredEnvVars = ["MONGODB_URI", "JWT_SECRET"];

const validateEnv = () => {
    const missing = requiredEnvVars.filter((key) => !process.env[key]);

    if (missing.length) {
        throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
    }

    if (process.env.JWT_SECRET.length < 32) {
        throw new Error("JWT_SECRET must be at least 32 characters long");
    }
};

module.exports = { validateEnv };
