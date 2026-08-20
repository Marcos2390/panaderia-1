import {
  pgTable,
  serial,
  text,
  timestamp,
  integer,
  numeric,
  boolean,
} from 'drizzle-orm/pg-core'

export const products = pgTable('products', {
  id: serial().primaryKey(),
  name: text().notNull(),
  category: text().notNull().default('pan'),
  price: numeric({ precision: 10, scale: 2 }).notNull(),
  unit: text().notNull().default('unidad'),
  active: boolean().notNull().default(true),
  createdAt: timestamp('created_at').defaultNow(),
})

export const services = pgTable('services', {
  id: serial().primaryKey(),
  name: text().notNull(),
  description: text().notNull().default(''),
  price: numeric({ precision: 10, scale: 2 }).notNull(),
  forPeople: integer('for_people'),
  active: boolean().notNull().default(true),
  createdAt: timestamp('created_at').defaultNow(),
})

export const serviceItems = pgTable('service_items', {
  id: serial().primaryKey(),
  serviceId: integer('service_id')
    .notNull()
    .references(() => services.id, { onDelete: 'cascade' }),
  productId: integer('product_id').references(() => products.id, {
    onDelete: 'set null',
  }),
  productName: text('product_name').notNull(),
  quantity: integer().notNull().default(1),
  unitPrice: numeric('unit_price', { precision: 10, scale: 2 }).notNull(),
  subtotal: numeric({ precision: 10, scale: 2 }).notNull(),
})

export const sales = pgTable('sales', {
  id: serial().primaryKey(),
  customerName: text('customer_name').notNull().default(''),
  total: numeric({ precision: 10, scale: 2 }).notNull(),
  paymentMethod: text('payment_method').notNull().default('efectivo'),
  notes: text().notNull().default(''),
  createdAt: timestamp('created_at').defaultNow(),
})

export const saleItems = pgTable('sale_items', {
  id: serial().primaryKey(),
  saleId: integer('sale_id')
    .notNull()
    .references(() => sales.id, { onDelete: 'cascade' }),
  productId: integer('product_id').references(() => products.id, {
    onDelete: 'set null',
  }),
  productName: text('product_name').notNull(),
  quantity: integer().notNull().default(1),
  unitPrice: numeric('unit_price', { precision: 10, scale: 2 }).notNull(),
  subtotal: numeric({ precision: 10, scale: 2 }).notNull(),
})

export const appointments = pgTable('appointments', {
  id: serial().primaryKey(),
  customerName: text('customer_name').notNull(),
  customerPhone: text('customer_phone').notNull().default(''),
  serviceId: integer('service_id').references(() => services.id, {
    onDelete: 'set null',
  }),
  serviceName: text('service_name').notNull().default(''),
  scheduledFor: timestamp('scheduled_for').notNull(),
  status: text().notNull().default('pendiente'),
  notes: text().notNull().default(''),
  createdAt: timestamp('created_at').defaultNow(),
})
