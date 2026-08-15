import { redirect } from "next/navigation";
import { CmsArticlePanel } from "@/components/admin/CmsArticlePanel";
import { requireCmsEditor } from "@/lib/auth";

export default async function CmsPage() {
  try { await requireCmsEditor(); } catch { redirect("/?auth_error=cms_required"); }
  return <main className="min-h-screen bg-background p-4 sm:p-8"><div className="mx-auto max-w-6xl"><CmsArticlePanel /></div></main>;
}
