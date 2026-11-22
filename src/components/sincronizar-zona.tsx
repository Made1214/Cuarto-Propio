"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { COOKIE_ZONA, zonaValida } from "@/lib/fechas/zona";

/**
 * Le cuenta al servidor la zona horaria del dispositivo (cookie `zona`), para
 * que las fechas se muestren y se agrupen en la hora de la usuaria y no en
 * UTC. Si la que tenía el servidor era otra —primera visita, o un viaje—, se
 * refresca una vez para volver a pintar con la correcta.
 */
export function SincronizarZona({ actual }: { actual?: string }) {
  const router = useRouter();

  useEffect(() => {
    const zona = zonaValida(Intl.DateTimeFormat().resolvedOptions().timeZone);
    if (!zona || zona === actual) return;
    document.cookie = `${COOKIE_ZONA}=${encodeURIComponent(zona)}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
  }, [actual, router]);

  return null;
}
