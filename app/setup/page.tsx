import ProductInputForm from "@/components/ProductInputForm";

export default function SetupPage() {
  return (
    <div className="min-h-screen p-8 md:p-16">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-2">Set up your experiment</h1>
        <p className="text-gray-500 mb-8">
          Tell us about your product and budget. HookLoop will generate ad
          variants, run a simulated campaign, and show you what works.
        </p>
        <ProductInputForm />
      </div>
    </div>
  );
}
