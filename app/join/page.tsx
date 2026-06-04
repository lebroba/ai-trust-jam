"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { joinSession } from "@/lib/supabase/queries";
import { setMyName, setMyParticipantId } from "@/lib/session/identity";

export default function JoinPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const normalized = code.trim().toUpperCase();
    if (!displayName.trim()) {
      setError("Add a display name.");
      return;
    }
    setPending(true);
    setError("");
    try {
      const participant = await joinSession(normalized, displayName.trim());
      if (!participant) {
        setError("That session code does not exist.");
        setPending(false);
        return;
      }
      setMyParticipantId(normalized, participant.id);
      setMyName(normalized, displayName.trim());
      router.push(`/session/${normalized}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not join the session.");
      setPending(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-paper px-5 py-10 text-ink">
      <form onSubmit={handleSubmit} className="w-full max-w-xl rounded-md border-2 border-ink bg-white p-6 shadow-[8px_8px_0_#98c9a3]">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-rust">Participant entry</p>
        <h1 className="mt-2 font-display text-5xl font-black">Join session</h1>
        <div className="mt-6 grid gap-4">
          <div>
            <Label htmlFor="code">Session code</Label>
            <Input id="code" value={code} onChange={(event) => setCode(event.target.value)} placeholder="TRUST23" />
          </div>
          <div>
            <Label htmlFor="name">Display name</Label>
            <Input id="name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="Grace Hopper" />
          </div>
        </div>
        {error && <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm font-semibold text-red-800">{error}</p>}
        <Button className="mt-6 w-full" type="submit" disabled={pending}>
          {pending ? "Joining..." : "Join"} <ArrowRight className="h-4 w-4" />
        </Button>
      </form>
    </main>
  );
}
