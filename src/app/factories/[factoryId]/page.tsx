import { FactoryView } from "./factoryView"

export default async function Page({
  params,
}: {
  params: Promise<{ factoryId: string }>
}) {
  const { factoryId } = await params
  return <FactoryView factoryId={factoryId} />
}