import { redirect } from "next/navigation";
import { requireCurrentUser } from "@/lib/auth";
import { AdminEventPanel } from "@/components/admin/AdminEventPanel";
export default async function CreateEventPage(){const user=await requireCurrentUser();if(user.role!=="ADMIN"&&user.role!=="MODERATOR")redirect("/?auth_error=admin_required");return <AdminEventPanel createOnly />;}
