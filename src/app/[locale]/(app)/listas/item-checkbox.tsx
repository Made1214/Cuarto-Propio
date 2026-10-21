"use client";

import { useTransition } from "react";
import { useRouter } from "@/i18n/navigation";
import { alternarItem } from "@/lib/listas/actions";

export function ItemCheckbox({ itemId, marcado }: { itemId: string; marcado: boolean }) {
  const router = useRouter();
  const [pendiente, startTransition] = useTransition();

  return (
    <input
      type="checkbox"
      defaultChecked={marcado}
      disabled={pendiente}
      onChange={(evento) => {
        const nuevoValor = evento.target.checked;
        startTransition(async () => {
          await alternarItem(itemId, nuevoValor);
          router.refresh();
        });
      }}
      className="h-5 w-5 shrink-0 cursor-pointer border-2 border-ink accent-secondary-purple"
    />
  );
}
