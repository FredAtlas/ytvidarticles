import { useForm } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useSettings, useUpdateSettings } from "@/lib/api";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";

export default function Settings() {
  const { data: settings } = useSettings();
  const updateSettings = useUpdateSettings();

  const form = useForm({
    defaultValues: {
      editorialGuidelines: settings?.editorialGuidelines || "",
      writingSamples: settings?.writingSamples?.join('\n\n') || "",
    },
  });

  const onSubmit = async (data: any) => {
    const writingSamples = data.writingSamples
      .split('\n\n')
      .map(sample => sample.trim())
      .filter(sample => sample.length > 0);

    await updateSettings.mutateAsync({
      ...data,
      writingSamples,
    });
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <h1 className="text-3xl font-bold">Settings</h1>
      <Card>
        <CardHeader>
          <CardTitle>Content Generation Settings</CardTitle>
          <CardDescription>
            Configure your writing preferences and style guidelines for content generation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="editorialGuidelines">Editorial Guidelines</Label>
              <Alert variant="default" className="mb-2">
                <InfoIcon className="h-4 w-4" />
                <AlertDescription>
                  Specify your content guidelines, including tone, style, formatting preferences, 
                  and any specific requirements for your articles.
                </AlertDescription>
              </Alert>
              <Textarea
                id="editorialGuidelines"
                {...form.register("editorialGuidelines")}
                placeholder="Example: Use a conversational tone, include real-world examples, break down complex topics into simple explanations..."
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="writingSamples">Writing Samples</Label>
              <Alert variant="default" className="mb-2">
                <InfoIcon className="h-4 w-4" />
                <AlertDescription>
                  Paste 2-3 paragraphs from your existing articles that best represent your writing style. 
                  Separate multiple samples with blank lines.
                </AlertDescription>
              </Alert>
              <Textarea
                id="writingSamples"
                {...form.register("writingSamples")}
                placeholder="Paste your writing samples here..."
                rows={8}
              />
            </div>
            <Button 
              type="submit" 
              disabled={updateSettings.isPending}
              className="w-full"
            >
              Save Settings
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}