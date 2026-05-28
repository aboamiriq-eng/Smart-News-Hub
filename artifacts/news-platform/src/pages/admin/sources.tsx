import { useTranslation } from "@/hooks/use-translation";
import { useListSources, useDeleteSource, useFetchFromSource, getListSourcesQueryKey } from "@workspace/api-client-react";
import { AdminLayout } from "@/components/admin-layout";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Edit, Trash, Plus, RefreshCw } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function AdminSources() {
  const { lang, t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: sources, isLoading } = useListSources({});
  const deleteSource = useDeleteSource({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListSourcesQueryKey() });
      }
    }
  });

  const fetchSource = useFetchFromSource({
    mutation: {
      onSuccess: (data) => {
        toast({
          title: "Source Fetched",
          description: data.message || `Added ${data.articlesAdded} articles.`
        });
        queryClient.invalidateQueries({ queryKey: getListSourcesQueryKey() });
      }
    }
  });

  const handleDelete = (id: number) => {
    if (confirm("Are you sure?")) {
      deleteSource.mutate({ id });
    }
  };

  const handleFetch = (id: number) => {
    fetchSource.mutate({ id });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold font-serif">{t('admin.sources')}</h1>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Source
          </Button>
        </div>

        <div className="border rounded-md bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>URL</TableHead>
                <TableHead>Lang</TableHead>
                <TableHead>Articles</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">Loading...</TableCell>
                </TableRow>
              ) : sources?.map((source) => (
                <TableRow key={source.id}>
                  <TableCell className="font-medium">{source.name}</TableCell>
                  <TableCell>{source.url}</TableCell>
                  <TableCell className="uppercase">{source.lang}</TableCell>
                  <TableCell>{source.articleCount}</TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-muted-foreground hover:text-primary"
                      onClick={() => handleFetch(source.id)}
                      disabled={fetchSource.isPending}
                    >
                      <RefreshCw className={`w-4 h-4 ${fetchSource.isPending ? 'animate-spin' : ''}`} />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(source.id)}
                    >
                      <Trash className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </AdminLayout>
  );
}
