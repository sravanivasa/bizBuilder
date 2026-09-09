/**
 * @swagger
 * /api/expenses:
 *   post:
 *     summary: Create an expense
 *     tags: [Expenses]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [businessId, amount, category, expenseDate]
 *             properties:
 *               businessId: { type: string, example: "507f1f77bcf86cd799439011" }
 *               amount: { type: number, example: 1500.5 }
 *               category: { type: string, enum: [Rent, Utilities, Inventory, Transport, Marketing, Salaries, Misc] }
 *               expenseDate: { type: string, format: date, example: "2026-08-20", description: Business-calendar date YYYY-MM-DD (Asia/Kolkata) }
 *               description: { type: string, example: "Shop rent for August" }
 *     responses:
 *       201: { description: Expense created successfully }
 *       400: { description: Validation failed }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
 *   get:
 *     summary: List expenses for a business
 *     tags: [Expenses]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: businessId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 100 }
 *       - in: query
 *         name: search
 *         schema: { type: string, maxLength: 100 }
 *         description: Case-insensitive search in description
 *       - in: query
 *         name: category
 *         schema: { type: string, enum: [Rent, Utilities, Inventory, Transport, Marketing, Salaries, Misc] }
 *       - in: query
 *         name: from
 *         schema: { type: string, format: date, example: "2026-08-01" }
 *       - in: query
 *         name: to
 *         schema: { type: string, format: date, example: "2026-08-31" }
 *       - in: query
 *         name: active
 *         schema: { type: string, enum: [true, false, all], default: true }
 *     responses:
 *       200: { description: Expenses fetched successfully }
 *       400: { description: Validation failed }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
 * /api/expenses/summary:
 *   get:
 *     summary: Get today and month expense totals
 *     tags: [Expenses]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: businessId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Expense summary fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 summary:
 *                   type: object
 *                   properties:
 *                     todayTotal: { type: number, example: 500 }
 *                     monthTotal: { type: number, example: 12500 }
 *                     timezone: { type: string, example: Asia/Kolkata }
 *                     today: { type: string, example: "2026-08-20" }
 *                     monthStart: { type: string, example: "2026-08-01" }
 *                     monthEnd: { type: string, example: "2026-08-31" }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
 * /api/expenses/{id}:
 *   get:
 *     summary: Get an expense by ID
 *     tags: [Expenses]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Expense fetched successfully }
 *       400: { description: Invalid id }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
 *       404: { description: Expense not found }
 *   put:
 *     summary: Update an expense
 *     tags: [Expenses]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount: { type: number }
 *               category: { type: string, enum: [Rent, Utilities, Inventory, Transport, Marketing, Salaries, Misc] }
 *               expenseDate: { type: string, format: date }
 *               description: { type: string }
 *     responses:
 *       200: { description: Expense updated successfully }
 *       400: { description: Validation failed }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
 *       404: { description: Expense not found }
 *   delete:
 *     summary: Deactivate an expense (soft delete)
 *     tags: [Expenses]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Expense deactivated successfully }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
 *       404: { description: Expense not found }
 */
