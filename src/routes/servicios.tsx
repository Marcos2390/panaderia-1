import { createFileRoute, useRouter, Link } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useState } from 'react'
import { ChevronRight, Plus, Trash2, Users, X } from 'lucide-react'
import { getProducts } from '../server/products.functions'
import { getServices } from '../server/services.functions'
import { createSale } from '../server/sales.functions'

export const Route = createFileRoute('/servicios')({
  loader: async () => {
    const [products, services] = await Promise.all([
      getProducts(),
      getServices(),
    ])
    return { products, services }
  },
  component: ServicesPage,
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

function ServicesPage() {
  const { products, services } = Route.useLoaderData()
  const router = useRouter()
  const createSaleFn = useServerFn(createSale)

  const activeProducts = products.filter((p) => p.active)

  // null = mostrando la lista de lunch; 'custom' = armando desde cero;
  // number = armando el pedido a partir del lunch con ese id.
  const [building, setBuilding] = useState<'custom' | number | null>(null)
  const [orderName, setOrderName] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('efectivo')
  const [cart, setCart] = useState<CartLine[]>([])
  const [selectedProductId, setSelectedProductId] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [confirmation, setConfirmation] = useState<string | null>(null)

  const startFromLunch = (service: (typeof services)[number]) => {
    setOrderName(service.name)
    setCustomerName('')
    setPaymentMethod('efectivo')
    setCart(
      service.items.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
      })),
    )
    setSelectedProductId('')
    setBuilding(service.id)
    setConfirmation(null)
  }

  const startCustom = () => {
    setOrderName('')
    setCustomerName('')
    setPaymentMethod('efectivo')
    setCart([])
    setSelectedProductId('')
    setBuilding('custom')
    setConfirmation(null)
  }

  const cancelBuilding = () => {
    setBuilding(null)
    setCart([])
  }

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

  const handleCreatePedido = async () => {
    if (cart.length === 0) return
    setSubmitting(true)
    try {
      const notes = orderName ? `Pedido: ${orderName}` : ''
      await createSaleFn({
        data: { customerName, paymentMethod, notes, items: cart },
      })
      setConfirmation(
        `Pedido "${orderName || 'personalizado'}" creado por ${formatMoney(total)}.`,
      )
      cancelBuilding()
      await router.invalidate()
    } finally {
      setSubmitting(false)
    }
  }

  // ---------- vista: armando el pedido ----------
  if (building !== null) {
    const availableProducts = activeProducts.filter(
      (p) => !cart.some((line) => line.productId === p.id),
    )

    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white border border-amber-200 rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-amber-950">
              {building === 'custom' ? 'Servicio personalizado' : 'Armar pedido'}
            </h2>
            <button type="button" onClick={cancelBuilding} aria-label="Cerrar">
              <X className="w-5 h-5 text-amber-600" />
            </button>
          </div>

          <label className="flex flex-col gap-1 text-sm text-amber-900 mb-3">
            Nombre del pedido
            <input
              value={orderName}
              onChange={(e) => setOrderName(e.target.value)}
              className="border border-amber-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
              placeholder="Ej. Lunch para 10 personas"
            />
          </label>

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

          <p className="text-sm text-amber-900 mb-1">
            Productos del pedido{' '}
            <span className="text-amber-500 font-normal">
              (sumá, quitá o cambiá cantidades)
            </span>
          </p>
          <div className="flex gap-2 mb-3">
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="flex-1 border border-amber-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="">Selecciona un producto...</option>
              {availableProducts.map((product) => (
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
            <div className="divide-y divide-amber-100 border border-amber-100 rounded-lg mb-4">
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
            <p className="text-sm text-amber-500 italic mb-4">
              Todavía no hay productos en este pedido.
            </p>
          )}

          <div className="flex items-center justify-between border-t border-amber-100 pt-4">
            <span className="text-lg font-bold text-amber-950">
              Total: {formatMoney(total)}
            </span>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={cancelBuilding}
                className="px-4 py-2 rounded-lg text-amber-800 hover:bg-amber-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleCreatePedido}
                disabled={cart.length === 0 || submitting}
                className="px-4 py-2 rounded-lg bg-amber-700 hover:bg-amber-800 text-white font-medium disabled:opacity-50"
              >
                {submitting ? 'Creando...' : 'Crear pedido'}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ---------- vista: lista de lunch para elegir ----------
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-amber-950">Servicios</h1>
        <p className="text-amber-700">
          Elegí un lunch estándar como base del pedido — vas a poder sumar o
          quitar productos y cantidades antes de confirmarlo — o armá un
          servicio personalizado desde cero.
        </p>
      </div>

      {confirmation && (
        <div className="mb-6 flex items-center justify-between gap-3 bg-green-50 border border-green-200 text-green-800 rounded-lg px-4 py-3 text-sm">
          <span>{confirmation}</span>
          <Link
            to="/ventas"
            className="font-medium underline whitespace-nowrap"
          >
            Ver en Ventas
          </Link>
        </div>
      )}

      <button
        onClick={startCustom}
        className="w-full mb-6 flex items-center justify-center gap-2 bg-amber-700 hover:bg-amber-800 text-white font-medium py-3 rounded-xl transition-colors"
      >
        <Plus className="w-4 h-4" />
        Servicio personalizado
      </button>

      {services.length === 0 ? (
        <p className="text-amber-600">
          Aún no hay lunch estándar.{' '}
          <Link to="/agregar-lunch" className="underline font-medium">
            Creá uno en "Agregar lunch"
          </Link>
          .
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {services.map((service) => (
            <div
              key={service.id}
              className="bg-white rounded-xl shadow-sm border border-amber-100 p-5 flex flex-col"
            >
              <div className="flex items-start justify-between">
                <p className="font-semibold text-amber-950">{service.name}</p>
                <p className="font-semibold text-amber-800">
                  {formatMoney(service.price)}
                </p>
              </div>
              {service.forPeople ? (
                <p className="flex items-center gap-1 text-sm text-amber-600 mt-0.5">
                  <Users className="w-3.5 h-3.5" />
                  {service.forPeople} personas
                </p>
              ) : null}
              {service.description && (
                <p className="text-sm text-amber-600 mt-1">
                  {service.description}
                </p>
              )}
              {service.items.length > 0 && (
                <p className="text-sm text-amber-700 mt-2">
                  {service.items
                    .map((item) => `${item.quantity} ${item.productName}`)
                    .join(' · ')}
                </p>
              )}
              <button
                onClick={() => startFromLunch(service)}
                className="mt-4 flex items-center justify-center gap-1.5 border-2 border-amber-700 text-amber-800 hover:bg-amber-50 font-medium py-2 rounded-lg transition-colors"
              >
                Usar este lunch
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
