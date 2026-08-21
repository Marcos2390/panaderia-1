import { createFileRoute } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { BarChart3 } from 'lucide-react'
import { getSales } from '../server/sales.functions'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

export const Route = createFileRoute('/estadisticas')({
  loader: async () => {
    const sales = await getSales()
    return { sales }
  },
  component: StatsPage,
})

function formatMoney(value: string | number) {
  return `$${Number(value).toFixed(2)}`
}

const MONTH_LABELS = [
  'Ene',
  'Feb',
  'Mar',
  'Abr',
  'May',
  'Jun',
  'Jul',
  'Ago',
  'Sep',
  'Oct',
  'Nov',
  'Dic',
]

function monthKey(date: string | Date) {
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function StatsPage() {
  const { sales } = Route.useLoaderData()

  const monthlyTotals = useMemo(() => {
    const map = new Map<string, number>()
    for (const sale of sales) {
      if (!sale.createdAt) continue
      const key = monthKey(sale.createdAt)
      map.set(key, (map.get(key) ?? 0) + Number(sale.total))
    }
    return Array.from(map.keys())
      .sort()
      .map((key) => {
        const [year, month] = key.split('-')
        return {
          key,
          label: `${MONTH_LABELS[Number(month) - 1]} ${year}`,
          total: map.get(key) ?? 0,
        }
      })
  }, [sales])

  const defaultMonth =
    monthlyTotals[monthlyTotals.length - 1]?.key ?? monthKey(new Date())
  const [selectedMonth, setSelectedMonth] = useState(defaultMonth)

  const topProducts = useMemo(() => {
    const map = new Map<string, { quantity: number; revenue: number }>()
    for (const sale of sales) {
      if (!sale.createdAt || monthKey(sale.createdAt) !== selectedMonth) {
        continue
      }
      for (const item of sale.items) {
        const current = map.get(item.productName) ?? {
          quantity: 0,
          revenue: 0,
        }
        current.quantity += item.quantity
        current.revenue += Number(item.subtotal)
        map.set(item.productName, current)
      }
    }
    return Array.from(map.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10)
  }, [sales, selectedMonth])

  const monthlyChartData = {
    labels: monthlyTotals.map((m) => m.label),
    datasets: [
      {
        label: 'Ventas ($)',
        data: monthlyTotals.map((m) => m.total),
        backgroundColor: '#b45309',
        borderRadius: 6,
      },
    ],
  }

  const topProductsChartData = {
    labels: topProducts.map((p) => p.name),
    datasets: [
      {
        label: 'Unidades vendidas',
        data: topProducts.map((p) => p.quantity),
        backgroundColor: '#c2410c',
        borderRadius: 6,
      },
    ],
  }

  const baseOptions = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false } },
      y: { beginAtZero: true, grid: { color: '#fde68a' }, ticks: { precision: 0 } },
    },
  }

  const topProductsOptions = {
    ...baseOptions,
    indexAxis: 'y' as const,
    scales: {
      x: { beginAtZero: true, grid: { color: '#fde68a' }, ticks: { precision: 0 } },
      y: { grid: { display: false } },
    },
  }

  const monthTotalSelected = monthlyTotals.find((m) => m.key === selectedMonth)

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-2 mb-2">
        <BarChart3 className="w-7 h-7 text-amber-800" />
        <h1 className="text-3xl font-bold text-amber-950">Estadísticas</h1>
      </div>
      <p className="text-amber-700 mb-8">
        Ventas mensuales y productos más vendidos por mes.
      </p>

      {sales.length === 0 ? (
        <p className="text-amber-600">
          Todavía no hay ventas registradas para mostrar estadísticas.
        </p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-amber-100 p-6">
            <h2 className="text-lg font-semibold text-amber-950 mb-4">
              Ventas por mes
            </h2>
            <Bar data={monthlyChartData} options={baseOptions} />
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-amber-100 p-6">
            <div className="flex items-center justify-between mb-1 gap-3 flex-wrap">
              <h2 className="text-lg font-semibold text-amber-950">
                Productos más vendidos
              </h2>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="border border-amber-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                {monthlyTotals.map((m) => (
                  <option key={m.key} value={m.key}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
            {monthTotalSelected && (
              <p className="text-sm text-amber-600 mb-4">
                Total del mes: {formatMoney(monthTotalSelected.total)}
              </p>
            )}
            {topProducts.length === 0 ? (
              <p className="text-amber-600 text-sm">
                No hay ventas registradas en este mes.
              </p>
            ) : (
              <Bar data={topProductsChartData} options={topProductsOptions} />
            )}
          </div>
        </div>
      )}
    </div>
  )
}
