import { redirect } from "next/navigation";
import { CmsTaxonomyPanel } from "@/components/admin/CmsTaxonomyPanel";
import { requireCmsEditor } from "@/lib/auth";
export default async function CmsTaxonomyPage() { try { await requireCmsEditor(); } catch { redirect("/?auth_error=cms_required"); } return <main className="min-h-screen bg-background p-4 sm:p-8"><div className="mx-auto max-w-6xl"><CmsTaxonomyPanel /></div></main>; }
