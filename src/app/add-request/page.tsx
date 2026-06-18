import AddPrayerRequestForm from "@/components/AddPrayerRequestForm";

export default function AddRequestPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          Add Prayer Request
        </h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400">
          Share a prayer need and light a new candle in its bubble.
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800/50">
        <AddPrayerRequestForm />
      </div>
    </div>
  );
}
