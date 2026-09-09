/**
 * @swagger
 * /api/dashboard/summary:
 *   get:
 *     summary: Get authoritative dashboard metrics for one owned business
 *     description: |
 *       Returns server-calculated dashboard totals scoped to a single verified business.
 *       When businessId is omitted, the owner's first business (by createdAt) is used —
 *       matching the current single-business Dashboard UI convention.
 *
 *       **Revenue (realized sales):** sum of order totalAmount where orderStatus is not Cancelled
 *       and paymentStatus is Paid (verified online/card) or COD (Cash/COD recognized at order creation).
 *       Excludes AwaitingPayment, PaymentSubmitted, Pending, and Failed.
 *       Return/refund-adjusted revenue is deferred until a complete refund workflow exists.
 *
 *       **Today's orders:** orders created today (Asia/Kolkata calendar) excluding Cancelled.
 *       **Pending orders:** orderStatus === Pending (lifecycle metric, not payment pending).
 *
 *       **Expenses:** active expenses (isActive true) by expenseDate on Asia/Kolkata calendar.
 *       **Profit:** realized revenue minus active expenses for the same period and business.
 *
 *       Order revenue dates use createdAt converted to IST day/month boundaries.
 *       Expense dates use expenseDate YYYY-MM-DD string comparison.
 *     tags: [Dashboard]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: businessId
 *         required: false
 *         schema: { type: string }
 *         description: Owned business ID. When omitted, the first owned business is used.
 *     responses:
 *       200:
 *         description: Dashboard summary fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 summary:
 *                   type: object
 *                   properties:
 *                     todayRevenue: { type: number, example: 1500 }
 *                     monthRevenue: { type: number, example: 12500 }
 *                     todayOrders: { type: integer, example: 3 }
 *                     pendingOrders: { type: integer, example: 2 }
 *                     todayExpenses: { type: number, example: 500 }
 *                     monthExpenses: { type: number, example: 3200 }
 *                     todayProfit: { type: number, example: 1000 }
 *                     monthProfit: { type: number, example: 9300 }
 *                     businessName: { type: string, example: "My Shop" }
 *                     businessId: { type: string }
 *                     businessSlug: { type: string, nullable: true }
 *                     timezone: { type: string, example: "Asia/Kolkata" }
 *                     today: { type: string, format: date, example: "2026-09-08" }
 *                     monthStart: { type: string, format: date, example: "2026-09-01" }
 *                     monthEnd: { type: string, format: date, example: "2026-09-30" }
 *       400: { description: Validation failed }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden — businessId not owned by user }
 *       404: { description: No business found for owner }
 */
