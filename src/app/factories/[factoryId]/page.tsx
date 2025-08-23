import { ReactFlowWrapper } from "./reactFlowWrapper"

export default async function Page({
  params,
}: {
  params: Promise<{ factoryId: string }>
}) {
  const { factoryId } = await params
  return <ReactFlowWrapper factoryId={factoryId} />
}