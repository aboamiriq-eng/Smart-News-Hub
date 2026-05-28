import { useTranslation } from "@/hooks/use-translation";
import { useListArticles, useListCategories, getListArticlesQueryKey } from "@workspace/api-client-react";
import { proxyImage } from "@/lib/image";
import { Layout } from "@/components/layout";
import { Helmet } from "react-helmet-async";
import { Link, useParams } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Eye, Layers } from "lucide-react";
import { format } from "date-fns";

export default function Category() {
  const { slug } = useParams();
  const { lang, t } = useTranslation();

  const { data: categories } = useListCategories();
  const category = categories?.find((c) => c.slug === slug);

  const params = {
    lang: lang as "ar" | "en",
    categoryId: category?.id,
    status: "published" as const,
    limit: 24,
  };

  const { data: articles, isLoading } = useListArticles(params, {
    query: {
      enabled: !!category?.id,
      queryKey: getListArticlesQueryKey(params),
    },
  });

  return (
    <Layout>
      <Helmet>
        <title>
          {category
            ? `${lang === "ar" ? category.nameAr : category.nameEn} | ${lang === "ar" ? "النبأ" : "AL NABA"}`
            : "Category"}
        </title>
      </Helmet>

      {/* Category header */}
      <div className="border-b bg-muted/30">
        <div className="container py-10 text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
            <Layers className="w-5 h-5 text-primary" />
          </div>
          <h1 className="text-3xl md:text-4xl font-black font-serif mb-3 text-foreground">
            {category
              ? lang === "ar"
                ? category.nameAr
                : category.nameEn
              : t("general.loading")}
          </h1>
          {category?.description && (
            <p className="text-muted-foreground">{category.description}</p>
          )}
          {articles && (
            <p className="text-sm text-muted-foreground mt-2">
              {articles.total}{" "}
              {lang === "ar" ? "مقال في هذا القسم" : "articles in this section"}
            </p>
          )}
        </div>
      </div>

      <div className="container py-10">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="animate-pulse space-y-3">
                <div className="aspect-[16/10] bg-muted rounded-xl" />
                <div className="h-4 bg-muted rounded w-full" />
                <div className="h-4 bg-muted rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : articles?.articles && articles.articles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {articles.articles.map((article) => (
              <Card
                key={article.id}
                className="overflow-hidden border-none shadow-none group bg-transparent"
              >
                <Link href={`/article/${article.slug}`}>
                  <div className="aspect-[16/10] bg-muted rounded-lg overflow-hidden mb-4 relative">
                    {article.imageUrl ? (
                      <img
                        src={proxyImage(article.imageUrl) || ''}
                        alt={article.imageAlt || article.title}
                        className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Layers className="w-10 h-10 text-muted-foreground/30" />
                      </div>
                    )}
                    {article.breaking && (
                      <Badge className="absolute top-2 start-2 bg-destructive text-white border-none text-xs">
                        {lang === "ar" ? "عاجل" : "Breaking"}
                      </Badge>
                    )}
                  </div>
                  <CardContent className="p-0">
                    <h3 className="text-base font-bold font-serif mb-2 line-clamp-2 group-hover:text-primary transition-colors leading-snug">
                      {article.title}
                    </h3>
                    {article.summary && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                        {article.summary}
                      </p>
                    )}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {article.publishedAt &&
                          format(new Date(article.publishedAt), "MMM d, yyyy")}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {article.viewCount?.toLocaleString()}
                      </span>
                    </div>
                  </CardContent>
                </Link>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-24 space-y-3">
            <Layers className="w-12 h-12 text-muted-foreground/30 mx-auto" />
            <p className="text-muted-foreground font-medium">
              {lang === "ar"
                ? "لا توجد مقالات في هذا القسم بعد"
                : "No articles in this section yet"}
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}
