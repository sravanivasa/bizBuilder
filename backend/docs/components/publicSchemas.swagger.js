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
 *           enum: [Cash, Card, UPI]
 *           default: Cash
 */
