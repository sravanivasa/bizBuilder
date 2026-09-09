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
 *     summary: List orders for one verified business with search, filters, and pagination
 *     description: |
 *       Returns orders scoped to a single owned business (first business by default, or businessId when provided).
 *       Sensitive fields (trackingToken, deliveryToken, deliveryOtp, razorpayOrderId, razorpayPaymentId) are excluded.
 *       Order date filters use Asia/Kolkata calendar boundaries on createdAt.
 *     tags: [Orders]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: businessId
 *         schema: { type: string }
 *         description: Optional owned business ID
 *       - in: query
 *         name: search
 *         schema: { type: string, maxLength: 100 }
 *       - in: query
 *         name: orderStatus
 *         schema: { type: string }
 *       - in: query
 *         name: paymentStatus
 *         schema: { type: string, enum: [Pending, AwaitingPayment, PaymentSubmitted, Paid, Failed, COD] }
 *       - in: query
 *         name: paymentMethod
 *         schema: { type: string, enum: [Cash, COD, GPay, PhonePe, NetBanking, UPI, Card] }
 *       - in: query
 *         name: dateFrom
 *         schema: { type: string, format: date, example: "2026-09-01" }
 *       - in: query
 *         name: dateTo
 *         schema: { type: string, format: date, example: "2026-09-30" }
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 100, default: 12 }
 *       - in: query
 *         name: sort
 *         schema: { type: string, enum: [createdAt, totalAmount, orderStatus, paymentStatus] }
 *       - in: query
 *         name: sortDir
 *         schema: { type: string, enum: [asc, desc] }
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
 * /api/orders/{id}/invoice:
 *   get:
 *     summary: Get a printable invoice for an order (business owner)
 *     tags: [Orders]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ $ref: '#/components/parameters/OrderId' }]
 *     responses:
 *       200:
 *         description: Invoice fetched successfully
 *         content: { application/json: { schema: { $ref: '#/components/schemas/InvoiceResponse' } } }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 * /api/orders/{id}/return:
 *   put:
 *     summary: Approve or reject a customer return request
 *     tags: [Orders]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ $ref: '#/components/parameters/OrderId' }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/OrderReturnStatusUpdateInput' }
 *     responses:
 *       200:
 *         description: Return status updated successfully
 *         content: { application/json: { schema: { $ref: '#/components/schemas/OrderResponse' } } }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 * /api/orders/{id}/payment:
 *   put:
 *     summary: Update an order payment status (owner)
 *     description: >
 *       Owner-only payment status transitions. Paid is terminal and cannot be downgraded.
 *       Legitimate paths include manual verification (AwaitingPayment or PaymentSubmitted to Paid)
 *       and offline Cash/Card orders (Pending to Paid). Invalid transitions return 400.
 *     tags: [Orders]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ $ref: '#/components/parameters/OrderId' }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/OrderPaymentStatusUpdateInput' }
 *     responses:
 *       200:
 *         description: Payment status updated successfully
 *         content: { application/json: { schema: { $ref: '#/components/schemas/OrderResponse' } } }
 *       400:
 *         description: Invalid payment status or disallowed transition
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
