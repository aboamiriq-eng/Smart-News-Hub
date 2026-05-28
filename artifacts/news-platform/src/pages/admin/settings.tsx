import { useTranslation } from "@/hooks/use-translation";
import { useGetSettings, useUpdateSettings, getGetSettingsQueryKey } from "@workspace/api-client-react";
import { AdminLayout } from "@/components/admin-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";

export default function AdminSettings() {
  const { lang, t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: settings } = useGetSettings({});
  const updateSettings = useUpdateSettings({
    mutation: {
      onSuccess: () => {
        toast({ title: "Settings updated successfully" });
        queryClient.invalidateQueries({ queryKey: getGetSettingsQueryKey() });
      }
    }
  });

  const [formData, setFormData] = useState({
    siteNameAr: "",
    siteNameEn: "",
    descriptionAr: "",
    descriptionEn: ""
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        siteNameAr: settings.siteNameAr || "",
        siteNameEn: settings.siteNameEn || "",
        descriptionAr: settings.descriptionAr || "",
        descriptionEn: settings.descriptionEn || ""
      });
    }
  }, [settings]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings.mutate({ data: formData });
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-2xl">
        <h1 className="text-3xl font-bold font-serif">{t('admin.settings')}</h1>

        <form onSubmit={handleSubmit} className="space-y-6 bg-card p-6 border rounded-xl">
          <div className="space-y-4">
            <div>
              <Label>Site Name (Arabic)</Label>
              <Input 
                value={formData.siteNameAr} 
                onChange={e => setFormData({...formData, siteNameAr: e.target.value})} 
                dir="rtl"
              />
            </div>
            <div>
              <Label>Site Name (English)</Label>
              <Input 
                value={formData.siteNameEn} 
                onChange={e => setFormData({...formData, siteNameEn: e.target.value})} 
              />
            </div>
            <div>
              <Label>Description (Arabic)</Label>
              <Textarea 
                value={formData.descriptionAr} 
                onChange={e => setFormData({...formData, descriptionAr: e.target.value})} 
                dir="rtl"
              />
            </div>
            <div>
              <Label>Description (English)</Label>
              <Textarea 
                value={formData.descriptionEn} 
                onChange={e => setFormData({...formData, descriptionEn: e.target.value})} 
              />
            </div>
          </div>

          <Button type="submit" disabled={updateSettings.isPending}>
            {updateSettings.isPending ? "Saving..." : "Save Settings"}
          </Button>
        </form>
      </div>
    </AdminLayout>
  );
}
