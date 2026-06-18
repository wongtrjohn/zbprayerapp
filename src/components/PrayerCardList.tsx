import PrayerCard from "./PrayerCard";
import type { PrayerRequest } from "@/types";

interface PrayerCardListProps {
  prayers: PrayerRequest[];
  compact?: boolean;
  emptyMessage?: string;
}

export default function PrayerCardList({
  prayers,
  compact = false,
  emptyMessage = "No prayer requests found.",
}: PrayerCardListProps) {
  if (prayers.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 p-12 text-center text-slate-500 dark:border-slate-600 dark:text-slate-400">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {prayers.map((prayer) => (
        <PrayerCard key={prayer.id} prayer={prayer} compact={compact} />
      ))}
    </div>
  );
}
