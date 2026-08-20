-- Nota: "service_items" ya existe en la base (quedó fuera de la migración
-- inicial por error), así que acá solo agregamos la columna nueva.
ALTER TABLE "services" ADD COLUMN "for_people" integer;