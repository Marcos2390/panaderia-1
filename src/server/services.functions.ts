import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { db } from '../../db/index.js'
import { services, serviceItems } from '../../db/schema.js'

export const getServices = createServerFn().handler(async () => {
  const allServices = await db.select().from(services).orderBy(services.name)
  const allItems = await db.select().from(serviceItems)
  return allServices.map((service) => ({
    ...service,
    items: allItems.filter((item) => item.serviceId === service.id),
  }))
})

const ServiceItemInput = z.object({
  productId: z.number().nullable().optional(),
  productName: z.string().min(1),
  quantity: z.number().positive(),
  unitPrice: z.number().nonnegative(),
})

const ServiceSchema = z.object({
  name: z.string().min(1),
  description: z.string().default(''),
  forPeople: z.number().int().positive().nullable().optional(),
  items: z.array(ServiceItemInput).min(1),
})

export const createService = createServerFn({ method: 'POST' })
  .inputValidator(ServiceSchema)
  .handler(async ({ data }) => {
    const price = data.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0,
    )

    const [service] = await db
      .insert(services)
      .values({
        name: data.name,
        description: data.description,
        forPeople: data.forPeople ?? null,
        price: price.toFixed(2),
      })
      .returning()

    const items = await db
      .insert(serviceItems)
      .values(
        data.items.map((item) => ({
          serviceId: service.id,
          productId: item.productId ?? null,
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice.toFixed(2),
          subtotal: (item.quantity * item.unitPrice).toFixed(2),
        })),
      )
      .returning()

    return { ...service, items }
  })

export const updateService = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      id: z.number(),
      name: z.string().min(1),
      description: z.string().default(''),
      forPeople: z.number().int().positive().nullable().optional(),
      items: z.array(ServiceItemInput).min(1),
    }),
  )
  .handler(async ({ data }) => {
    const price = data.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0,
    )

    const [service] = await db
      .update(services)
      .set({
        name: data.name,
        description: data.description,
        forPeople: data.forPeople ?? null,
        price: price.toFixed(2),
      })
      .where(eq(services.id, data.id))
      .returning()

    // Reemplazamos toda la composición del servicio: se borran los
    // productos anteriores y se cargan los nuevos (los que quedaron,
    // los que se agregaron y con las cantidades editadas).
    await db.delete(serviceItems).where(eq(serviceItems.serviceId, data.id))

    const items = await db
      .insert(serviceItems)
      .values(
        data.items.map((item) => ({
          serviceId: data.id,
          productId: item.productId ?? null,
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice.toFixed(2),
          subtotal: (item.quantity * item.unitPrice).toFixed(2),
        })),
      )
      .returning()

    return { ...service, items }
  })

export const deleteService = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ id: z.number() }))
  .handler(async ({ data }) => {
    await db.delete(services).where(eq(services.id, data.id))
    return { success: true }
  })
