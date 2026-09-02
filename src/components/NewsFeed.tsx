import { NewsCard } from "./NewsCard";
import { NewsItem } from "@/lib/supabase-service";

export function NewsFeed({ items }: { items: NewsItem[] }) {
  if (items.length === 0) {
    return (
      <div className="text-center p-12 bg-zinc-900/50 rounded-2xl border border-dashed border-zinc-800">
        <p className="text-sm font-semibold text-zinc-400">No content found</p>
      </div>
    );
  }

  return (
    <div className="dashboard-grid">
      {items.map((item, idx) => (
        <NewsCard key={`${item.id}-${idx}`} item={item as any} />
      ))}
    </div>
  );
}
