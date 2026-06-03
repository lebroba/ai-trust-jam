import Link from "next/link";
import { ArrowRight, Sparkles, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="min-h-screen bg-paper text-ink">
      <section className="mx-auto grid min-h-screen max-w-7xl content-center gap-10 px-5 py-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.28em] text-rust">3-12-3 brainstorming</p>
          <h1 className="mt-4 max-w-4xl font-display text-6xl font-black leading-[0.9] md:text-8xl">
            AI Trust Jam
          </h1>
          <p className="mt-6 max-w-2xl text-xl leading-8 text-ink/72">
            Run asynchronous or live classroom jams with session codes, anonymous aspect cards, randomized teams,
            concept galleries, and three-star voting.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild>
              <Link href="/session/create">
                Create session <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/join">Join session</Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-4">
          <div className="rounded-md border-2 border-ink bg-gold p-5 shadow-[8px_8px_0_#1f2a24]">
            <Sparkles className="mb-5 h-8 w-8" />
            <h2 className="font-display text-3xl font-black">AI Trust</h2>
            <div className="mt-5 grid grid-cols-2 gap-3">
              {["Transparency", "Privacy", "Explainability", "Verification", "Bias", "Consent"].map((item) => (
                <div key={item} className="rounded-md border-2 border-ink bg-paper p-3 text-sm font-black">
                  {item}
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-md border border-ink/15 bg-white p-5">
            <div className="flex items-center gap-3">
              <UsersRound className="h-5 w-5 text-rust" />
              <div className="font-black">Built for 100-person workshops on phones and laptops.</div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
