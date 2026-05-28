import { useTranslation } from "@/hooks/use-translation";
import { useListArticles, useListCategories } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { Helmet } from "react-helmet-async";
import { Link, useParams } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, Eye } from "lucide-react";
import { format } from "date-fns";

export default function Category() {
  const { slug } = useParams();
  const { lang, t } = useTranslation();
  
  const { data: categories } = useListCategories({ lang });
  const category = categories?.find(c => c.slug === slug);

  const { data: articles, isLoading } = useListArticles({ 
    lang: lang as any, 
    categoryId: category?.id,
    limit: 20
  }, {
    query: { enabled: !!category?.id }
  });

  return (
    <Layout>
      <Helmet>
        <title>{category ? `${lang === 'ar' ? category.nameAr : category.nameEn} | ${lang === 'ar' ? 'النبأ' : 'AL NABA'}` : 'Category'}</title>
      </Helmet>

      <div className="container py-8">
        <header className="mb-12 text-center max-w-2xl mx-auto">
          <h1 className="text-4xl font-black font-serif mb-4 text-primary">
            {category ? (lang === 'ar' ? category.nameAr : category.nameEn) : t('general.loading')}
          </h1>
          {category?.description && (
            <p className="text-lg text-muted-foreground">
              {category.description}
            </p>
          )}
        </header>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="animate-pulse space-y-3">
                <div className="aspect-[16/10] bg-muted rounded-xl"></div>
                <div className="h-4 bg-muted rounded w-full"></div>
                <div className="h-4 bg-muted rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {articles?.articles.map((article) => (
              <Card key={article.id} className="overflow-hidden border-none shadow-none group bg-transparent">
                <Link href={`/article/${article.slug}`}>
                  <div className="aspect-[16/10] bg-muted rounded-lg overflow-hidden mb-4 relative">
                    {article.imageUrl && (
                      <img 
                        src={article.imageUrl} 
                        alt={article.title}
                        className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
                      />
                    )}
                  </div>
                  <CardContent className="p-0">
                    <h3 className="text-lg font-bold font-serif mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                      {article.title}
                    </h3>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {article.publishedAt && format(new Date(article.publishedAt), 'MMM d, yyyy')}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {article.viewCount}
                      </span>
                    </div>
                  </CardContent>
                </Link>
              </Card>
            ))}
          </div>
        )}

        {!isLoading && !articles?.articles.length && (
          <div className="text-center py-24 text-muted-foreground">
            No articles found in this category.
          </div>
        )}
      </div>
    </Layout>
  );
}
