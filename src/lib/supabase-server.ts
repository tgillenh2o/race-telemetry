import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export function createSupabaseServer() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: async () => {
          const store = await cookieStore;
          return store.getAll();
        },

        setAll: async (cookiesToSet) => {
          const store = await cookieStore;

          cookiesToSet.forEach(({ name, value, options }) => {
            store.set(name, value, options);
          });
        },
      },
    }
  );
}
