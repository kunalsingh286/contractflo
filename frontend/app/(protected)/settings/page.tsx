export default function SettingsPage() {
  return (
    <div className="p-8">

      <h1 className="text-3xl font-bold text-white">
        Settings
      </h1>

      <p className="mt-2 text-zinc-400">
        Manage your account and application preferences.
      </p>

      <div className="mt-10 space-y-6">

        <div className="rounded-2xl bg-zinc-900 p-6">
          <h2 className="text-xl font-semibold text-white">
            Profile
          </h2>

          <p className="mt-2 text-zinc-400">
            Name: Deepakshi
          </p>

          <p className="text-zinc-400">
            Role: Admin
          </p>
        </div>

        <div className="rounded-2xl bg-zinc-900 p-6">
          <h2 className="text-xl font-semibold text-white">
            Notifications
          </h2>

          <label className="mt-4 flex items-center gap-3 text-white">
            <input type="checkbox" defaultChecked />
            Email Notifications
          </label>

          <label className="mt-3 flex items-center gap-3 text-white">
            <input type="checkbox" defaultChecked />
            AI Alerts
          </label>
        </div>

        <div className="rounded-2xl bg-zinc-900 p-6">
          <h2 className="text-xl font-semibold text-white">
            Security
          </h2>

          <button className="mt-4 rounded-xl bg-red-600 px-5 py-3 text-white hover:bg-red-700">
            Change Password
          </button>
        </div>

      </div>

    </div>
  );
}