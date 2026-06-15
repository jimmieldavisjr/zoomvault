import { RecordingDetail } from "@/components/admin/recording-detail";

export default async function AdminRecordingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <RecordingDetail id={id} />;
}
