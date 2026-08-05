/**
 * @swagger
 * /api/businesses:
 *   post:
 *     summary: Create a new business
 *     tags: [Business]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/BusinessCreateInput' }
 *     responses:
 *       201:
 *         description: Business created successfully
 *         content: { application/json: { schema: { $ref: '#/components/schemas/BusinessResponse' } } }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 * /api/businesses/my-businesses:
 *   get:
 *     summary: Get logged-in user's businesses
 *     tags: [Business]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Businesses fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: Businesses fetched successfully }
 *                 businesses:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Business' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 * /api/businesses/{id}:
 *   get:
 *     summary: Get business by ID
 *     tags: [Business]
 *     parameters: [{ $ref: '#/components/parameters/BusinessEntityId' }]
 *     responses:
 *       200:
 *         description: Business fetched successfully
 *         content: { application/json: { schema: { $ref: '#/components/schemas/BusinessResponse' } } }
 *       404: { $ref: '#/components/responses/NotFound' }
 *   put:
 *     summary: Update business
 *     tags: [Business]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ $ref: '#/components/parameters/BusinessEntityId' }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/BusinessUpdateInput' }
 *     responses:
 *       200:
 *         description: Business updated successfully
 *         content: { application/json: { schema: { $ref: '#/components/schemas/BusinessResponse' } } }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *   delete:
 *     summary: Delete business
 *     tags: [Business]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ $ref: '#/components/parameters/BusinessEntityId' }]
 *     responses:
 *       200:
 *         description: Business deleted successfully
 *         content: { application/json: { schema: { $ref: '#/components/schemas/SuccessMessageResponse' } } }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
