import { createFileRoute } from "@tanstack/react-router";
import { GameApp } from "@/game/App";

const GO = new Set(["career", "dynasty", "eras", "hof", "saves", "continue"]);

export const Route = createFileRoute("/")({
  validateSearch: (raw: Record<string, unknown>) => {
    const go = typeof raw.go === "string" && GO.has(raw.go) ? raw.go : undefined;
    return go ? { go } : {};
  },
  component: Home,
});

function Home() {
  const { go } = Route.useSearch();
  return <GameApp start={go} />;
}
