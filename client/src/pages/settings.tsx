import { useForm } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useSettings, useUpdateSettings } from "@/lib/api";
import { Label } from "@/components/ui/label";

export default function Settings() {
  const { data: settings } = useSettings();
  const updateSettings = useUpdateSettings();

  const { register, handleSubmit } = useForm({
    defaultValues: settings || {},
  });

  const onSubmit = async (data: any) => {
    await updateSettings.mutateAsync(data);
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <h1 className="text-3xl font-bold">Settings</h1>
      <Card>
        <CardHeader>
          <CardTitle>Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label>OpenAI API Key</Label>
              <Input
                type="password"
                {...register("openaiApiKey")}
                placeholder="sk-..."
              />
            </div>
            <div className="space-y-2">
              <Label>Perplexity API Key</Label>
              <Input
                type="password"
                {...register("perplexityApiKey")}
                placeholder="pplx-..."
              />
            </div>
            <div className="space-y-2">
              <Label>Editorial Guidelines</Label>
              <Textarea
                {...register("editorialGuidelines")}
                placeholder="Enter your editorial guidelines..."
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label>Writing Samples</Label>
              <Textarea
                {...register("writingSamples")}
                placeholder="Enter writing samples (one per line)..."
                rows={4}
              />
            </div>
            <Button type="submit">Save Settings</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
