import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface ArticlePublicationStatusProps {
  articleId: number;
  isPublished: boolean;
  publishedAt: string | null;
}

export function ArticlePublicationStatus({ 
  articleId, 
  isPublished, 
  publishedAt 
}: ArticlePublicationStatusProps) {
  const [date, setDate] = useState<Date | undefined>(
    publishedAt ? new Date(publishedAt) : undefined
  );
  const queryClient = useQueryClient();

  const publishMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/articles/${articleId}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publishedAt: date?.toISOString() }),
      });
      if (!response.ok) throw new Error("Failed to publish article");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/articles"] });
      toast({
        title: "Success",
        description: "Article marked as published",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update publication status",
        variant: "destructive",
      });
    },
  });

  const unpublishMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/articles/${articleId}/unpublish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) throw new Error("Failed to unpublish article");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/articles"] });
      setDate(undefined);
      toast({
        title: "Success",
        description: "Article unpublished",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to unpublish article",
        variant: "destructive",
      });
    },
  });

  const handlePublish = () => {
    if (!date) {
      toast({
        title: "Error",
        description: "Please select a publication date",
        variant: "destructive",
      });
      return;
    }
    publishMutation.mutate();
  };

  return (
    <div className="flex items-center gap-2">
      <Badge variant={isPublished ? "default" : "secondary"}>
        {isPublished ? "Published" : "Draft"}
      </Badge>
      
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-[240px] justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? format(date, "PPP") : "Set publication date"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            initialFocus
          />
        </PopoverContent>
      </Popover>

      {isPublished ? (
        <Button
          variant="outline"
          onClick={() => unpublishMutation.mutate()}
          disabled={unpublishMutation.isPending}
        >
          {unpublishMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Unpublishing...
            </>
          ) : (
            "Unpublish"
          )}
        </Button>
      ) : (
        <Button
          onClick={handlePublish}
          disabled={publishMutation.isPending}
        >
          {publishMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Publishing...
            </>
          ) : (
            "Publish"
          )}
        </Button>
      )}
    </div>
  );
}
