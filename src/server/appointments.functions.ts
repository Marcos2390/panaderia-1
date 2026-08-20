import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { eq, asc } from 'drizzle-orm'
import { db } from '../../db/index.js'
import { appointments } from '../../db/schema.js'

export const getAppointments = createServerFn().handler(async () => {
  return db
    .select()
    .from(appointments)
    .orderBy(asc(appointments.scheduledFor))
})

const AppointmentSchema = z.object({
  customerName: z.string().min(1),
  customerPhone: z.string().default(''),
  serviceId: z.number().nullable().optional(),
  serviceName: z.string().default(''),
  scheduledFor: z.string().min(1),
  notes: z.string().default(''),
})

export const createAppointment = createServerFn({ method: 'POST' })
  .inputValidator(AppointmentSchema)
  .handler(async ({ data }) => {
    const [appointment] = await db
      .insert(appointments)
      .values({
        ...data,
        serviceId: data.serviceId ?? null,
        scheduledFor: new Date(data.scheduledFor),
      })
      .returning()
    return appointment
  })

export const updateAppointmentStatus = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ id: z.number(), status: z.string() }))
  .handler(async ({ data }) => {
    const [appointment] = await db
      .update(appointments)
      .set({ status: data.status })
      .where(eq(appointments.id, data.id))
      .returning()
    return appointment
  })

export const deleteAppointment = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ id: z.number() }))
  .handler(async ({ data }) => {
    await db.delete(appointments).where(eq(appointments.id, data.id))
    return { success: true }
  })
