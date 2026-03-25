import { DynamicExport } from "./dynamicExport";

export default async function Page({
  params,
}: {
  params: Promise<{ factoryId: string }>;
}) {
  const { factoryId } = await params;
  return <DynamicExport factoryId={factoryId} />;
}
