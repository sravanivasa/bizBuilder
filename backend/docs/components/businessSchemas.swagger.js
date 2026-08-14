/**
 * @swagger
 * components:
 *   schemas:
 *     Business:
 *       type: object
 *       required:
 *         - businessName
 *         - category
 *         - phoneNumber
 *         - address
 *         - owner
 *       properties:
 *         _id:
 *           type: string
 *           example: 68904a123456789abcdef123
 *         businessName:
 *           type: string
 *           example: Sravani Boutique
 *         category:
 *           type: string
 *           example: Clothing
 *         phoneNumber:
 *           type: string
 *           example: "9876543210"
 *         description:
 *           type: string
 *           example: Women's fashion and accessories.
 *         address:
 *           type: string
 *           example: Hyderabad, Telangana
 *         email:
 *           type: string
 *           format: email
 *           example: contact@sravaniboutique.com
 *         website:
 *           type: string
 *           format: uri
 *           example: https://sravaniboutique.com
 *         logo:
 *           type: string
 *           example: https://example.com/logo.png
 *         gstin:
 *           type: string
 *           example: 36ABCDE1234F1Z5
 *         gstEnabled:
 *           type: boolean
 *           example: true
 *         gstRate:
 *           type: number
 *           example: 18
 *         owner:
 *           type: string
 *           description: User ID of the business owner
 *           example: 68904a123456789abcdef111
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     BusinessCreateInput:
 *       type: object
 *       required: [businessName, category, phoneNumber, address]
 *       properties:
 *         businessName:
 *           type: string
 *           example: Sravani Boutique
 *         category:
 *           type: string
 *           example: Clothing
 *         phoneNumber:
 *           type: string
 *           example: "9876543210"
 *         description:
 *           type: string
 *           example: Women's fashion and accessories.
 *         address:
 *           type: string
 *           example: Hyderabad, Telangana
 *         email:
 *           type: string
 *           format: email
 *           example: contact@sravaniboutique.com
 *         website:
 *           type: string
 *           format: uri
 *           example: https://sravaniboutique.com
 *         logo:
 *           type: string
 *           example: https://example.com/logo.png
 *         gstin:
 *           type: string
 *           example: 36ABCDE1234F1Z5
 *         gstEnabled:
 *           type: boolean
 *           example: true
 *         gstRate:
 *           type: number
 *           example: 18
 *     BusinessUpdateInput:
 *       type: object
 *       properties:
 *         businessName:
 *           type: string
 *           minLength: 1
 *           example: Sravani Boutique
 *         category:
 *           type: string
 *           example: Clothing
 *         phoneNumber:
 *           type: string
 *           example: "9876543210"
 *         description:
 *           type: string
 *           example: Women's fashion and accessories.
 *         address:
 *           type: string
 *           example: Hyderabad, Telangana
 *         email:
 *           type: string
 *           format: email
 *           example: contact@sravaniboutique.com
 *         website:
 *           type: string
 *           format: uri
 *           example: https://sravaniboutique.com
 *         logo:
 *           type: string
 *           example: https://example.com/logo.png
 *         gstin:
 *           type: string
 *           example: 36ABCDE1234F1Z5
 *         gstEnabled:
 *           type: boolean
 *           example: true
 *         gstRate:
 *           type: number
 *           example: 18
 *         razorpayEnabled:
 *           type: boolean
 *           example: true
 *         razorpayKeyId:
 *           type: string
 *           example: rzp_test_xxxxxxxx
 *         hasRazorpaySecret:
 *           type: boolean
 *           description: True when a key secret is saved (secret is never returned in API responses)
 */