import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      {/* Logo */}
      <div className="mb-8">
        <h1 className="text-5xl font-black tracking-tight">
          Hook<span className="text-gray-400">Loop</span>
        </h1>
      </div>

      <p className="text-lg text-gray-500 mb-3 text-center max-w-lg leading-relaxed">
        The autonomous ad experimentation agent.
      </p>
      <p className="text-sm text-gray-400 mb-10 text-center max-w-md">
        Input your product. Get hypotheses, ad variants, simulated campaigns,
        and clear attribution — in one loop.
      </p>

      <Link
        href="/setup"
        className="rounded-lg bg-gray-900 text-white px-8 py-3 text-sm font-medium hover:bg-gray-700 transition-colors shadow-sm"
      >
        Start Experiment
      </Link>

      <div className="mt-16 flex gap-8 text-xs text-gray-400">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-700 mb-1">3</p>
          <p>AI Agents</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-700 mb-1">8</p>
          <p>Ad Variants</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-700 mb-1">3</p>
          <p>Day Simulation</p>
        </div>
      </div>
    </div>
  );
}
