/**
 * @swagger
 * components:
 *   schemas:
 *     OrderProduct:
 *       type: object
 *       required: [product, quantity, price]
 *       properties:
 *         product:
 *           type: string
 *           description: Product ID
 *           example: 68904a123456789abcdef222
 *         quantity:
 *           type: integer
 *           minimum: 1
 *           example: 2
 *         price:
 *           type: number
 *           description: Unit price captured when the order is created.
 *           example: 299
 *     OrderProductInput:
 *       type: object
 *       required: [product, quantity]
 *       properties:
 *         product:
 *           type: string
 *           description: Product ID
 *           example: 68904a123456789abcdef222
 *         quantity:
 *           type: integer
 *           minimum: 1
 *           example: 2
 *     Order:
 *       type: object
 *       required: [business, customerName, customerPhone, customerAddress, products, totalAmount]
 *       properties:
 *         _id:
 *           type: string
 *           example: 68904a123456789abcdef333
 *         business:
 *           type: string
 *           example: 68904a123456789abcdef111
 *         customerName:
 *           type: string
 *           example: Priya Sharma
 *         customerPhone:
 *           type: string
 *           example: "9876543210"
 *         isWhatsAppSameAsPhone:
 *           type: boolean
 *           default: true
 *         customerWhatsApp:
 *           type: string
 *           example: "9876543210"
 *         customerAddress:
 *           type: string
 *           example: 12 MG Road, Hyderabad, Telangana
 *         products:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/OrderProduct'
 *         totalAmount:
 *           type: number
 *           example: 598
 *         paymentMethod:
 *           type: string
 *           enum: [Cash, Card, UPI]
 *           default: Cash
 *         paymentStatus:
 *           type: string
 *           enum: [Pending, Paid]
 *           default: Pending
 *         orderStatus:
 *           type: string
 *           enum: [Pending, Confirmed, Preparing, Completed, Cancelled, Delivered]
 *           default: Pending
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     OrderCreateInput:
 *       type: object
 *       required: [businessId, customerName, customerPhone, customerAddress, products]
 *       properties:
 *         businessId:
 *           type: string
 *           example: 68904a123456789abcdef111
 *         customerName:
 *           type: string
 *           example: Priya Sharma
 *         customerPhone:
 *           type: string
 *           example: "9876543210"
 *         customerAddress:
 *           type: string
 *           example: 12 MG Road, Hyderabad, Telangana
 *         products:
 *           type: array
 *           minItems: 1
 *           items:
 *             $ref: '#/components/schemas/OrderProductInput'
 *         paymentMethod:
 *           type: string
 *           enum: [Cash, Card, UPI]
 *           default: Cash
 *           example: UPI
 *     OrderStatusUpdateInput:
 *       type: object
 *       required: [orderStatus]
 *       properties:
 *         orderStatus:
 *           type: string
 *           enum: [Pending, Confirmed, Preparing, Completed, Cancelled, Delivered]
 *           example: Confirmed
 */
