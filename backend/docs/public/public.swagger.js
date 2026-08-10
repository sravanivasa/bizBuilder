/**
 * @swagger
 * /api/public/businesses/{id}:
 *   get:
 *     summary: Get public business profile
 *     tags: [Public]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Business fetched successfully
 *         content: { application/json: { schema: { $ref: '#/components/schemas/PublicBusinessResponse' } } }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       404: { $ref: '#/components/responses/NotFound' }
 * /api/public/businesses/{businessId}/products:
 *   get:
 *     summary: Get in-stock products for a business storefront
 *     tags: [Public]
 *     parameters:
 *       - in: path
 *         name: businessId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Products fetched successfully
 *         content: { application/json: { schema: { $ref: '#/components/schemas/PublicProductsResponse' } } }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       404: { $ref: '#/components/responses/NotFound' }
 * /api/public/businesses/{businessId}/orders:
 *   post:
 *     summary: Place an order from the customer storefront
 *     tags: [Public]
 *     parameters:
 *       - in: path
 *         name: businessId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/PublicOrderCreateInput' }
 *     responses:
 *       201:
 *         description: Order placed successfully
 *         content: { application/json: { schema: { $ref: '#/components/schemas/OrderResponse' } } }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
