import { NextResponse } from "next/server";

/**
 * La versión del build que está sirviendo el servidor ahora. La PWA instalada
 * la consulta al volver a primer plano y, si no coincide con la suya, se
 * recarga (ver src/components/actualizar-app.tsx). Sin caché: tiene que
 * decir siempre la del último deploy.
 */
export function GET() {
  return NextResponse.json(
    { version: process.env.VERSION_APP },
    { headers: { "cache-control": "no-store" } },
  );
}
