import { DynamicReactFlowWrapper } from "./dynamicReactFlowWrapper";

export default async function Page({
  params,
}: {
  params: Promise<{ factoryId: string }>;
}) {
  const { factoryId } = await params;
  return <DynamicReactFlowWrapper factoryId={factoryId} />;
}
