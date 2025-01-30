import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useSettings, useUpdateSettings } from "@/lib/api";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon, Loader2 } from "lucide-react";

export default function Settings() {
  const { data: settings, isLoading } = useSettings();
  const updateSettings = useUpdateSettings();

  const form = useForm({
    defaultValues: {
      editorialGuidelines: "",
      writingSamples: "",
    },
  });

  // Update form when settings are loaded
  useEffect(() => {
    if (settings) {
      form.reset({
        editorialGuidelines: settings.editorialGuidelines || "",
        writingSamples: settings.writingSamples?.join('\n\n') || "",
      });
    }
  }, [settings, form]);

  const onSubmit = async (data: any) => {
    const writingSamples = data.writingSamples
      .split('\n\n')
      .map((sample: string) => sample.trim())
      .filter((sample: string) => sample.length > 0);

    await updateSettings.mutateAsync({
      editorialGuidelines: data.editorialGuidelines,
      writingSamples,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

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
              {updateSettings.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Settings"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}