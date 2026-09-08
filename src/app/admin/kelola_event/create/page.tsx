import { requireCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
export default async function CreateEventPage(){const user=await requireCurrentUser();if(user.role!=="ADMIN"&&user.role!=="MODERATOR")redirect("/?auth_error=admin_required");redirect("/admin?view=events&create=1");}
