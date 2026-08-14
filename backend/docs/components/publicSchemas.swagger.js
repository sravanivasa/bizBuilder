/**
 * @swagger
 * components:
 *   schemas:
 *     PublicBusiness:
 *       type: object
 *       properties:
 *         businessName:
 *           type: string
 *           example: Priya's Home Kitchen
 *         category:
 *           type: string
 *           example: home_cooking
 *         phoneNumber:
 *           type: string
 *           example: "9876543210"
 *         address:
 *           type: string
 *           example: 12 MG Road, Hyderabad
 *         gstEnabled:
 *           type: boolean
 *           example: true
 *         gstRate:
 *           type: number
 *           example: 18
 *     PublicBusinessResponse:
 *       type: object
 *       properties:
 *         success: { type: boolean, example: true }
 *         message: { type: string, example: Business fetched successfully }
 *         business: { $ref: '#/components/schemas/PublicBusiness' }
 *     PublicProduct:
 *       type: object
 *       properties:
 *         _id: { type: string }
 *         productName: { type: string, example: Mango Pickle }
 *         description: { type: string }
 *         price: { type: number, example: 199 }
 *         stock: { type: integer, example: 10 }
 *         image: { type: string }
 *     PublicProductsResponse:
 *       type: object
 *       properties:
 *         success: { type: boolean, example: true }
 *         message: { type: string, example: Products fetched successfully }
 *         products:
 *           type: array
 *           items: { $ref: '#/components/schemas/PublicProduct' }
 *     PublicOrderCreateInput:
 *       type: object
 *       required: [customerName, customerPhone, customerAddress, products]
 *       properties:
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
 *           example: 12 MG Road, Hyderabad
 *         products:
 *           type: array
 *           minItems: 1
 *           items: { $ref: '#/components/schemas/OrderProductInput' }
 *         paymentMethod:
 *           type: string
 *           enum: [Cash, COD, GPay, PhonePe, NetBanking, UPI, Card]
 *           default: Cash
 *     TrackedOrderItem:
 *       type: object
 *       properties:
 *         productName: { type: string, example: Mango Pickle }
 *         quantity: { type: integer, example: 2 }
 *         price: { type: number, example: 199 }
 *         lineTotal: { type: number, example: 398 }
 *     TrackedOrder:
 *       type: object
 *       properties:
 *         orderId: { type: string }
 *         shortOrderId: { type: string, example: ABC123 }
 *         orderStatus:
 *           type: string
 *           enum: [Pending, Confirmed, Preparing, Completed, Cancelled, Delivered]
 *         returnStatus:
 *           type: string
 *           enum: [None, Requested, Accepted, Shipped, Delivered, Rejected]
 *         returnReason: { type: string }
 *         returnPhotos:
 *           type: array
 *           items: { type: string }
 *           description: Cloudinary URLs of return evidence photos
 *         returnVideo:
 *           type: string
 *           description: Cloudinary URL of optional unboxing video
 *         totalAmount: { type: number, example: 598 }
 *         subtotal: { type: number, example: 507 }
 *         gstAmount: { type: number, example: 91 }
 *         gstRate: { type: number, example: 18 }
 *         paymentMethod: { type: string, enum: [Cash, COD, GPay, PhonePe, NetBanking, UPI, Card] }
 *         customerName: { type: string }
 *         customerPhone:
 *           type: string
 *           description: Included only when tracking via secure token
 *         items:
 *           type: array
 *           items: { $ref: '#/components/schemas/TrackedOrderItem' }
 *         createdAt: { type: string, format: date-time }
 *         updatedAt: { type: string, format: date-time }
 *         returnRequestedAt: { type: string, format: date-time }
 *         returnResolvedAt: { type: string, format: date-time }
 *         returnTrackingId: { type: string }
 *         returnCourier: { type: string }
 *         returnShippedAt: { type: string, format: date-time }
 *         returnDeliveredAt: { type: string, format: date-time }
 *         business: { $ref: '#/components/schemas/PublicBusiness' }
 *     TrackedOrderResponse:
 *       type: object
 *       properties:
 *         success: { type: boolean, example: true }
 *         message: { type: string, example: Order tracked successfully }
 *         order: { $ref: '#/components/schemas/TrackedOrder' }
 *     ReturnRequestInput:
 *       type: object
 *       required: [phone]
 *       properties:
 *         phone:
 *           type: string
 *           example: "9876543210"
 *         reason:
 *           type: string
 *           example: Product was damaged on delivery
 *         photos:
 *           type: array
 *           items:
 *             type: string
 *             format: binary
 *           description: Optional damage photos (up to 5, JPG/PNG/WebP)
 *         video:
 *           type: string
 *           format: binary
 *           description: Optional unboxing video (MP4/MOV, max 50 MB)
 *     InvoiceItem:
 *       type: object
 *       properties:
 *         productName: { type: string }
 *         quantity: { type: integer }
 *         price: { type: number }
 *         lineTotal: { type: number }
 *     Invoice:
 *       type: object
 *       properties:
 *         orderId: { type: string }
 *         shortOrderId: { type: string }
 *         createdAt: { type: string, format: date-time }
 *         customerName: { type: string }
 *         customerPhone: { type: string }
 *         customerAddress: { type: string }
 *         paymentMethod: { type: string }
 *         paymentStatus: { type: string }
 *         items:
 *           type: array
 *           items: { $ref: '#/components/schemas/InvoiceItem' }
 *         subtotal: { type: number }
 *         gstAmount: { type: number }
 *         gstRate: { type: number }
 *         totalAmount: { type: number }
 *         business:
 *           type: object
 *           properties:
 *             businessName: { type: string }
 *             address: { type: string }
 *             phoneNumber: { type: string }
 *             email: { type: string }
 *             gstin: { type: string }
 *             gstEnabled: { type: boolean }
 *             gstRate: { type: number }
 *     InvoiceResponse:
 *       type: object
 *       properties:
 *         success: { type: boolean, example: true }
 *         message: { type: string, example: Invoice fetched successfully }
 *         invoice: { $ref: '#/components/schemas/Invoice' }
 */
