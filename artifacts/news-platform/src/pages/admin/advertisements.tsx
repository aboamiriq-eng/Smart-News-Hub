import { useTranslation } from "@/hooks/use-translation";
import { useListAdvertisements, useDeleteAdvertisement, getListAdvertisementsQueryKey } from "@workspace/api-client-react";
import { AdminLayout } from "@/components/admin-layout";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash, Plus } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export default function AdminAds() {
  const { lang, t } = useTranslation();
  const queryClient = useQueryClient();
  
  const { data: ads, isLoading } = useListAdvertisements({});
  const deleteAd = useDeleteAdvertisement({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListAdvertisementsQueryKey() });
      }
    }
  });

  const handleDelete = (id: number) => {
    if (confirm("Are you sure?")) {
      deleteAd.mutate({ id });
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold font-serif">{t('admin.advertisements')}</h1>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Ad
          </Button>
        </div>

        <div className="border rounded-md bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Impressions</TableHead>
                <TableHead>Clicks</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">Loading...</TableCell>
                </TableRow>
              ) : ads?.map((ad) => (
                <TableRow key={ad.id}>
                  <TableCell className="font-medium">{ad.title}</TableCell>
                  <TableCell>{ad.position}</TableCell>
                  <TableCell>
                    <Badge variant={ad.active ? 'default' : 'secondary'}>
                      {ad.active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>{ad.impressions || 0}</TableCell>
                  <TableCell>{ad.clicks || 0}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(ad.id)}
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
