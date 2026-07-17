import { getSupabaseBrowser } from "lib/supabase/browser";

export async function requestMagicLink(email: string) {
  const supabase = getSupabaseBrowser();
  const { error } = await supabase.auth.signInWithOtp({
    email: email.trim().toLowerCase(),
  });

  if (error) throw error;

  return { success: true };
}

export async function logoutCustomer() {
  const supabase = getSupabaseBrowser();
  const { error } = await supabase.auth.signOut();

  if (error) throw error;

  return { success: true };
}
