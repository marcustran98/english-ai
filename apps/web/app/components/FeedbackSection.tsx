import type { FeedbackItem } from "@/app/lib/types";

function Item({ item }: { item: FeedbackItem }) {
  return (
    <li className="rounded-control border border-border bg-card p-3">
      <div className="flex flex-col gap-1.5">
        <div className="font-semibold text-foreground">{item.issue}</div>
        {item.original_snippet ? (
          <div className="text-[13px] text-muted">
            Original: <span className="font-mono text-foreground/90">{item.original_snippet}</span>
          </div>
        ) : null}
        <div className="text-sm text-foreground">{item.explanation_simple}</div>
        <div className="text-sm text-foreground">
          <span className="font-semibold">Try:</span> <span className="font-mono text-foreground/90">{item.suggestion}</span>
        </div>
      </div>
    </li>
  );
}

export function FeedbackSection({
  title,
  items,
  emptyText,
}: {
  title: string;
  items: FeedbackItem[];
  emptyText: string;
}) {
  return (
    <section className="rounded-card border border-border bg-card">
      <div className="px-4 pb-0 pt-4">
        <h2 className="m-0 font-sans text-base font-semibold text-foreground">{title}</h2>
      </div>
      <div className="p-4">
        {items.length === 0 ? (
          <p className="text-sm text-muted">{emptyText}</p>
        ) : (
          <ul className="flex list-none flex-col gap-2.5 p-0">
            {items.map((it, idx) => (
              <Item key={`${idx}-${it.issue}`} item={it} />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
