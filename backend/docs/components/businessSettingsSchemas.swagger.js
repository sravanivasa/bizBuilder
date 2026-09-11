/**
 * @swagger
 * components:
 *   schemas:
 *     BusinessSettingsGst:
 *       type: object
 *       properties:
 *         enabled: { type: boolean, example: false }
 *         rate: { type: number, minimum: 0, maximum: 100, example: 18 }
 *     BusinessSettingsDelivery:
 *       type: object
 *       properties:
 *         preparationMinutes: { type: integer, minimum: 0, maximum: 1440, example: 30 }
 *         deliveryMinutes: { type: integer, minimum: 0, maximum: 10080, example: 60 }
 *     BusinessSettingsSchedule:
 *       type: object
 *       properties:
 *         timezone: { type: string, example: Asia/Kolkata, readOnly: true }
 *         workingDays:
 *           type: array
 *           items: { type: integer, minimum: 0, maximum: 6 }
 *           example: [1, 2, 3, 4, 5, 6]
 *         openTime: { type: string, example: "09:00" }
 *         closeTime: { type: string, example: "21:00" }
 *         holidays:
 *           type: array
 *           items: { type: string, format: date, example: "2026-01-26" }
 *     BusinessSettingsReturns:
 *       type: object
 *       properties:
 *         enabled: { type: boolean, example: true }
 *         windowDays: { type: integer, minimum: 0, maximum: 365, example: 30 }
 *     BusinessSettings:
 *       type: object
 *       properties:
 *         _id: { type: string }
 *         business: { type: string }
 *         gst: { $ref: '#/components/schemas/BusinessSettingsGst' }
 *         delivery: { $ref: '#/components/schemas/BusinessSettingsDelivery' }
 *         schedule: { $ref: '#/components/schemas/BusinessSettingsSchedule' }
 *         returns: { $ref: '#/components/schemas/BusinessSettingsReturns' }
 *         createdAt: { type: string, format: date-time }
 *         updatedAt: { type: string, format: date-time }
 *     BusinessSettingsUpdateInput:
 *       type: object
 *       properties:
 *         gst: { $ref: '#/components/schemas/BusinessSettingsGst' }
 *         delivery: { $ref: '#/components/schemas/BusinessSettingsDelivery' }
 *         schedule:
 *           type: object
 *           properties:
 *             workingDays:
 *               type: array
 *               items: { type: integer, minimum: 0, maximum: 6 }
 *             openTime: { type: string, example: "09:00" }
 *             closeTime: { type: string, example: "21:00" }
 *             holidays:
 *               type: array
 *               items: { type: string, format: date }
 *         returns: { $ref: '#/components/schemas/BusinessSettingsReturns' }
 *     BusinessSettingsResponse:
 *       type: object
 *       properties:
 *         success: { type: boolean, example: true }
 *         settings: { $ref: '#/components/schemas/BusinessSettings' }
 */
