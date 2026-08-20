# Panadería La Espiga — Gestión

Aplicación de gestión para una panadería: registra y consulta precios de productos, ventas, servicios especiales
(tortas personalizadas, catering) y una agenda de citas/encargos.

## Funcionalidades

- **Panel**: resumen de ventas del día, productos activos y próximas citas.
- **Productos y precios**: catálogo agrupado por categoría (pan, pastelería, bebidas, repostería), con precio y
  unidad; permite crear, editar, activar/desactivar y eliminar productos.
- **Ventas**: registro de ventas armando un carrito de productos, con cliente, método de pago y notas; muestra el
  historial completo.
- **Servicios**: catálogo de servicios especiales (encargos, catering, tortas) con precio base y descripción.
- **Agenda**: programación de citas con cliente, teléfono, servicio, fecha/hora y estado (pendiente, confirmada,
  completada, cancelada).

## Tecnologías

- [TanStack Start](https://tanstack.com/start) (React 19 + TanStack Router) sobre Vite 7.
- Tailwind CSS 4 para estilos.
- [Netlify Database](https://docs.netlify.com/build/data-and-storage/netlify-db/) (Postgres administrado) con
  [Drizzle ORM](https://orm.drizzle.team/) para persistencia.
- Zod para validación de datos en los server functions.

## Desarrollo local

Instala dependencias y levanta el servidor de desarrollo con Netlify CLI para tener la base de datos emulada:

```bash
npm install
netlify dev
```

Cada cambio en `db/schema.ts` requiere generar una migración:

```bash
npx drizzle-kit generate --name <descripcion_del_cambio>
```

Las migraciones se aplican automáticamente al desplegar en Netlify.
