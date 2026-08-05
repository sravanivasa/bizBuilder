/**
 * @swagger
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       required:
 *         - productName
 *         - price
 *         - stock
 *         - business
 *       properties:
 *         _id:
 *           type: string
 *           example: 68904a123456789abcdef123
 *         productName:
 *           type: string
 *           example: Chicken Biryani
 *         description:
 *           type: string
 *           example: Delicious homemade chicken biryani.
 *         price:
 *           type: number
 *           example: 299
 *         image:
 *           type: string
 *           example: uploads/products/biryani.jpg
 *         stock:
 *           type: number
 *           example: 50
 *         business:
 *           type: string
 *           description: Business ID
 *           example: 68904a123456789abcdef111
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     ProductCreateInput:
 *       type: object
 *       required: [productName, price, stock, image]
 *       properties:
 *         productName:
 *           type: string
 *           example: Chicken Biryani
 *         description:
 *           type: string
 *           example: Delicious homemade chicken biryani.
 *         price:
 *           type: number
 *           minimum: 0.01
 *           example: 299
 *         stock:
 *           type: integer
 *           minimum: 0
 *           example: 50
 *         image:
 *           type: string
 *           format: binary
 *           description: Product image (JPG, PNG, or WebP).
 *     ProductUpdateInput:
 *       type: object
 *       properties:
 *         productName:
 *           type: string
 *           minLength: 1
 *           example: Chicken Dum Biryani
 *         description:
 *           type: string
 *         price:
 *           type: number
 *           minimum: 0.01
 *           example: 329
 *         stock:
 *           type: integer
 *           minimum: 0
 *           description: Required by the current update validator.
 *           example: 45
 *         image:
 *           type: string
 *           format: binary
 *           description: Optional replacement product image.
 */
