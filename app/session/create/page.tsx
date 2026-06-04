"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSession } from "@/lib/supabase/queries";

export default function CreateSessionPage() {
  const router = useRouter();
  const [topic, setTopic] = useState("AI Trust");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      const session = await createSession(topic.trim() || "AI Trust");
      router.push(`/session/${session.code}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the session.");
      setPending(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-paper px-5 py-10 text-ink">
      <form onSubmit={handleSubmit} className="w-full max-w-xl rounded-md border-2 border-ink bg-white p-6 shadow-[8px_8px_0_#d9bd47]">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-rust">Facilitator setup</p>
        <h1 className="mt-2 font-display text-5xl font-black">Create session</h1>
        <div className="mt-6">
          <Label htmlFor="topic">Topic</Label>
          <Input id="topic" className="mt-2" value={topic} onChange={(event) => setTopic(event.target.value)} />
        </div>
        {error && <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm font-semibold text-red-800">{error}</p>}
        <Button className="mt-6 w-full" type="submit" disabled={pending}>
          {pending ? "Creating..." : "Create session"} <ArrowRight className="h-4 w-4" />
        </Button>
      </form>
    </main>
  );
}
