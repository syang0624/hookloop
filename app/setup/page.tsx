import Link from "next/link";
import ProductInputForm from "@/components/ProductInputForm";

export default function SetupPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b px-6 py-3 shadow-sm">
        <Link href="/" className="text-lg font-black tracking-tight">
          Hook<span className="text-gray-400">Loop</span>
        </Link>
      </header>

      <div className="max-w-2xl mx-auto p-8 md:p-16">
        <h1 className="text-2xl font-bold mb-2">Set up your experiment</h1>
        <p className="text-gray-500 mb-8 text-sm">
          Tell us about your product and budget. HookLoop will generate ad
          variants, run a simulated campaign, and show you what works.
        </p>
        <ProductInputForm />
      </div>
    </div>
  );
}
