import { AdminPortal } from "@/components/admin/AdminPortal";
import { redirect } from "next/navigation";
import { requireCurrentUser } from "@/lib/auth";

export default async function AdminPage() {
  const user = await requireCurrentUser();
  if (user.role !== "ADMIN" && user.role !== "MODERATOR") {
    redirect("/?auth_error=admin_required");
  }
  return (
    <AdminPortal
      serverSession={{
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role === "ADMIN" ? "Super Admin" : "Moderator",
        signedInAt: new Date().toISOString(),
      }}
    />
  );
}
