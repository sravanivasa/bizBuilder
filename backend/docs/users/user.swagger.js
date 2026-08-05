/**
 * @swagger
 * /api/users/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/UserRegisterInput' }
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content: { application/json: { schema: { $ref: '#/components/schemas/AuthResponse' } } }
 *       400: { $ref: '#/components/responses/ValidationError' }
 * /api/users/login:
 *   post:
 *     summary: Login a user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/UserLoginInput' }
 *     responses:
 *       200:
 *         description: User logged in successfully
 *         content: { application/json: { schema: { $ref: '#/components/schemas/AuthResponse' } } }
 *       400: { $ref: '#/components/responses/ValidationError' }
 * /api/users/profile:
 *   get:
 *     summary: Get logged-in user's profile
 *     tags: [Users]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Profile fetched successfully
 *         content: { application/json: { schema: { $ref: '#/components/schemas/UserProfileResponse' } } }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 * /api/users:
 *   get:
 *     summary: Get all users
 *     tags: [Users]
 *     description: Admin only.
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 users:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/User' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
