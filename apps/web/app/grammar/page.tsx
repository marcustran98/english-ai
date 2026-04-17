import { getApiBaseUrl } from "@/app/lib/api";

async function fetchHealth() {
  const res = await fetch(`${getApiBaseUrl()}/v1/grammar/health`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return (await res.json()) as { status: string; module: string; message: string };
}

export default async function GrammarPage() {
  const data = await fetchHealth();
  return (
    <section className="card">
      <div className="cardHeader">
        <h1 className="sectionTitle">Grammar Training</h1>
        <p className="muted" style={{ marginTop: 6 }}>
          Coming soon.
        </p>
      </div>
      <div className="cardBody">
        <pre style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify(data, null, 2)}</pre>
      </div>
    </section>
  );
}

