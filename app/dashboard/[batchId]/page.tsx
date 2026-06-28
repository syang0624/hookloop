export default function DashboardPage({
  params,
}: {
  params: { batchId: string };
}) {
  return (
    <div className="min-h-screen p-8">
      <h1 className="text-2xl font-bold mb-4">
        Dashboard — Batch {params.batchId}
      </h1>
      <p className="text-gray-500">Dashboard components go here</p>
    </div>
  );
}
