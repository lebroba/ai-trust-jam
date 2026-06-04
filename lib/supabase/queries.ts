"use client";

import { getSupabaseClient } from "@/lib/supabase/client";
import type {
  AspectCard,
  Concept,
  JamSession,
  Participant,
  Phase,
  SessionBundle,
  Team,
  TeamCard,
  TeamMember,
  Vote,
} from "@/lib/types";

function client() {
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error(
      "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local, then restart the dev server.",
    );
  }
  return supabase;
}

// Random, unguessable join code. The code is the only thing standing between
// the public internet and a session, so it must not be derivable from the topic
// or brute-forceable: 8 chars from a 31-symbol unambiguous alphabet (no 0/O/1/I/L)
// is ~8.5e11 combinations. Uses crypto, not Math.random, so codes aren't predictable.
export function generateCode(length = 8) {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let code = "";
  for (let i = 0; i < length; i += 1) code += alphabet[bytes[i] % alphabet.length];
  return code;
}

export async function createSession(topic: string): Promise<JamSession> {
  const supabase = client();
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const code = generateCode();
    const { data, error } = await supabase
      .from("sessions")
      .insert({ code, topic, status: "active", current_phase: "aspects" })
      .select()
      .single();
    if (!error && data) return data as JamSession;
    // 23505 = unique_violation (code collision) -> retry with a new code.
    if (error && error.code !== "23505") throw error;
  }
  throw new Error("Could not generate a unique session code. Try again.");
}

export async function loadBundle(code: string): Promise<SessionBundle | null> {
  const supabase = client();
  const { data: session } = await supabase
    .from("sessions")
    .select("*")
    .eq("code", code.toUpperCase())
    .maybeSingle();
  if (!session) return null;
  const sessionId = (session as JamSession).id;

  const [participants, cards, teams, concepts] = await Promise.all([
    supabase.from("participants").select("*").eq("session_id", sessionId).order("joined_at"),
    supabase.from("cards").select("*").eq("session_id", sessionId).order("created_at"),
    supabase.from("teams").select("*").eq("session_id", sessionId),
    supabase.from("concepts").select("*").eq("session_id", sessionId).order("created_at"),
  ]);

  const teamIds = (teams.data ?? []).map((team) => (team as Team).id);
  const conceptIds = (concepts.data ?? []).map((concept) => (concept as Concept).id);

  const [teamMembers, teamCards, votes] = await Promise.all([
    teamIds.length
      ? supabase.from("team_members").select("*").in("team_id", teamIds)
      : Promise.resolve({ data: [] as TeamMember[] }),
    teamIds.length
      ? supabase.from("team_cards").select("*").in("team_id", teamIds)
      : Promise.resolve({ data: [] as TeamCard[] }),
    conceptIds.length
      ? supabase.from("votes").select("*").in("concept_id", conceptIds)
      : Promise.resolve({ data: [] as Vote[] }),
  ]);

  return {
    session: session as JamSession,
    participants: (participants.data ?? []) as Participant[],
    cards: (cards.data ?? []) as AspectCard[],
    teams: (teams.data ?? []) as Team[],
    teamMembers: (teamMembers.data ?? []) as TeamMember[],
    teamCards: (teamCards.data ?? []) as TeamCard[],
    concepts: (concepts.data ?? []) as Concept[],
    votes: (votes.data ?? []) as Vote[],
  };
}

// Listens to every change in the public schema and re-fires the callback.
// One workshop = one set of tables, so a schema-wide listener keeps every
// device's bundle fresh without per-table plumbing.
export function subscribeBundle(onChange: () => void) {
  const supabase = client();
  const channel = supabase
    .channel("ai-trust-jam")
    .on("postgres_changes", { event: "*", schema: "public" }, () => onChange())
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}

export async function joinSession(code: string, displayName: string): Promise<Participant | null> {
  const supabase = client();
  const { data: session } = await supabase
    .from("sessions")
    .select("id")
    .eq("code", code.toUpperCase())
    .maybeSingle();
  if (!session) return null;
  const { data, error } = await supabase
    .from("participants")
    .insert({ session_id: (session as { id: string }).id, display_name: displayName })
    .select()
    .single();
  if (error) throw error;
  return data as Participant;
}

export async function renameParticipant(participantId: string, displayName: string) {
  const supabase = client();
  const { error } = await supabase
    .from("participants")
    .update({ display_name: displayName })
    .eq("id", participantId);
  if (error) throw error;
}

export async function addCard(sessionId: string, participantId: string | null, content: string) {
  const supabase = client();
  const { error } = await supabase
    .from("cards")
    .insert({ session_id: sessionId, participant_id: participantId, content });
  if (error) throw error;
}

export async function setPhase(sessionId: string, phase: Phase) {
  const supabase = client();
  const { error } = await supabase
    .from("sessions")
    .update({ current_phase: phase, status: phase === "finished" ? "completed" : "active" })
    .eq("id", sessionId);
  if (error) throw error;
}

function shuffle<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5);
}

export async function generateTeams(sessionId: string) {
  const supabase = client();
  const [{ data: participantRows }, { data: cardRows }] = await Promise.all([
    supabase.from("participants").select("id").eq("session_id", sessionId),
    supabase.from("cards").select("id").eq("session_id", sessionId),
  ]);

  const participants = shuffle((participantRows ?? []) as Array<{ id: string }>);
  const cards = shuffle((cardRows ?? []) as Array<{ id: string }>);

  // Deleting teams cascades to team_members, team_cards, and concepts (FKs use ON DELETE CASCADE).
  await supabase.from("teams").delete().eq("session_id", sessionId);

  const teamCount = Math.max(1, Math.ceil(participants.length / 4));
  const { data: teamRows, error: teamError } = await supabase
    .from("teams")
    .insert(
      Array.from({ length: teamCount }, (_, index) => ({
        session_id: sessionId,
        team_name: `Team ${index + 1}`,
      })),
    )
    .select();
  if (teamError) throw teamError;
  const teams = (teamRows ?? []) as Team[];
  if (!teams.length) return;

  const members = participants.map((participant, index) => ({
    participant_id: participant.id,
    team_id: teams[index % teams.length].id,
  }));

  const teamCards = teams.flatMap((team, teamIndex) =>
    Array.from({ length: Math.min(3, cards.length) }, (_, cardIndex) => ({
      team_id: team.id,
      card_id: cards[(teamIndex * 3 + cardIndex) % cards.length]?.id,
    })).filter((item) => item.card_id),
  );

  await Promise.all([
    members.length ? supabase.from("team_members").insert(members) : Promise.resolve(),
    teamCards.length ? supabase.from("team_cards").insert(teamCards) : Promise.resolve(),
  ]);
}

export async function addTeamCard(teamId: string, cardId: string) {
  const supabase = client();
  const { error } = await supabase
    .from("team_cards")
    .upsert({ team_id: teamId, card_id: cardId }, { onConflict: "team_id,card_id" });
  if (error) throw error;
}

export async function removeTeamCard(teamId: string, cardId: string) {
  const supabase = client();
  const { error } = await supabase
    .from("team_cards")
    .delete()
    .eq("team_id", teamId)
    .eq("card_id", cardId);
  if (error) throw error;
}

export async function saveConcept(
  sessionId: string,
  teamId: string,
  title: string,
  description: string,
  imageUrl: string,
) {
  const supabase = client();
  const { error } = await supabase
    .from("concepts")
    .upsert(
      { session_id: sessionId, team_id: teamId, title, description, image_url: imageUrl || null },
      { onConflict: "team_id" },
    );
  if (error) throw error;
}

export async function setVote(participantId: string, conceptId: string, stars: number) {
  const supabase = client();
  if (stars > 0) {
    const { error } = await supabase
      .from("votes")
      .upsert(
        { participant_id: participantId, concept_id: conceptId, stars },
        { onConflict: "participant_id,concept_id" },
      );
    if (error) throw error;
    return;
  }
  const { error } = await supabase
    .from("votes")
    .delete()
    .eq("participant_id", participantId)
    .eq("concept_id", conceptId);
  if (error) throw error;
}
