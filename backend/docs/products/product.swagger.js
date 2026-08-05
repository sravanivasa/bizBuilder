/**
 * @swagger
 * /api/products/{businessId}:
 *   post:
 *     summary: Create a product for a business
 *     tags: [Products]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ $ref: '#/components/parameters/BusinessId' }]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema: { $ref: '#/components/schemas/ProductCreateInput' }
 *     responses:
 *       201:
 *         description: Product created successfully
 *         content: { application/json: { schema: { $ref: '#/components/schemas/ProductResponse' } } }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 * /api/products/business/{businessId}:
 *   get:
 *     summary: Get all products for a business
 *     tags: [Products]
 *     parameters: [{ $ref: '#/components/parameters/BusinessId' }]
 *     responses:
 *       200:
 *         description: Products fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 products:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Product' }
 * /api/products/{productId}:
 *   get:
 *     summary: Get a product by ID
 *     tags: [Products]
 *     parameters: [{ $ref: '#/components/parameters/ProductId' }]
 *     responses:
 *       200:
 *         description: Product fetched successfully
 *         content: { application/json: { schema: { $ref: '#/components/schemas/ProductResponse' } } }
 *       404: { $ref: '#/components/responses/NotFound' }
 *   put:
 *     summary: Update a product
 *     tags: [Products]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ $ref: '#/components/parameters/ProductId' }]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema: { $ref: '#/components/schemas/ProductUpdateInput' }
 *     responses:
 *       200:
 *         description: Product updated successfully
 *         content: { application/json: { schema: { $ref: '#/components/schemas/ProductResponse' } } }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *   delete:
 *     summary: Delete a product
 *     tags: [Products]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ $ref: '#/components/parameters/ProductId' }]
 *     responses:
 *       200:
 *         description: Product deleted successfully
 *         content: { application/json: { schema: { $ref: '#/components/schemas/SuccessMessageResponse' } } }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
