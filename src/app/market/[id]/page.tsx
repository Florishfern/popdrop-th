import { redirect } from "next/navigation";

export default async function MarketItemRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolved = await params;
  redirect(`/product/${resolved.id}`);
}
