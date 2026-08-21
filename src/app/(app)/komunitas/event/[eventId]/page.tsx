import { EventDetail } from "@/components/app/EventDetail";

export default async function EventDetailPage({ params }: { readonly params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  return <EventDetail eventId={eventId} />;
}
