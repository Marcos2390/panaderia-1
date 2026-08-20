import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useState } from 'react'
import { Plus, Trash2, X } from 'lucide-react'
import { getServices } from '../server/services.functions'
import {
  createAppointment,
  deleteAppointment,
  getAppointments,
  updateAppointmentStatus,
} from '../server/appointments.functions'

export const Route = createFileRoute('/agenda')({
  loader: async () => {
    const [services, appointments] = await Promise.all([
      getServices(),
      getAppointments(),
    ])
    return { services, appointments }
  },
  component: AgendaPage,
})

const STATUSES = ['pendiente', 'confirmada', 'completada', 'cancelada']

type AppointmentForm = {
  customerName: string
  customerPhone: string
  serviceId: string
  scheduledFor: string
  notes: string
}

const emptyForm: AppointmentForm = {
  customerName: '',
  customerPhone: '',
  serviceId: '',
  scheduledFor: '',
  notes: '',
}

const statusStyles: Record<string, string> = {
  pendiente: 'bg-amber-100 text-amber-800',
  confirmada: 'bg-blue-100 text-blue-800',
  completada: 'bg-green-100 text-green-800',
  cancelada: 'bg-red-100 text-red-800',
}

function AgendaPage() {
  const { services, appointments } = Route.useLoaderData()
  const router = useRouter()
  const createFn = useServerFn(createAppointment)
  const statusFn = useServerFn(updateAppointmentStatus)
  const deleteFn = useServerFn(deleteAppointment)

  const [form, setForm] = useState<AppointmentForm>(emptyForm)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const service = services.find((s) => s.id === Number(form.serviceId))
      await createFn({
        data: {
          customerName: form.customerName,
          customerPhone: form.customerPhone,
          serviceId: service ? service.id : null,
          serviceName: service ? service.name : '',
          scheduledFor: form.scheduledFor,
          notes: form.notes,
        },
      })
      setForm(emptyForm)
      setShowForm(false)
      await router.invalidate()
    } finally {
      setSubmitting(false)
    }
  }

  const handleStatusChange = async (id: number, status: string) => {
    await statusFn({ data: { id, status } })
    await router.invalidate()
  }

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar esta cita?')) return
    await deleteFn({ data: { id } })
    await router.invalidate()
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-amber-950">Agenda</h1>
          <p className="text-amber-700">
            Programa encargos y servicios para tus clientes.
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-amber-700 hover:bg-amber-800 text-white font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nueva cita
        </button>
      </div>

      {showForm && (
        <div className="bg-white border border-amber-200 rounded-xl shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-amber-950">
              Nueva cita
            </h2>
            <button onClick={() => setShowForm(false)} aria-label="Cerrar">
              <X className="w-5 h-5 text-amber-600" />
            </button>
          </div>
          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
            <label className="flex flex-col gap-1 text-sm text-amber-900">
              Cliente
              <input
                required
                value={form.customerName}
                onChange={(e) =>
                  setForm({ ...form, customerName: e.target.value })
                }
                className="border border-amber-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="Nombre del cliente"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm text-amber-900">
              Teléfono
              <input
                value={form.customerPhone}
                onChange={(e) =>
                  setForm({ ...form, customerPhone: e.target.value })
                }
                className="border border-amber-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="Opcional"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm text-amber-900">
              Servicio
              <select
                value={form.serviceId}
                onChange={(e) =>
                  setForm({ ...form, serviceId: e.target.value })
                }
                className="border border-amber-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="">Sin especificar</option>
                {services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm text-amber-900">
              Fecha y hora
              <input
                required
                type="datetime-local"
                value={form.scheduledFor}
                onChange={(e) =>
                  setForm({ ...form, scheduledFor: e.target.value })
                }
                className="border border-amber-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </label>
            <label className="sm:col-span-2 flex flex-col gap-1 text-sm text-amber-900">
              Notas
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={2}
                className="border border-amber-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="Detalles del encargo"
              />
            </label>
            <div className="sm:col-span-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 rounded-lg text-amber-800 hover:bg-amber-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 rounded-lg bg-amber-700 hover:bg-amber-800 text-white font-medium disabled:opacity-60"
              >
                {submitting ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </form>
        </div>
      )}

      {appointments.length === 0 ? (
        <p className="text-amber-600">No hay citas agendadas.</p>
      ) : (
        <div className="space-y-3">
          {appointments.map((appt) => (
            <div
              key={appt.id}
              className="bg-white rounded-xl shadow-sm border border-amber-100 p-4 flex items-center justify-between gap-4"
            >
              <div>
                <p className="font-medium text-amber-950">
                  {appt.customerName}{' '}
                  {appt.customerPhone && (
                    <span className="text-amber-500 font-normal">
                      · {appt.customerPhone}
                    </span>
                  )}
                </p>
                <p className="text-sm text-amber-700">
                  {appt.serviceName || 'Sin servicio especificado'} ·{' '}
                  {new Date(appt.scheduledFor).toLocaleString('es-ES', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </p>
                {appt.notes && (
                  <p className="text-sm text-amber-500">{appt.notes}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={appt.status}
                  onChange={(e) =>
                    handleStatusChange(appt.id, e.target.value)
                  }
                  className={`text-xs font-medium px-2.5 py-1.5 rounded-full border-none ${statusStyles[appt.status] ?? 'bg-gray-100 text-gray-800'}`}
                >
                  {STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => handleDelete(appt.id)}
                  aria-label="Eliminar cita"
                  className="p-2 rounded-lg hover:bg-red-50 text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
