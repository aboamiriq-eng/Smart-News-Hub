import { useTranslation } from "@/hooks/use-translation";
import { useGetDashboardSummary, useGetLiveVisitors } from "@workspace/api-client-react";
import { AdminLayout } from "@/components/admin-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Users, Eye, CheckCircle2 } from "lucide-react";
import { Link } from "wouter";

export default function AdminDashboard() {
  const { lang, t } = useTranslation();
  
  const { data: summary, isLoading: loadingSummary } = useGetDashboardSummary();
  const { data: visitors, isLoading: loadingVisitors } = useGetLiveVisitors();

  if (loadingSummary || loadingVisitors) {
    return (
      <AdminLayout>
        <div>Loading...</div>
      </AdminLayout>
    );
  }

  const statCards = [
    {
      title: "Total Articles",
      value: summary?.totalArticles || 0,
      icon: FileText,
      description: "Published across all languages"
    },
    {
      title: "Live Visitors",
      value: visitors?.count || 0,
      icon: Users,
      description: `${visitors?.arCount || 0} AR • ${visitors?.enCount || 0} EN`,
      valueClass: "text-red-500" // live indicator
    },
    {
      title: "Total Views",
      value: summary?.totalViews || 0,
      icon: Eye,
      description: "Lifetime article views"
    },
    {
      title: "Published Today",
      value: summary?.publishedToday || 0,
      icon: CheckCircle2,
      description: "New articles today"
    }
  ];

  return (
    <AdminLayout>
      <div className="space-y-8">
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold ${stat.valueClass || ''}`}>{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Articles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {summary?.recentArticles?.map((article) => (
                <div key={article.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                  <div className="space-y-1">
                    <Link href={`/article/${article.slug}`} className="font-medium hover:underline">
                      {article.title}
                    </Link>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="uppercase">{article.lang}</span>
                      <span>•</span>
                      <span>{article.categoryName}</span>
                      <span>•</span>
                      <span>{article.viewCount} views</span>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {article.publishedAt ? new Date(article.publishedAt).toLocaleDateString() : 'Draft'}
                  </div>
                </div>
              ))}
              {!summary?.recentArticles?.length && (
                <div className="text-sm text-muted-foreground">No recent articles.</div>
              )}
            </div>
          </CardContent>
        </Card>

      </div>
    </AdminLayout>
  );
}
