/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: 6a7184c32be0f10e7df88d73
 *         name:
 *           type: string
 *           example: Sravani
 *         email:
 *           type: string
 *           example: sravani@gmail.com
 *         role:
 *           type: string
 *           enum: [user, admin]
 *           example: user
 *     UserRegisterInput:
 *       type: object
 *       required: [name, email, password]
 *       properties:
 *         name:
 *           type: string
 *           example: Sravani
 *         email:
 *           type: string
 *           format: email
 *           example: sravani@gmail.com
 *         password:
 *           type: string
 *           example: Password@123
 *     UserLoginInput:
 *       type: object
 *       required: [email, password]
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: sravani@gmail.com
 *         password:
 *           type: string
 *           example: Password@123
 */