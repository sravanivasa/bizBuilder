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
 * /api/public/orders/invoice/{token}:
 *   get:
 *     summary: Get a printable invoice for an order using its tracking token
 *     tags: [Public]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema: { type: string }
 *         description: Secure tracking token from the order confirmation
 *     responses:
 *       200:
 *         description: Invoice fetched successfully
 *         content: { application/json: { schema: { $ref: '#/components/schemas/InvoiceResponse' } } }
 *       400: { $ref: '#/components/responses/ValidationError' }
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
 *         multipart/form-data:
 *           schema: { $ref: '#/components/schemas/ReturnRequestInput' }
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
 * /api/public/orders/pay/{token}:
 *   get:
 *     summary: Load payment page data for an online order
 *     tags: [Public]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Payment page loaded
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       404: { $ref: '#/components/responses/NotFound' }
 * /api/public/orders/pay/{token}/razorpay-order:
 *   post:
 *     summary: Create a Razorpay order for checkout
 *     tags: [Public]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Razorpay order created
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       404: { $ref: '#/components/responses/NotFound' }
 * /api/public/orders/pay/{token}/verify:
 *   post:
 *     summary: Verify Razorpay payment signature and confirm order
 *     tags: [Public]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [razorpay_order_id, razorpay_payment_id, razorpay_signature]
 *             properties:
 *               razorpay_order_id: { type: string }
 *               razorpay_payment_id: { type: string }
 *               razorpay_signature: { type: string }
 *     responses:
 *       200:
 *         description: Payment confirmed
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
