import {
  HeadContent,
  Link,
  Scripts,
  createRootRoute,
} from '@tanstack/react-router'
import {
  CalendarClock,
  ChefHat,
  LayoutDashboard,
  Menu,
  ReceiptText,
  Croissant,
  UtensilsCrossed,
  BarChart3,
  X,
} from 'lucide-react'
import { useState } from 'react'

import '../styles.css'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'Panadería La Espiga - Gestión',
      },
    ],
  }),
  shellComponent: RootDocument,
})

const navItems = [
  { to: '/', label: 'Panel', icon: LayoutDashboard },
  { to: '/productos', label: 'Productos y precios', icon: Croissant },
  { to: '/ventas', label: 'Ventas', icon: ReceiptText },
  { to: '/servicios', label: 'Servicios', icon: ChefHat },
  { to: '/agregar-lunch', label: 'Agregar lunch', icon: UtensilsCrossed },
  { to: '/agenda', label: 'Agenda', icon: CalendarClock },
  { to: '/estadisticas', label: 'Estadísticas', icon: BarChart3 },
] as const

function RootDocument({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <html lang="es">
      <head>
        <HeadContent />
      </head>
      <body>
        <div className="min-h-screen bg-amber-50">
          <header className="bg-amber-900 text-amber-50 shadow-md sticky top-0 z-30">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setMenuOpen(true)}
                    aria-label="Abrir menú"
                    className="p-2 -ml-2 rounded-lg hover:bg-amber-800 transition-colors"
                  >
                    <Menu className="w-6 h-6" />
                  </button>
                  <Link
                    to="/"
                    className="flex items-center gap-2 font-bold text-lg tracking-tight"
                  >
                    <Croissant className="w-6 h-6" />
                    Panadería La Espiga
                  </Link>
                </div>
              </div>
            </div>
          </header>

          {menuOpen && (
            <div className="fixed inset-0 z-40 flex">
              <div
                className="absolute inset-0 bg-black/40"
                onClick={() => setMenuOpen(false)}
              />
              <div className="relative w-72 max-w-[80%] h-full bg-amber-900 text-amber-50 shadow-xl p-5 flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <span className="flex items-center gap-2 font-bold text-lg">
                    <Croissant className="w-5 h-5" />
                    Menú
                  </span>
                  <button
                    type="button"
                    onClick={() => setMenuOpen(false)}
                    aria-label="Cerrar menú"
                    className="p-1 rounded-lg hover:bg-amber-800 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <nav className="flex flex-col gap-1">
                  {navItems.map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      activeOptions={{ exact: item.to === '/' }}
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-amber-100 hover:bg-amber-800 transition-colors"
                      activeProps={{
                        className:
                          'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium bg-amber-950 text-white transition-colors',
                      }}
                    >
                      <item.icon className="w-4 h-4" />
                      {item.label}
                    </Link>
                  ))}
                </nav>
              </div>
            </div>
          )}

          <main>{children}</main>
        </div>
        <Scripts />
      </body>
    </html>
  )
}
