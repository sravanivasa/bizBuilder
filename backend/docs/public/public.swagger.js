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
 * /api/public/orders/track/{token}:
 *   get:
 *     summary: Track an order by secure token (no phone required)
 *     tags: [Public]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema: { type: string }
 *         description: 64-character hex tracking token sent to the customer
 *     responses:
 *       200:
 *         description: Order tracked successfully
 *         content: { application/json: { schema: { $ref: '#/components/schemas/TrackedOrderResponse' } } }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       404: { $ref: '#/components/responses/NotFound' }
 * /api/public/orders/track:
 *   get:
 *     summary: Track an order by ID and phone (no store ID required)
 *     tags: [Public]
 *     parameters:
 *       - in: query
 *         name: orderId
 *         required: true
 *         schema: { type: string }
 *         description: Full order ID or last 6 characters
 *       - in: query
 *         name: phone
 *         required: true
 *         schema: { type: string }
 *         description: Customer phone used when placing the order
 *     responses:
 *       200:
 *         description: Order tracked successfully
 *         content: { application/json: { schema: { $ref: '#/components/schemas/TrackedOrderResponse' } } }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       404: { $ref: '#/components/responses/NotFound' }
 * /api/public/businesses/{businessId}/orders/track:
 *   get:
 *     summary: Track an order by ID and phone number
 *     tags: [Public]
 *     parameters:
 *       - in: path
 *         name: businessId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: orderId
 *         required: true
 *         schema: { type: string }
 *         description: Full order ID or last 6 characters
 *       - in: query
 *         name: phone
 *         required: true
 *         schema: { type: string }
 *         description: Customer phone used when placing the order
 *     responses:
 *       200:
 *         description: Order tracked successfully
 *         content: { application/json: { schema: { $ref: '#/components/schemas/TrackedOrderResponse' } } }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       403:
 *         description: Phone number does not match this order
 *       404: { $ref: '#/components/responses/NotFound' }
 * /api/public/businesses/{businessId}/orders/{orderId}/return-request:
 *   post:
 *     summary: Request a return for a delivered order
 *     tags: [Public]
 *     parameters:
 *       - in: path
 *         name: businessId
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema: { type: string }
 *         description: Full order ID or last 6 characters
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/ReturnRequestInput' }
 *     responses:
 *       200:
 *         description: Return request submitted successfully
 *         content: { application/json: { schema: { $ref: '#/components/schemas/TrackedOrderResponse' } } }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       403:
 *         description: Phone number does not match this order
 *       404: { $ref: '#/components/responses/NotFound' }
 */
