import { createFileRoute, Link } from '@tanstack/react-router'
import {
  CalendarClock,
  Croissant,
  DollarSign,
  ReceiptText,
} from 'lucide-react'
import { getProducts } from '../server/products.functions'
import { getSales } from '../server/sales.functions'
import { getAppointments } from '../server/appointments.functions'

export const Route = createFileRoute('/')({
  loader: async () => {
    const [products, sales, appointments] = await Promise.all([
      getProducts(),
      getSales(),
      getAppointments(),
    ])
    return { products, sales, appointments }
  },
  component: Home,
})

function formatMoney(value: string | number) {
  return `$${Number(value).toFixed(2)}`
}

function startOfToday() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

function Home() {
  const { products, sales, appointments } = Route.useLoaderData()

  const today = startOfToday()
  const todaysSales = sales.filter(
    (sale) => sale.createdAt && new Date(sale.createdAt) >= today,
  )
  const todaysTotal = todaysSales.reduce(
    (sum, sale) => sum + Number(sale.total),
    0,
  )
  const activeProducts = products.filter((product) => product.active)
  const upcoming = appointments
    .filter(
      (appt) =>
        new Date(appt.scheduledFor) >= new Date() &&
        appt.status !== 'cancelada',
    )
    .slice(0, 5)

  const stats = [
    {
      title: 'Ventas de hoy',
      value: formatMoney(todaysTotal),
      sub: `${todaysSales.length} venta(s)`,
      icon: DollarSign,
      color: 'bg-amber-600',
    },
    {
      title: 'Productos activos',
      value: String(activeProducts.length),
      sub: `${products.length} en catálogo`,
      icon: Croissant,
      color: 'bg-orange-600',
    },
    {
      title: 'Ventas registradas',
      value: String(sales.length),
      sub: 'histórico total',
      icon: ReceiptText,
      color: 'bg-yellow-700',
    },
    {
      title: 'Próximas citas',
      value: String(upcoming.length),
      sub: 'pendientes de atender',
      icon: CalendarClock,
      color: 'bg-red-700',
    },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-amber-950 mb-2">
        Panel de la panadería
      </h1>
      <p className="text-amber-800 mb-8">
        Resumen de precios, ventas, servicios y citas agendadas.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <div
            key={stat.title}
            className="bg-white rounded-xl shadow-sm p-6 flex items-center gap-4 border border-amber-100"
          >
            <div className={`${stat.color} p-3 rounded-lg`}>
              <stat.icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-amber-700">{stat.title}</p>
              <p className="text-2xl font-bold text-amber-950">
                {stat.value}
              </p>
              <p className="text-sm text-amber-600 font-medium">
                {stat.sub}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-amber-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-amber-950">
              Próximas citas
            </h2>
            <Link
              to="/agenda"
              className="text-sm font-medium text-amber-700 hover:underline"
            >
              Ver agenda
            </Link>
          </div>
          {upcoming.length === 0 ? (
            <p className="text-amber-600 text-sm">
              No hay citas próximas agendadas.
            </p>
          ) : (
            <ul className="divide-y divide-amber-100">
              {upcoming.map((appt) => (
                <li key={appt.id} className="py-3">
                  <p className="font-medium text-amber-950">
                    {appt.customerName}
                  </p>
                  <p className="text-sm text-amber-700">
                    {appt.serviceName || 'Sin servicio especificado'} ·{' '}
                    {new Date(appt.scheduledFor).toLocaleString('es-ES', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-amber-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-amber-950">
              Últimas ventas
            </h2>
            <Link
              to="/ventas"
              className="text-sm font-medium text-amber-700 hover:underline"
            >
              Ver ventas
            </Link>
          </div>
          {sales.length === 0 ? (
            <p className="text-amber-600 text-sm">
              Aún no se han registrado ventas.
            </p>
          ) : (
            <ul className="divide-y divide-amber-100">
              {sales.slice(0, 5).map((sale) => (
                <li
                  key={sale.id}
                  className="py-3 flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium text-amber-950">
                      {sale.customerName || 'Cliente ocasional'}
                    </p>
                    <p className="text-sm text-amber-700">
                      {sale.items.length} producto(s) ·{' '}
                      {sale.createdAt
                        ? new Date(sale.createdAt).toLocaleString('es-ES', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })
                        : ''}
                    </p>
                  </div>
                  <span className="font-semibold text-amber-900">
                    {formatMoney(sale.total)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
