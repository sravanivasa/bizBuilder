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
 */