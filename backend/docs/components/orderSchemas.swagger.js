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
 *         subtotal:
 *           type: number
 *           example: 507
 *         gstAmount:
 *           type: number
 *           example: 91
 *         gstRate:
 *           type: number
 *           example: 18
 *         paymentMethod:
 *           type: string
 *           enum: [Cash, COD, GPay, PhonePe, NetBanking, UPI, Card]
 *           default: Cash
 *         paymentStatus:
 *           type: string
 *           enum: [Pending, Paid]
 *           default: Pending
 *         orderStatus:
 *           type: string
 *           enum: [Pending, Confirmed, Preparing, Completed, Cancelled, Delivered]
 *           default: Pending
 *         returnStatus:
 *           type: string
 *           enum: [None, Requested, Accepted, Shipped, Delivered, Rejected]
 *           default: None
 *         returnReason:
 *           type: string
 *         returnPhotos:
 *           type: array
 *           items:
 *             type: string
 *           description: Cloudinary URLs of return evidence photos
 *         returnVideo:
 *           type: string
 *           description: Cloudinary URL of optional unboxing video
 *         returnRequestedAt:
 *           type: string
 *           format: date-time
 *         returnResolvedAt:
 *           type: string
 *           format: date-time
 *         razorpayOrderId:
 *           type: string
 *           example: order_xxxxxxxx
 *         razorpayPaymentId:
 *           type: string
 *           example: pay_xxxxxxxx
 *         paidAt:
 *           type: string
 *           format: date-time
 *         trackingToken:
 *           type: string
 *           description: Secret token for customer order tracking (excluded from owner list APIs)
 *           example: a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456
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
 *           enum: [Cash, COD, GPay, PhonePe, NetBanking, UPI, Card]
 *           default: Cash
 *           example: GPay
 *     OrderStatusUpdateInput:
 *       type: object
 *       required: [orderStatus]
 *       properties:
 *         orderStatus:
 *           type: string
 *           enum: [Pending, Confirmed, Preparing, Completed, Cancelled, Delivered]
 *           example: Confirmed
 *     OrderReturnStatusUpdateInput:
 *       type: object
 *       required: [returnStatus]
 *       properties:
 *         returnStatus:
 *           type: string
 *           enum: [Approved, Accepted, Rejected, Shipped, Delivered]
 *           example: Accepted
 *         returnTrackingId:
 *           type: string
 *           maxLength: 100
 *         returnCourier:
 *           type: string
 *           maxLength: 100
 */
