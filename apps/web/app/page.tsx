import Link from "next/link";

export default function Home() {
  return (
    <section className="card">
      <div className="cardHeader">
        <h1 className="sectionTitle">AI English MVP</h1>
        <p className="muted" style={{ marginTop: 6 }}>
          Pick a module to start learning.
        </p>
      </div>
      <div className="cardBody" style={{ display: "grid", gap: 10 }}>
        <Link className="btn" href="/speaking">
          Speaking Trainer
        </Link>
        <Link className="btn" href="/grammar">
          Grammar (coming soon)
        </Link>
        <Link className="btn" href="/flashcards">
          Flashcards (coming soon)
        </Link>
      </div>
    </section>
  );
}
