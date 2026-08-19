export default function CopilotPage() {
  return (
    <div className="flex h-[calc(100vh-120px)] flex-col rounded-2xl border border-zinc-800 bg-zinc-900">

      {/* Header */}
      <div className="border-b border-zinc-800 p-6">
        <h1 className="text-3xl font-bold text-white">
          AI Copilot
        </h1>

        <p className="mt-2 text-zinc-400">
          Ask anything about your contracts
        </p>
      </div>

      {/* Chat Area */}
      <div className="flex-1 space-y-4 overflow-y-auto p-6">

        <div className="max-w-lg rounded-2xl bg-zinc-800 p-4 text-white">
          👋 Hello! I'm ContractFlo AI. How can I help you today?
        </div>

        <div className="ml-auto max-w-lg rounded-2xl bg-violet-600 p-4 text-white">
          Summarize my NDA agreement.
        </div>

        <div className="max-w-lg rounded-2xl bg-zinc-800 p-4 text-white">
          The NDA defines confidentiality obligations, duration, exclusions, and remedies for breach.
        </div>

      </div>

      {/* Input */}
      <div className="border-t border-zinc-800 p-4">
        <input
          placeholder="Ask AI anything..."
          className="w-full rounded-xl bg-zinc-800 p-4 text-white outline-none"
        />
      </div>

    </div>
  );
}