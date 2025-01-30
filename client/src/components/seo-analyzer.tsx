import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface SEOAnalyzerProps {
  score: number;
  title: string;
  metaDescription: string;
  content: string;
  tags: string[];
}

export default function SEOAnalyzer({
  score,
  title,
  metaDescription,
  content,
  tags,
}: SEOAnalyzerProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-yellow-500";
    return "bg-red-500";
  };

  const checks = [
    {
      name: "Title Length",
      passed: title.length >= 40 && title.length <= 60,
      message: "Title should be between 40-60 characters",
    },
    {
      name: "Meta Description",
      passed: metaDescription.length >= 120 && metaDescription.length <= 155,
      message: "Meta description should be between 120-155 characters",
    },
    {
      name: "Content Length",
      passed: content.length >= 300,
      message: "Content should be at least 300 characters",
    },
    {
      name: "Tags",
      passed: tags.length >= 5,
      message: "Should have at least 5 tags",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>SEO Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">Overall Score</span>
              <span className="text-sm font-medium">{score}/100</span>
            </div>
            <Progress value={score} className={getScoreColor(score)} />
          </div>

          <div className="space-y-4">
            {checks.map((check, i) => (
              <div key={i} className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">{check.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {check.message}
                  </div>
                </div>
                <Badge variant={check.passed ? "default" : "destructive"}>
                  {check.passed ? "Passed" : "Failed"}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
