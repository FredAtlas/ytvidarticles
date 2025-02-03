import { useArticles } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useLocation } from "wouter";
import { ExternalLink, Edit, Trash2, FileDown } from "lucide-react";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import { ArticlePublicationStatus } from "@/components/article-publication-status";

export default function History() {
  const [, setLocation] = useLocation();
  const { data: articles, isLoading, mutate } = useArticles();
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const handleDelete = async () => {
    if (!selectedIds.length) return;

    try {
      const response = await fetch('/api/articles', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete articles');
      }

      // Force refetch the articles data
      await mutate(undefined, { revalidate: true });
      setSelectedIds([]);
      toast({
        title: "Success",
        description: "Selected articles deleted successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete articles",
        variant: "destructive"
      });
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(i => i !== id)
        : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    setSelectedIds(prev => 
      prev.length === articles?.length 
        ? [] 
        : (articles?.map(a => a.id) || [])
    );
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <Skeleton className="h-8 w-48 mb-4" />
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Article History</h1>
        {selectedIds.length > 0 && (
          <Button 
            variant="destructive"
            onClick={handleDelete}
            className="flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Delete Selected ({selectedIds.length})
          </Button>
        )}
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox 
                checked={selectedIds.length === articles?.length}
                onCheckedChange={toggleSelectAll}
              />
            </TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {articles?.map((article) => (
            <TableRow key={article.id}>
              <TableCell>
                <Checkbox 
                  checked={selectedIds.includes(article.id)}
                  onCheckedChange={() => toggleSelect(article.id)}
                />
              </TableCell>
              <TableCell>{article.title}</TableCell>
              <TableCell>
                <ArticlePublicationStatus
                  articleId={article.id}
                  isPublished={article.isPublished}
                  publishedAt={article.publishedAt}
                />
              </TableCell>
              <TableCell>
                {new Date(article.createdAt).toLocaleDateString()}
              </TableCell>
              <TableCell className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setLocation(`/?id=${article.id}`)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(`/preview/${article.id}`, '_blank')}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    try {
                      const response = await fetch(`/api/articles/${article.id}/html`, {
                        method: 'POST'
                      });
                      if (!response.ok) throw new Error('HTML conversion failed');

                      const blob = await response.blob();
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `article-${article.id}.html`;
                      a.click();
                      window.URL.revokeObjectURL(url);
                    } catch (error) {
                      toast({
                        title: "Error",
                        description: "Failed to download RTF version",
                        variant: "destructive"
                      });
                    }
                  }}
                >
                  <FileDown className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}