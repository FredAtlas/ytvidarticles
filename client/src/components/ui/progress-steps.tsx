import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export interface ProgressStep {
  label: string;
  status: 'waiting' | 'processing' | 'completed' | 'error';
}

interface ProgressStepsProps {
  steps: ProgressStep[];
  className?: string;
}

export function ProgressSteps({ steps, className }: ProgressStepsProps) {
  const completedSteps = steps.filter(step => step.status === 'completed').length;
  const progress = (completedSteps / steps.length) * 100;

  return (
    <div className={cn("space-y-4", className)}>
      <Progress value={progress} />
      <div className="space-y-2">
        {steps.map((step, index) => (
          <div
            key={index}
            className={cn(
              "flex items-center gap-2 text-sm",
              step.status === 'completed' && "text-primary",
              step.status === 'processing' && "text-blue-500",
              step.status === 'error' && "text-destructive"
            )}
          >
            <div
              className={cn(
                "h-2 w-2 rounded-full",
                step.status === 'completed' && "bg-primary",
                step.status === 'processing' && "bg-blue-500 animate-pulse",
                step.status === 'error' && "bg-destructive",
                step.status === 'waiting' && "bg-muted"
              )}
            />
            <span>{step.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
