/** Espacio de Storage del plan gratuito de Supabase (1 GB). Si el proyecto
 * pasa a un plan pago o a Cloudflare R2, este es el número a cambiar. */
export const LIMITE_STORAGE_BYTES = 1024 ** 3;

/** Desde qué fracción del límite se avisa en toda la app, con tiempo para
 * decidir (CLAUDE.md → Escalabilidad: no esperar a que falle una subida). */
export const UMBRAL_AVISO_STORAGE = 0.8;
