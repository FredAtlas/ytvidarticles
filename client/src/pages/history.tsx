import { useArticles } from "@/lib/api";
import { Button } from "@/components/ui/button";
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
import { ExternalLink, Edit, Search } from "lucide-react";

interface GenerationChunk {
  originalText: string;
  summary: string;
  position: number;
}

export default function History() {
  const { data: articles, isLoading } = useArticles();
  const [, setLocation] = useLocation();

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 space-y-8">
        <h1 className="text-3xl font-bold">History</h1>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[100px] w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <h1 className="text-3xl font-bold">History</h1>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>YouTube Link</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {articles?.map((article) => (
              <TableRow key={article.id}>
                <TableCell className="font-medium">{article.title}</TableCell>
                <TableCell>
                  <a
                    href={article.youtubeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center hover:underline text-blue-500"
                  >
                    {article.youtubeUrl}
                    <ExternalLink className="ml-1 h-4 w-4" />
                  </a>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setLocation(`/edit/${article.id}`)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setLocation(`/analysis/${article.id}`)}
                    >
                      <Search className="h-4 w-4 mr-1" />
                      Analysis
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}