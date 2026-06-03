import { JamSession } from "@/components/jam-session";

export default async function ConceptsPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return <JamSession code={code} view="concepts" />;
}
