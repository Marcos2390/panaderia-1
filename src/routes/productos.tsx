import { createFileRoute } from '@tanstack/react-router'
import { useRouter } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useState } from 'react'
import { Pencil, Plus, Trash2, X } from 'lucide-react'
import {
  createProduct,
  deleteProduct,
  getProducts,
  toggleProductActive,
  updateProduct,
} from '../server/products.functions'

export const Route = createFileRoute('/productos')({
  loader: async () => ({ products: await getProducts() }),
  component: ProductsPage,
})

const CATEGORIES = ['pan', 'pasteleria', 'bebidas', 'reposteria', 'otros']

type ProductForm = {
  id?: number
  name: string
  category: string
  price: string
  unit: string
}

const emptyForm: ProductForm = {
  name: '',
  category: 'pan',
  price: '',
  unit: 'unidad',
}

function ProductsPage() {
  const { products } = Route.useLoaderData()
  const router = useRouter()
  const createFn = useServerFn(createProduct)
  const updateFn = useServerFn(updateProduct)
  const toggleFn = useServerFn(toggleProductActive)
  const deleteFn = useServerFn(deleteProduct)

  const [form, setForm] = useState<ProductForm>(emptyForm)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const openNew = () => {
    setForm(emptyForm)
    setShowForm(true)
  }

  const openEdit = (product: (typeof products)[number]) => {
    setForm({
      id: product.id,
      name: product.name,
      category: product.category,
      price: product.price,
      unit: product.unit,
    })
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const price = Number(form.price)
      if (form.id) {
        await updateFn({
          data: { id: form.id, name: form.name, category: form.category, price, unit: form.unit },
        })
      } else {
        await createFn({
          data: { name: form.name, category: form.category, price, unit: form.unit },
        })
      }
      setShowForm(false)
      setForm(emptyForm)
      await router.invalidate()
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggle = async (id: number, active: boolean) => {
    await toggleFn({ data: { id, active: !active } })
    await router.invalidate()
  }

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar este producto?')) return
    await deleteFn({ data: { id } })
    await router.invalidate()
  }

  const grouped = CATEGORIES.map((category) => ({
    category,
    items: products.filter((p) => p.category === category),
  })).filter((group) => group.items.length > 0)

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-amber-950">
            Productos y precios
          </h1>
          <p className="text-amber-700">
            Catálogo de pan, pastelería y bebidas con sus precios de venta.
          </p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 bg-amber-700 hover:bg-amber-800 text-white font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuevo producto
        </button>
      </div>

      {showForm && (
        <div className="bg-white border border-amber-200 rounded-xl shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-amber-950">
              {form.id ? 'Editar producto' : 'Nuevo producto'}
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
              Nombre
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="border border-amber-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="Ej. Pan francés"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm text-amber-900">
              Categoría
              <select
                value={form.category}
                onChange={(e) =>
                  setForm({ ...form, category: e.target.value })
                }
                className="border border-amber-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm text-amber-900">
              Precio
              <input
                required
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="border border-amber-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="0.00"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm text-amber-900">
              Unidad
              <input
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
                className="border border-amber-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="unidad, kg, docena..."
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

      {grouped.length === 0 ? (
        <p className="text-amber-600">
          Aún no hay productos registrados. Agrega el primero.
        </p>
      ) : (
        <div className="space-y-8">
          {grouped.map((group) => (
            <div key={group.category}>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-amber-700 mb-3">
                {group.category}
              </h3>
              <div className="bg-white rounded-xl shadow-sm border border-amber-100 divide-y divide-amber-100">
                {group.items.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-4"
                  >
                    <div>
                      <p
                        className={`font-medium ${product.active ? 'text-amber-950' : 'text-amber-400 line-through'}`}
                      >
                        {product.name}
                      </p>
                      <p className="text-sm text-amber-600">
                        ${Number(product.price).toFixed(2)} / {product.unit}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          handleToggle(product.id, product.active)
                        }
                        className="text-xs font-medium px-2.5 py-1 rounded-full border border-amber-300 text-amber-800 hover:bg-amber-50"
                      >
                        {product.active ? 'Desactivar' : 'Activar'}
                      </button>
                      <button
                        onClick={() => openEdit(product)}
                        aria-label="Editar"
                        className="p-2 rounded-lg hover:bg-amber-50 text-amber-700"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        aria-label="Eliminar"
                        className="p-2 rounded-lg hover:bg-red-50 text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
