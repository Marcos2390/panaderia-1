import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { eq, desc } from 'drizzle-orm'
import { db } from '../../db/index.js'
import { sales, saleItems } from '../../db/schema.js'

export const getSales = createServerFn().handler(async () => {
  const allSales = await db.select().from(sales).orderBy(desc(sales.createdAt))
  const allItems = await db.select().from(saleItems)
  return allSales.map((sale) => ({
    ...sale,
    items: allItems.filter((item) => item.saleId === sale.id),
  }))
})

const SaleItemInput = z.object({
  productId: z.number().nullable().optional(),
  productName: z.string().min(1),
  quantity: z.number().int().positive(),
  unitPrice: z.number().nonnegative(),
})

const SaleSchema = z.object({
  customerName: z.string().default(''),
  paymentMethod: z.string().default('efectivo'),
  notes: z.string().default(''),
  items: z.array(SaleItemInput).min(1),
})

export const createSale = createServerFn({ method: 'POST' })
  .inputValidator(SaleSchema)
  .handler(async ({ data }) => {
    const total = data.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0,
    )

    const [sale] = await db
      .insert(sales)
      .values({
        customerName: data.customerName,
        paymentMethod: data.paymentMethod,
        notes: data.notes,
        total: total.toFixed(2),
      })
      .returning()

    const items = await db
      .insert(saleItems)
      .values(
        data.items.map((item) => ({
          saleId: sale.id,
          productId: item.productId ?? null,
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice.toFixed(2),
          subtotal: (item.quantity * item.unitPrice).toFixed(2),
        })),
      )
      .returning()

    return { ...sale, items }
  })

export const deleteSale = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ id: z.number() }))
  .handler(async ({ data }) => {
    await db.delete(sales).where(eq(sales.id, data.id))
    return { success: true }
  })
