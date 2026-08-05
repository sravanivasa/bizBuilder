/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Create an order
 *     tags: [Orders]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/OrderCreateInput' }
 *     responses:
 *       201:
 *         description: Order placed successfully
 *         content: { application/json: { schema: { $ref: '#/components/schemas/OrderResponse' } } }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *   get:
 *     summary: Get all orders for the logged-in business owner
 *     tags: [Orders]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Orders fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: Orders fetched successfully }
 *                 orders:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Order' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { $ref: '#/components/responses/NotFound' }
 * /api/orders/{id}:
 *   get:
 *     summary: Get an order by ID
 *     tags: [Orders]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ $ref: '#/components/parameters/OrderId' }]
 *     responses:
 *       200:
 *         description: Order fetched successfully
 *         content: { application/json: { schema: { $ref: '#/components/schemas/OrderResponse' } } }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *   put:
 *     summary: Update an order status
 *     tags: [Orders]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ $ref: '#/components/parameters/OrderId' }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/OrderStatusUpdateInput' }
 *     responses:
 *       200:
 *         description: Order status updated successfully
 *         content: { application/json: { schema: { $ref: '#/components/schemas/OrderResponse' } } }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *   delete:
 *     summary: Delete an order
 *     tags: [Orders]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ $ref: '#/components/parameters/OrderId' }]
 *     responses:
 *       200:
 *         description: Order deleted successfully
 *         content: { application/json: { schema: { $ref: '#/components/schemas/SuccessMessageResponse' } } }
 *       400:
 *         description: The order is not Pending or Cancelled.
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
