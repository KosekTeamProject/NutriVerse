import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function signedMomentImages<T extends { imageUrl: string }>(moments: T[]) {
  if (moments.length === 0) return moments;
  const supabase = await createSupabaseServerClient();
  return Promise.all(moments.map(async (moment) => {
    if (moment.imageUrl.startsWith("http://") || moment.imageUrl.startsWith("https://")) return moment;
    const { data } = await supabase.storage.from("moments").createSignedUrl(moment.imageUrl, 10 * 60);
    return { ...moment, imageUrl: data?.signedUrl ?? "" };
  }));
}
