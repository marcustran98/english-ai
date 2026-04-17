import type { FeedbackItem } from "@/app/lib/types";

function Item({ item }: { item: FeedbackItem }) {
  return (
    <li className="card" style={{ padding: 12 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ fontWeight: 650 }}>{item.issue}</div>
        {item.original_snippet ? (
          <div className="muted" style={{ fontSize: 13 }}>
            Original: <span style={{ fontFamily: "var(--font-geist-mono)" }}>{item.original_snippet}</span>
          </div>
        ) : null}
        <div style={{ fontSize: 14 }}>{item.explanation_simple}</div>
        <div style={{ fontSize: 14 }}>
          <span style={{ fontWeight: 650 }}>Try:</span>{" "}
          <span style={{ fontFamily: "var(--font-geist-mono)" }}>{item.suggestion}</span>
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
    <section className="card">
      <div className="cardHeader">
        <h2 className="sectionTitle">{title}</h2>
      </div>
      <div className="cardBody">
        {items.length === 0 ? (
          <p className="muted">{emptyText}</p>
        ) : (
          <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
            {items.map((it, idx) => (
              <Item key={`${idx}-${it.issue}`} item={it} />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

