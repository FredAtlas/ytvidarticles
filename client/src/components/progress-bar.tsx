import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface ProgressBarProps {
  stage: string;
  progress: number;
}

const stages = {
  "extracting_transcript": "Extracting Video Transcript",
  "analyzing_transcript": "Analyzing Content",
  "generating_draft": "Creating First Draft",
  "refining_content": "Refining Content",
  "finalizing": "Finalizing Article"
};

export function ProgressBar({ stage, progress }: ProgressBarProps) {
  return (
    <Card className="p-4">
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">
            {stages[stage as keyof typeof stages] || stage}
          </span>
          <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="w-full" />
      </div>
    </Card>
  );
}
