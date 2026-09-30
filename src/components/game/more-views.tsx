import { useGame } from "@/game/store";
import { RanksView } from "@/components/game/ranks-view";
import { BracketView } from "@/components/game/bracket-view";
import { NewsView } from "@/components/game/news-view";
import { PodcastsView } from "@/components/game/podcast-view";
import { RecordsView } from "@/components/game/records-view";
import { ArchivesView } from "@/components/game/archives-view";

export function MoreViews() {
  const { view } = useGame();
  if (view === "standings") return <RanksView />;
  if (view === "places") return <RanksView start="places" />;
  if (view === "records" || view === "leaders") return <RecordsView />;
  if (view === "archives") return <ArchivesView />;
  if (view === "news") return <NewsView />;
  if (view === "podcasts") return <PodcastsView />;
  if (view === "bracketology") return <BracketView />;
  if (view === "bracket") return <BracketView />;
  return <RanksView />;
}