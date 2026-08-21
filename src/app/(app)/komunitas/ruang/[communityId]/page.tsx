import { CommunityDetail } from "@/components/app/CommunityDetail";

export default async function CommunityPage({ params }: { readonly params: Promise<{ communityId: string }> }) {
  const { communityId } = await params;
  return <CommunityDetail communityId={communityId} />;
}
