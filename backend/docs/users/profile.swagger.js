/**
 * @swagger
 * /api/users/profile:
 *   get:
 *     summary: Get logged-in user's profile
 *     operationId: getUserProfile
 *     tags: [Users]
 *     description: Returns the profile details of the authenticated user.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 user:
 *                  $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */