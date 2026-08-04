const swaggerJsdoc = require("swagger-jsdoc");

const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Business Management API",
            version: "1.0.0",
            description: "API documentation for our Business Management Platform"
        },
        servers: [
            {
                url: "http://localhost:5000"
            }
        ],

        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT"
                }
            }
        }
    },
    apis: ["./docs/**/*.js"]
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;