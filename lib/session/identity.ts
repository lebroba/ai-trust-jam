"use client";

// Maps this browser to its Supabase participant row for a given session code.
// The participant id is the DB-generated uuid, persisted locally so a refresh
// (or returning later) keeps the same identity instead of creating duplicates.

const idKey = (code: string) => `ai-trust-jam-participant-${code.toUpperCase()}`;
const nameKey = (code: string) => `ai-trust-jam-name-${code.toUpperCase()}`;

export function myParticipantId(code: string): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(idKey(code));
}

export function setMyParticipantId(code: string, id: string) {
  localStorage.setItem(idKey(code), id);
}

export function myName(code: string): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(nameKey(code)) ?? "";
}

export function setMyName(code: string, name: string) {
  localStorage.setItem(nameKey(code), name);
}
