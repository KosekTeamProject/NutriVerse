"use client";

import { useParams } from "next/navigation";
import { FriendProfile } from "@/components/app/FriendProfile";

export default function FriendProfilePage() {
  const params = useParams<{ userId: string }>();
  return <FriendProfile userId={params.userId} />;
}
