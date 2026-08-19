export default function ActivityFeed() {
  const activities = [
    {
      title: "NDA Agreement Uploaded",
      time: "2 hours ago",
      color: "bg-blue-500",
    },
    {
      title: "Vendor Contract Approved",
      time: "Yesterday",
      color: "bg-green-500",
    },
    {
      title: "High Risk Clause Detected",
      time: "3 days ago",
      color: "bg-red-500",
    },
    {
      title: "Employment Contract Signed",
      time: "5 days ago",
      color: "bg-violet-500",
    },
  ];

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
      <h2 className="mb-6 text-xl font-semibold text-white">
        Recent Activity
      </h2>

      <div className="space-y-6">
        {activities.map((activity, index) => (
          <div key={index} className="flex items-center gap-4">
            <div className={`h-3 w-3 rounded-full ${activity.color}`} />

            <div>
              <p className="font-medium text-white">
                {activity.title}
              </p>

              <p className="text-sm text-zinc-400">
                {activity.time}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}