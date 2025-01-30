import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

export interface GenerationStep {
  id: string;
  label: string;
  status: "pending" | "active" | "completed" | "error";
}

interface ArticleGenerationProgressProps {
  currentStep: number;
  steps: GenerationStep[];
}

export function ArticleGenerationProgress({ currentStep, steps }: ArticleGenerationProgressProps) {
  const progress = (currentStep / (steps.length - 1)) * 100;

  return (
    <div className="space-y-4">
      <Progress value={progress} />
      <div className="grid grid-cols-1 gap-2">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center justify-between">
            <span className="text-sm">{step.label}</span>
            <Badge 
              variant={
                step.status === "completed" ? "default" :
                step.status === "active" ? "secondary" :
                step.status === "error" ? "destructive" : "outline"
              }
            >
              {step.status === "completed" ? "Done" :
               step.status === "active" ? "In Progress" :
               step.status === "error" ? "Error" : "Pending"}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  );
}
