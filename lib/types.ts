export type Phase = "aspects" | "concepts" | "presentations" | "voting" | "finished";
export type SessionStatus = "draft" | "active" | "completed";

export type JamSession = {
  id: string;
  code: string;
  topic: string;
  status: SessionStatus;
  current_phase: Phase;
  created_at: string;
};

export type Participant = {
  id: string;
  session_id: string;
  display_name: string;
  joined_at: string;
};

export type AspectCard = {
  id: string;
  session_id: string;
  participant_id: string | null;
  content: string;
  created_at: string;
};

export type Team = {
  id: string;
  session_id: string;
  team_name: string;
};

export type TeamMember = {
  team_id: string;
  participant_id: string;
};

export type TeamCard = {
  team_id: string;
  card_id: string;
};

export type Concept = {
  id: string;
  session_id: string;
  team_id: string;
  title: string;
  description: string;
  image_url: string | null;
  created_at: string;
};

export type Vote = {
  id: string;
  participant_id: string;
  concept_id: string;
  stars: number;
};

export type JamStore = {
  sessions: JamSession[];
  participants: Participant[];
  cards: AspectCard[];
  teams: Team[];
  team_members: TeamMember[];
  team_cards: TeamCard[];
  concepts: Concept[];
  votes: Vote[];
};

export type SessionBundle = {
  session: JamSession;
  participants: Participant[];
  cards: AspectCard[];
  teams: Team[];
  teamMembers: TeamMember[];
  teamCards: TeamCard[];
  concepts: Concept[];
  votes: Vote[];
};
