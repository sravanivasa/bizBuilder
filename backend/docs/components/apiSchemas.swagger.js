/**
 * @swagger
 * components:
 *   parameters:
 *     BusinessId:
 *       in: path
 *       name: businessId
 *       required: true
 *       schema:
 *         type: string
 *         example: 68904a123456789abcdef111
 *     ProductId:
 *       in: path
 *       name: productId
 *       required: true
 *       schema:
 *         type: string
 *         example: 68904a123456789abcdef222
 *     OrderId:
 *       in: path
 *       name: id
 *       required: true
 *       schema:
 *         type: string
 *         example: 68904a123456789abcdef333
 *     BusinessEntityId:
 *       in: path
 *       name: id
 *       required: true
 *       schema:
 *         type: string
 *         example: 68904a123456789abcdef123
 *   schemas:
 *     ProductResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *         product:
 *           $ref: '#/components/schemas/Product'
 *     OrderResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *         order:
 *           $ref: '#/components/schemas/Order'
 *     SuccessMessageResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *     BusinessResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *         business:
 *           $ref: '#/components/schemas/Business'
 *     AuthResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *         token:
 *           type: string
 *           example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *         user:
 *           $ref: '#/components/schemas/User'
 *     UserProfileResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         user:
 *           $ref: '#/components/schemas/User'
 */
