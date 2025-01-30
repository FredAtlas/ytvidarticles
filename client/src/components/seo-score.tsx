import { Progress } from "@/components/ui/progress";

interface SEOScoreProps {
  score: number;
}

export function SEOScore({ score }: SEOScoreProps) {
  const getColor = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className="flex items-center gap-2">
      <Progress
        value={score}
        className="w-24 h-2"
        indicatorClassName={getColor(score)}
      />
      <span className="text-sm font-medium">{score}%</span>
    </div>
  );
}
