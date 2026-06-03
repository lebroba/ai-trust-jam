import { JamSession } from "@/components/jam-session";

export default async function VotePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return <JamSession code={code} view="vote" />;
}
