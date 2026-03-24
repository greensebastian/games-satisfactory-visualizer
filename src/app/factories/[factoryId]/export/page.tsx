import { Export } from "./export";

export default async function Page({
  params,
}: {
  params: Promise<{ factoryId: string }>;
}) {
  const { factoryId } = await params;
  return <Export factoryId={factoryId} />;
}
