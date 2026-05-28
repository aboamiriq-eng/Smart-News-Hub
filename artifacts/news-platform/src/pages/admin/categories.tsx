import { useTranslation } from "@/hooks/use-translation";
import { useListCategories, useDeleteCategory, getListCategoriesQueryKey } from "@workspace/api-client-react";
import { AdminLayout } from "@/components/admin-layout";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Edit, Trash, Plus } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export default function AdminCategories() {
  const { lang, t } = useTranslation();
  const queryClient = useQueryClient();
  
  const { data: categories, isLoading } = useListCategories({});
  const deleteCategory = useDeleteCategory({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListCategoriesQueryKey() });
      }
    }
  });

  const handleDelete = (id: number) => {
    if (confirm("Are you sure?")) {
      deleteCategory.mutate({ id });
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold font-serif">{t('admin.categories')}</h1>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Category
          </Button>
        </div>

        <div className="border rounded-md bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name (AR)</TableHead>
                <TableHead>Name (EN)</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Articles</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">Loading...</TableCell>
                </TableRow>
              ) : categories?.map((cat) => (
                <TableRow key={cat.id}>
                  <TableCell className="font-medium">{cat.nameAr}</TableCell>
                  <TableCell>{cat.nameEn}</TableCell>
                  <TableCell>{cat.slug}</TableCell>
                  <TableCell>{cat.articleCount}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(cat.id)}
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
