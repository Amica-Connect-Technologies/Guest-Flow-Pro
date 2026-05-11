import ConciergeView from "@/components/ConciergeView";

export default async function HotelConcierge({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <ConciergeView hotelId={slug} />;
}
