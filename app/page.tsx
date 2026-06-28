import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      <h1 className="text-4xl font-bold mb-4">HookLoop</h1>
      <p className="text-lg text-gray-600 mb-8 text-center max-w-xl">
        Autonomous paid-ad experimentation agent for startups
      </p>
      <Link
        href="/setup"
        className="rounded-lg bg-black text-white px-6 py-3 text-sm font-medium hover:bg-gray-800 transition-colors"
      >
        Get Started
      </Link>
    </div>
  );
}
