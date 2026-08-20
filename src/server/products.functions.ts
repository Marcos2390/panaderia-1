import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { db } from '../../db/index.js'
import { products } from '../../db/schema.js'

export const getProducts = createServerFn().handler(async () => {
  return db.select().from(products).orderBy(products.category, products.name)
})

const ProductSchema = z.object({
  name: z.string().min(1),
  category: z.string().min(1),
  price: z.number().positive(),
  unit: z.string().min(1),
})

export const createProduct = createServerFn({ method: 'POST' })
  .inputValidator(ProductSchema)
  .handler(async ({ data }) => {
    const [product] = await db
      .insert(products)
      .values({ ...data, price: data.price.toFixed(2) })
      .returning()
    return product
  })

export const updateProduct = createServerFn({ method: 'POST' })
  .inputValidator(ProductSchema.extend({ id: z.number() }))
  .handler(async ({ data }) => {
    const { id, ...values } = data
    const [product] = await db
      .update(products)
      .set({ ...values, price: values.price.toFixed(2) })
      .where(eq(products.id, id))
      .returning()
    return product
  })

export const toggleProductActive = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ id: z.number(), active: z.boolean() }))
  .handler(async ({ data }) => {
    const [product] = await db
      .update(products)
      .set({ active: data.active })
      .where(eq(products.id, data.id))
      .returning()
    return product
  })

export const deleteProduct = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ id: z.number() }))
  .handler(async ({ data }) => {
    await db.delete(products).where(eq(products.id, data.id))
    return { success: true }
  })
