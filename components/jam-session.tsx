"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  Download,
  Dices,
  Eye,
  Plus,
  Presentation,
  Star,
  Users,
  VoteIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { phaseLabel, phaseMinutes, PHASES } from "@/lib/session/phases";
import {
  addCard,
  generateTeams,
  joinSession,
  loadBundle,
  renameParticipant,
  saveConcept,
  setPhase,
  setVote,
  subscribeBundle,
} from "@/lib/supabase/queries";
import { myName, myParticipantId, setMyName, setMyParticipantId } from "@/lib/session/identity";
import type { AspectCard, Concept, Phase, SessionBundle, Team } from "@/lib/types";

type View = "dashboard" | "concepts" | "vote";

export function JamSession({ code, view = "dashboard" }: { code: string; view?: View }) {
  const [bundle, setBundle] = useState<SessionBundle | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [card, setCard] = useState("");
  const [participantId, setParticipantId] = useState<string | null>(null);

  const reload = useCallback(() => {
    return loadBundle(code)
      .then((next) => {
        setBundle(next);
        setError("");
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Could not load the session."))
      .finally(() => setLoaded(true));
  }, [code]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setName(myName(code));
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setParticipantId(myParticipantId(code));
    reload();
    return subscribeBundle(() => {
      reload();
    });
  }, [code, reload]);

  const joined = Boolean(participantId);
  const participant = bundle?.participants.find((item) => item.id === participantId);
  const myTeam = useMemo(() => {
    if (!bundle || !participantId) return null;
    const member = bundle.teamMembers.find((item) => item.participant_id === participantId);
    return bundle.teams.find((team) => team.id === member?.team_id) ?? null;
  }, [bundle, participantId]);

  if (error && !bundle) {
    return (
      <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-5 py-10">
        <p className="mb-5 text-sm font-semibold uppercase tracking-[0.22em] text-red-800">Something went wrong</p>
        <h1 className="font-display text-3xl font-black text-ink">{error}</h1>
        <Button asChild className="mt-8 w-fit">
          <Link href="/join">Back to join</Link>
        </Button>
      </main>
    );
  }

  if (!loaded) {
    return (
      <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-5 py-10">
        <p className="text-sm font-black uppercase tracking-[0.22em] text-rust">Loading session…</p>
      </main>
    );
  }

  if (!bundle) {
    return (
      <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-5 py-10">
        <p className="mb-5 text-sm font-semibold uppercase tracking-[0.22em] text-red-800">Session not found</p>
        <h1 className="font-display text-4xl font-black text-ink">No jam exists for {code.toUpperCase()}.</h1>
        <Button asChild className="mt-8 w-fit">
          <Link href="/join">Join another session</Link>
        </Button>
      </main>
    );
  }

  async function handleJoin(event: FormEvent) {
    event.preventDefault();
    if (!bundle || !name.trim()) return;
    const trimmed = name.trim();
    try {
      if (participantId) {
        await renameParticipant(participantId, trimmed);
      } else {
        const created = await joinSession(bundle.session.code, trimmed);
        if (!created) return;
        setMyParticipantId(code, created.id);
        setParticipantId(created.id);
      }
      setMyName(code, trimmed);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not join.");
    }
  }

  async function handleCard(event: FormEvent) {
    event.preventDefault();
    if (!bundle || !card.trim()) return;
    const content = card.trim();
    setCard("");
    try {
      await addCard(bundle.session.id, participantId, content);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add card.");
    }
  }

  return (
    <main className="min-h-screen bg-paper text-ink">
      <section className="border-b border-ink/10 bg-paper px-5 py-4">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <Link href="/" className="text-xs font-black uppercase tracking-[0.25em] text-rust">
              AI Trust Jam
            </Link>
            <h1 className="mt-1 font-display text-3xl font-black md:text-5xl">{bundle.session.topic}</h1>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <Metric label="Code" value={bundle.session.code} />
            <Metric label="Phase" value={phaseLabel(bundle.session.current_phase)} />
            <Metric label="People" value={String(bundle.participants.length)} />
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-5 py-5 lg:grid-cols-[280px_1fr]">
        <aside className="space-y-4">
          <Timer phase={bundle.session.current_phase} />
          <FacilitatorPanel bundle={bundle} reload={reload} />
          {!joined && (
            <form onSubmit={handleJoin} className="rounded-md border border-ink/15 bg-white p-4 shadow-sm">
              <Label htmlFor="display-name">Display name</Label>
              <Input
                id="display-name"
                className="mt-2"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Ada Lovelace"
              />
              <Button className="mt-3 w-full" type="submit">
                <Check className="h-4 w-4" /> Join
              </Button>
            </form>
          )}
          <nav className="grid gap-2">
            <Button asChild variant={view === "dashboard" ? "default" : "secondary"}>
              <Link href={`/session/${bundle.session.code}`}>Dashboard</Link>
            </Button>
            <Button asChild variant={view === "concepts" ? "default" : "secondary"}>
              <Link href={`/session/${bundle.session.code}/concepts`}>Concept gallery</Link>
            </Button>
            <Button asChild variant={view === "vote" ? "default" : "secondary"}>
              <Link href={`/session/${bundle.session.code}/vote`}>Voting board</Link>
            </Button>
          </nav>
        </aside>

        <div className="min-w-0">
          {view === "dashboard" && (
            <Dashboard
              bundle={bundle}
              participantId={participantId ?? ""}
              myTeam={myTeam}
              card={card}
              setCard={setCard}
              handleCard={handleCard}
              reload={reload}
            />
          )}
          {view === "concepts" && <ConceptGallery bundle={bundle} />}
          {view === "vote" && <VotingBoard bundle={bundle} participantId={participantId ?? ""} reload={reload} />}
        </div>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-ink/15 bg-white px-3 py-2">
      <div className="text-[10px] font-black uppercase tracking-[0.18em] text-ink/45">{label}</div>
      <div className="mt-1 truncate text-sm font-black md:text-base">{value}</div>
    </div>
  );
}

function Timer({ phase }: { phase: Phase }) {
  const minutes = phaseMinutes(phase);
  return (
    <div className="rounded-md border-2 border-ink bg-gold p-5 text-center shadow-[6px_6px_0_#1f2a24]">
      <div className="text-xs font-black uppercase tracking-[0.2em] text-ink/65">Timer</div>
      <div className="font-display text-6xl font-black tabular-nums">{minutes ? `${String(minutes).padStart(2, "0")}:00` : "--:--"}</div>
    </div>
  );
}

function FacilitatorPanel({ bundle, reload }: { bundle: SessionBundle; reload: () => Promise<void> }) {
  return (
    <div className="rounded-md border border-ink/15 bg-white p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-black uppercase tracking-[0.16em]">
        <Presentation className="h-4 w-4" /> Facilitator
      </div>
      <div className="grid gap-2">
        {PHASES.map((phase) => (
          <Button
            key={phase.id}
            size="sm"
            variant={bundle.session.current_phase === phase.id ? "default" : "secondary"}
            onClick={async () => {
              await setPhase(bundle.session.id, phase.id);
              await reload();
            }}
          >
            {phase.label}
          </Button>
        ))}
        <Button
          variant="secondary"
          size="sm"
          onClick={async () => {
            await generateTeams(bundle.session.id);
            await reload();
          }}
        >
          <Dices className="h-4 w-4" /> Generate teams
        </Button>
        <Button variant="secondary" size="sm" onClick={() => exportResults(bundle)}>
          <Download className="h-4 w-4" /> Export JSON
        </Button>
      </div>
    </div>
  );
}

function Dashboard({
  bundle,
  participantId,
  myTeam,
  card,
  setCard,
  handleCard,
  reload,
}: {
  bundle: SessionBundle;
  participantId: string;
  myTeam: Team | null;
  card: string;
  setCard: (value: string) => void;
  handleCard: (event: FormEvent) => void;
  reload: () => Promise<void>;
}) {
  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_420px]">
      <section className="rounded-md border border-ink/15 bg-white p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-rust">Phase workspace</p>
            <h2 className="mt-1 font-display text-3xl font-black">{phaseLabel(bundle.session.current_phase)}</h2>
          </div>
          <Button asChild variant="secondary">
            <Link href={`/session/${bundle.session.code}/concepts`}>
              <Eye className="h-4 w-4" /> Gallery
            </Link>
          </Button>
        </div>

        {bundle.session.current_phase === "aspects" && (
          <form onSubmit={handleCard} className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto]">
            <Input value={card} onChange={(event) => setCard(event.target.value)} placeholder="Transparency" />
            <Button type="submit">
              <Plus className="h-4 w-4" /> Add card
            </Button>
          </form>
        )}

        {bundle.session.current_phase !== "aspects" && (
          <TeamBoard bundle={bundle} participantId={participantId} myTeam={myTeam} reload={reload} />
        )}
      </section>
      <CardWall cards={bundle.cards} />
    </div>
  );
}

function CardWall({ cards }: { cards: AspectCard[] }) {
  return (
    <section className="rounded-md border border-ink/15 bg-mint p-5">
      <h2 className="font-display text-2xl font-black">Aspect cards</h2>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-2">
        {cards.map((card) => (
          <div key={card.id} className="min-h-24 rounded-md border-2 border-ink bg-paper p-3 font-bold shadow-[3px_3px_0_#1f2a24]">
            {card.content}
          </div>
        ))}
      </div>
      {!cards.length && <p className="mt-4 text-sm text-ink/65">Cards appear here as participants submit them.</p>}
    </section>
  );
}

function TeamBoard({
  bundle,
  participantId,
  myTeam,
  reload,
}: {
  bundle: SessionBundle;
  participantId: string;
  myTeam: Team | null;
  reload: () => Promise<void>;
}) {
  const team = myTeam ?? bundle.teams[0] ?? null;
  const concept = bundle.concepts.find((item) => item.team_id === team?.id);
  const [title, setTitle] = useState(concept?.title ?? "");
  const [description, setDescription] = useState(concept?.description ?? "");
  const [imageUrl, setImageUrl] = useState(concept?.image_url ?? "");

  useEffect(() => {
    // Keep the editor aligned when another tab updates this team's concept.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTitle(concept?.title ?? "");
    setDescription(concept?.description ?? "");
    setImageUrl(concept?.image_url ?? "");
  }, [concept?.title, concept?.description, concept?.image_url]);

  if (!team) {
    return (
      <div className="mt-6 rounded-md border border-dashed border-ink/25 p-6 text-sm text-ink/65">
        Teams have not been generated yet.
      </div>
    );
  }

  const assignedCards = cardsForTeam(bundle, team.id);

  return (
    <div className="mt-6 grid gap-5 lg:grid-cols-[280px_1fr]">
      <div>
        <div className="flex items-center gap-2 font-black">
          <Users className="h-4 w-4" /> {team.team_name}
        </div>
        <div className="mt-3 grid gap-2">
          {assignedCards.map((card) => (
            <div key={card.id} className="rounded-md bg-gold px-3 py-2 text-sm font-black">
              {card.content}
            </div>
          ))}
        </div>
      </div>
      <form
        className="grid gap-3"
        onSubmit={async (event) => {
          event.preventDefault();
          await saveConcept(bundle.session.id, team.id, title, description, imageUrl);
          await reload();
        }}
      >
        <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Concept name" />
        <Textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Concept description" />
        <Input value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} placeholder="Optional sketch/image URL" />
        <Button type="submit" disabled={!participantId || !title.trim() || !description.trim()}>
          Save concept <ArrowRight className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}

function ConceptGallery({ bundle }: { bundle: SessionBundle }) {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {bundle.concepts.map((concept) => (
        <ConceptCard key={concept.id} concept={concept} bundle={bundle} />
      ))}
      {!bundle.concepts.length && <EmptyState title="No concepts yet" text="Teams will appear here after they save concept drafts." />}
    </section>
  );
}

function VotingBoard({
  bundle,
  participantId,
  reload,
}: {
  bundle: SessionBundle;
  participantId: string;
  reload: () => Promise<void>;
}) {
  const myVotes = bundle.votes.filter((vote) => vote.participant_id === participantId);
  const spent = myVotes.reduce((sum, vote) => sum + vote.stars, 0);

  return (
    <section>
      <div className="mb-4 flex flex-col justify-between gap-3 rounded-md border border-ink/15 bg-white p-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-rust">Voting</p>
          <h2 className="font-display text-3xl font-black">{3 - spent} stars left</h2>
        </div>
        <Button asChild variant="secondary">
          <Link href={`/session/${bundle.session.code}/concepts`}>
            <VoteIcon className="h-4 w-4" /> View leaderboard
          </Link>
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {bundle.concepts.map((concept) => {
          const current = myVotes.find((vote) => vote.concept_id === concept.id)?.stars ?? 0;
          return (
            <div key={concept.id} className="rounded-md border border-ink/15 bg-white p-4">
              <ConceptCard concept={concept} bundle={bundle} compact />
              <div className="mt-4 grid grid-cols-4 gap-2">
                {[0, 1, 2, 3].map((stars) => {
                  const disabled = stars > current + (3 - spent);
                  return (
                    <Button
                      key={stars}
                      variant={current === stars ? "default" : "secondary"}
                      size="sm"
                      disabled={disabled || !participantId}
                      onClick={async () => {
                        await setVote(participantId, concept.id, stars);
                        await reload();
                      }}
                    >
                      {stars}
                    </Button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function ConceptCard({ concept, bundle, compact = false }: { concept: Concept; bundle: SessionBundle; compact?: boolean }) {
  const team = bundle.teams.find((item) => item.id === concept.team_id);
  const total = bundle.votes.filter((vote) => vote.concept_id === concept.id).reduce((sum, vote) => sum + vote.stars, 0);
  return (
    <article className={compact ? "" : "rounded-md border border-ink/15 bg-white p-4 shadow-sm"}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-rust">{team?.team_name ?? "Team"}</p>
          <h3 className="mt-1 font-display text-2xl font-black">{concept.title}</h3>
        </div>
        <div className="flex items-center gap-1 rounded-md bg-gold px-2 py-1 font-black">
          <Star className="h-4 w-4 fill-ink" /> {total}
        </div>
      </div>
      <p className="mt-3 text-sm leading-6 text-ink/75">{concept.description}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {cardsForTeam(bundle, concept.team_id).map((card) => (
          <span key={card.id} className="rounded-md bg-mint px-2 py-1 text-xs font-black">
            {card.content}
          </span>
        ))}
      </div>
    </article>
  );
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-md border border-dashed border-ink/25 bg-white p-8">
      <h2 className="font-display text-2xl font-black">{title}</h2>
      <p className="mt-2 text-ink/65">{text}</p>
    </div>
  );
}

function cardsForTeam(bundle: SessionBundle, teamId: string) {
  const ids = bundle.teamCards.filter((item) => item.team_id === teamId).map((item) => item.card_id);
  return bundle.cards.filter((card) => ids.includes(card.id));
}

function exportResults(bundle: SessionBundle) {
  const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${bundle.session.code}-results.json`;
  link.click();
  URL.revokeObjectURL(url);
}
