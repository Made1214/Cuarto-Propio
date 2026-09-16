import { createClient } from "@/lib/supabase/server";
import { redirect } from "@/i18n/navigation";

export default async function RootPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  redirect({ href: user ? "/diario" : "/login", locale });
}
