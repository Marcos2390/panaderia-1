import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useState } from 'react'
import { Pencil, Plus, Trash2, Users, X } from 'lucide-react'
import { getProducts } from '../server/products.functions'
import {
  createService,
  deleteService,
  getServices,
  updateService,
} from '../server/services.functions'

export const Route = createFileRoute('/agregar-lunch')({
  loader: async () => {
    const [products, services] = await Promise.all([
      getProducts(),
      getServices(),
    ])
    return { products, services }
  },
  component: AddLunchPage,
})

type CartLine = {
  productId: number | null
  productName: string
  quantity: number
  unitPrice: number
}

function formatMoney(value: string | number) {
  return `$${Number(value).toFixed(2)}`
}

function AddLunchPage() {
  const { products, services } = Route.useLoaderData()
  const router = useRouter()
  const createFn = useServerFn(createService)
  const updateFn = useServerFn(updateService)
  const deleteFn = useServerFn(deleteService)

  const activeProducts = products.filter((p) => p.active)

  const [editingId, setEditingId] = useState<number | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [forPeople, setForPeople] = useState('')
  const [cart, setCart] = useState<CartLine[]>([])
  const [selectedProductId, setSelectedProductId] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const addToCart = () => {
    const product = activeProducts.find(
      (p) => p.id === Number(selectedProductId),
    )
    if (!product) return
    setCart((prev) => {
      const existing = prev.find((line) => line.productId === product.id)
      if (existing) {
        return prev.map((line) =>
          line.productId === product.id
            ? { ...line, quantity: line.quantity + 1 }
            : line,
        )
      }
      return [
        ...prev,
        {
          productId: product.id,
          productName: product.name,
          quantity: 1,
          unitPrice: Number(product.price),
        },
      ]
    })
    setSelectedProductId('')
  }

  const updateQuantity = (index: number, quantity: number) => {
    if (quantity < 1) return
    setCart((prev) =>
      prev.map((line, i) => (i === index ? { ...line, quantity } : line)),
    )
  }

  const removeLine = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index))
  }

  const total = cart.reduce(
    (sum, line) => sum + line.quantity * line.unitPrice,
    0,
  )

  const resetForm = () => {
    setEditingId(null)
    setName('')
    setDescription('')
    setForPeople('')
    setCart([])
    setSelectedProductId('')
    setShowForm(false)
  }

  const startEdit = (service: (typeof services)[number]) => {
    setEditingId(service.id)
    setName(service.name)
    setDescription(service.description ?? '')
    setForPeople(service.forPeople ? String(service.forPeople) : '')
    setCart(
      service.items.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
      })),
    )
    setSelectedProductId('')
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (cart.length === 0) return
    setSubmitting(true)
    try {
      const forPeopleValue = forPeople ? Number(forPeople) : null
      if (editingId) {
        await updateFn({
          data: {
            id: editingId,
            name,
            description,
            forPeople: forPeopleValue,
            items: cart,
          },
        })
      } else {
        await createFn({
          data: {
            name,
            description,
            forPeople: forPeopleValue,
            items: cart,
          },
        })
      }
      resetForm()
      await router.invalidate()
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar este lunch?')) return
    await deleteFn({ data: { id } })
    if (editingId === id) resetForm()
    await router.invalidate()
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-amber-950">Agregar lunch</h1>
          <p className="text-amber-700">
            Armá un lunch estándar sumando productos y cantidades para una
            cantidad de personas. Después vas a poder elegirlo desde
            "Servicios" para armar el pedido rápido, o editarlo acá cuando
            haga falta ajustar productos o precios.
          </p>
        </div>
        {!showForm && (
          <button
            onClick={() => {
              resetForm()
              setShowForm(true)
            }}
            className="flex items-center gap-2 bg-amber-700 hover:bg-amber-800 text-white font-medium px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Nuevo lunch
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-white border border-amber-200 rounded-xl shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-amber-950">
              {editingId ? 'Editar lunch' : 'Nuevo lunch estándar'}
            </h2>
            <button type="button" onClick={resetForm} aria-label="Cerrar">
              <X className="w-5 h-5 text-amber-600" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">
            <label className="flex flex-col gap-1 text-sm text-amber-900">
              Nombre del lunch
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="border border-amber-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="Ej. Lunch para 10 personas"
              />
            </label>

            <label className="flex flex-col gap-1 text-sm text-amber-900 sm:max-w-xs">
              Cantidad de personas
              <input
                type="number"
                min="1"
                value={forPeople}
                onChange={(e) => setForPeople(e.target.value)}
                className="border border-amber-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="Ej. 10 (opcional)"
              />
            </label>

            <label className="flex flex-col gap-1 text-sm text-amber-900">
              Descripción
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="border border-amber-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
                rows={2}
                placeholder="Detalles del lunch (opcional)"
              />
            </label>

            <div>
              <p className="text-sm text-amber-900 mb-1">
                Productos incluidos
              </p>
              <div className="flex gap-2 mb-3">
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="flex-1 border border-amber-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="">Selecciona un producto...</option>
                  {activeProducts.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} — {formatMoney(product.price)}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={addToCart}
                  disabled={!selectedProductId}
                  className="flex items-center gap-1 bg-amber-700 hover:bg-amber-800 disabled:opacity-50 text-white font-medium px-3 py-2 rounded-lg"
                >
                  <Plus className="w-4 h-4" />
                  Agregar
                </button>
              </div>

              {cart.length > 0 ? (
                <div className="divide-y divide-amber-100 border border-amber-100 rounded-lg">
                  {cart.map((line, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 gap-2"
                    >
                      <span className="flex-1 text-sm text-amber-950">
                        {line.productName}
                      </span>
                      <input
                        type="number"
                        min="1"
                        value={line.quantity}
                        onChange={(e) =>
                          updateQuantity(index, Number(e.target.value) || 1)
                        }
                        className="w-16 border border-amber-300 rounded-lg px-2 py-1 text-sm"
                      />
                      <span className="text-sm font-medium text-amber-800 w-20 text-right">
                        {formatMoney(line.quantity * line.unitPrice)}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeLine(index)}
                        aria-label="Quitar"
                        className="p-1 rounded hover:bg-red-50 text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-amber-500 italic">
                  Todavía no agregaste ningún producto.
                </p>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-amber-100 pt-4">
              <span className="text-lg font-bold text-amber-950">
                Total: {formatMoney(total)}
              </span>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 rounded-lg text-amber-800 hover:bg-amber-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={cart.length === 0 || !name || submitting}
                  className="px-4 py-2 rounded-lg bg-amber-700 hover:bg-amber-800 text-white font-medium disabled:opacity-50"
                >
                  {submitting
                    ? 'Guardando...'
                    : editingId
                      ? 'Guardar cambios'
                      : 'Guardar lunch'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {services.length === 0 ? (
        <p className="text-amber-600">Aún no hay lunch registrados.</p>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-amber-100 divide-y divide-amber-100">
          {services.map((service) => (
            <div key={service.id} className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-amber-950">
                    {service.name}
                  </p>
                  {service.forPeople ? (
                    <p className="flex items-center gap-1 text-sm text-amber-600">
                      <Users className="w-3.5 h-3.5" />
                      {service.forPeople} personas
                    </p>
                  ) : null}
                  {service.description && (
                    <p className="text-sm text-amber-600">
                      {service.description}
                    </p>
                  )}
                  <p className="text-sm font-semibold text-amber-800 mt-1">
                    Total: {formatMoney(service.price)}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => startEdit(service)}
                    aria-label="Editar"
                    className="p-2 rounded-lg hover:bg-amber-50 text-amber-700"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(service.id)}
                    aria-label="Eliminar"
                    className="p-2 rounded-lg hover:bg-red-50 text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {service.items.length > 0 && (
                <ul className="text-sm text-amber-700 list-disc list-inside mt-2">
                  {service.items.map((item) => (
                    <li key={item.id}>
                      {item.quantity} × {item.productName} —{' '}
                      {formatMoney(item.subtotal)}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
