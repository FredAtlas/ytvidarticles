import { Progress } from "@/components/ui/progress";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

interface SeoScoreProps {
  score: number;
  feedback: string;
}

export default function SeoScore({ score, feedback }: SeoScoreProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className="space-y-2">
      <HoverCard>
        <HoverCardTrigger>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium">SEO Score</h3>
            <span className="text-xs text-muted-foreground">
              (hover for details)
            </span>
          </div>
        </HoverCardTrigger>
        <HoverCardContent className="w-80">
          <p className="text-sm">{feedback}</p>
        </HoverCardContent>
      </HoverCard>

      <div className="flex items-center gap-4">
        <Progress
          value={score}
          className={getScoreColor(score)}
          indicatorClassName={getScoreColor(score)}
        />
        <span className="text-sm font-medium">{score}%</span>
      </div>
    </div>
  );
}
