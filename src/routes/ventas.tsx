import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { getProducts } from '../server/products.functions'
import { createSale, deleteSale, getSales } from '../server/sales.functions'

export const Route = createFileRoute('/ventas')({
  loader: async () => {
    const [products, sales] = await Promise.all([getProducts(), getSales()])
    return { products, sales }
  },
  component: SalesPage,
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

function SalesPage() {
  const { products, sales } = Route.useLoaderData()
  const router = useRouter()
  const createFn = useServerFn(createSale)
  const deleteFn = useServerFn(deleteSale)

  const activeProducts = products.filter((p) => p.active)
  const [customerName, setCustomerName] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('efectivo')
  const [notes, setNotes] = useState('')
  const [cart, setCart] = useState<CartLine[]>([])
  const [selectedProductId, setSelectedProductId] = useState('')
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
  }

  const updateQuantity = (index: number, quantity: number) => {
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

  const handleSubmit = async () => {
    if (cart.length === 0) return
    setSubmitting(true)
    try {
      await createFn({
        data: { customerName, paymentMethod, notes, items: cart },
      })
      setCustomerName('')
      setNotes('')
      setCart([])
      await router.invalidate()
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar esta venta?')) return
    await deleteFn({ data: { id } })
    await router.invalidate()
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-amber-950 mb-2">Ventas</h1>
      <p className="text-amber-700 mb-8">
        Registra una nueva venta y consulta el historial.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-amber-100 p-6">
          <h2 className="text-lg font-semibold text-amber-950 mb-4">
            Nueva venta
          </h2>

          <div className="flex gap-2 mb-4">
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
              onClick={addToCart}
              disabled={!selectedProductId}
              className="flex items-center gap-1 bg-amber-700 hover:bg-amber-800 disabled:opacity-50 text-white font-medium px-3 py-2 rounded-lg"
            >
              <Plus className="w-4 h-4" />
              Agregar
            </button>
          </div>

          {cart.length > 0 && (
            <div className="mb-4 divide-y divide-amber-100 border border-amber-100 rounded-lg">
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
                    onClick={() => removeLine(index)}
                    aria-label="Quitar"
                    className="p-1 rounded hover:bg-red-50 text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <label className="flex flex-col gap-1 text-sm text-amber-900">
              Cliente (opcional)
              <input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="border border-amber-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="Nombre del cliente"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm text-amber-900">
              Método de pago
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="border border-amber-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="efectivo">Efectivo</option>
                <option value="tarjeta">Tarjeta</option>
                <option value="transferencia">Transferencia</option>
              </select>
            </label>
          </div>

          <label className="flex flex-col gap-1 text-sm text-amber-900 mb-4">
            Notas
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="border border-amber-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
              placeholder="Opcional"
            />
          </label>

          <div className="flex items-center justify-between border-t border-amber-100 pt-4">
            <span className="text-lg font-bold text-amber-950">
              Total: {formatMoney(total)}
            </span>
            <button
              onClick={handleSubmit}
              disabled={cart.length === 0 || submitting}
              className="px-5 py-2 rounded-lg bg-amber-700 hover:bg-amber-800 text-white font-medium disabled:opacity-50"
            >
              {submitting ? 'Registrando...' : 'Registrar venta'}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-amber-100 p-6">
          <h2 className="text-lg font-semibold text-amber-950 mb-4">
            Historial de ventas
          </h2>
          {sales.length === 0 ? (
            <p className="text-amber-600 text-sm">No hay ventas aún.</p>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {sales.map((sale) => (
                <div
                  key={sale.id}
                  className="border border-amber-100 rounded-lg p-3"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-amber-950">
                      {sale.customerName || 'Cliente ocasional'}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-amber-800">
                        {formatMoney(sale.total)}
                      </span>
                      <button
                        onClick={() => handleDelete(sale.id)}
                        aria-label="Eliminar venta"
                        className="p-1 rounded hover:bg-red-50 text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-amber-600 mb-1">
                    {sale.createdAt
                      ? new Date(sale.createdAt).toLocaleString('es-ES', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })
                      : ''}{' '}
                    · {sale.paymentMethod}
                  </p>
                  <ul className="text-sm text-amber-700 list-disc list-inside">
                    {sale.items.map((item) => (
                      <li key={item.id}>
                        {item.quantity} × {item.productName}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
