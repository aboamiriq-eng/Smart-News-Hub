import { useTranslation } from "@/hooks/use-translation";
import { useGetArticleBySlug, useGetRelatedArticles, useTrackArticleView, getGetArticleBySlugQueryKey } from "@workspace/api-client-react";
import { proxyImage } from "@/lib/image";
import { Layout } from "@/components/layout";
import { Helmet } from "react-helmet-async";
import { Link, useParams } from "wouter";
import { format } from "date-fns";
import { Clock, Eye, Share2, Facebook, Twitter, Link as LinkIcon } from "lucide-react";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function ArticleDetail() {
  const { slug } = useParams();
  const { lang, t } = useTranslation();
  
  const { data: article, isLoading } = useGetArticleBySlug(slug as string, {
    query: { enabled: !!slug, queryKey: getGetArticleBySlugQueryKey(slug as string) }
  });

  const { data: related } = useGetRelatedArticles(article?.id as number, {
    query: { enabled: !!article?.id }
  });

  const trackView = useTrackArticleView();
  const trackedRef = useRef(false);

  useEffect(() => {
    if (article?.id && !trackedRef.current) {
      trackView.mutate({ id: article.id });
      trackedRef.current = true;
    }
  }, [article?.id, trackView]);

  if (isLoading) {
    return (
      <Layout>
        <div className="container py-12">
          <div className="animate-pulse space-y-4 max-w-4xl mx-auto">
            <div className="h-8 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/4"></div>
            <div className="aspect-video bg-muted rounded-xl"></div>
            <div className="h-4 bg-muted rounded w-full"></div>
            <div className="h-4 bg-muted rounded w-full"></div>
            <div className="h-4 bg-muted rounded w-5/6"></div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!article) {
    return (
      <Layout>
        <div className="container py-24 text-center">
          <h1 className="text-2xl font-bold">{t('general.error')}</h1>
        </div>
      </Layout>
    );
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "headline": article.title,
    "image": article.imageUrl ? [article.imageUrl] : [],
    "datePublished": article.publishedAt || article.createdAt,
    "dateModified": article.updatedAt,
    "author": [{
        "@type": "Organization",
        "name": article.sourceName || "AL NABA"
    }]
  };

  return (
    <Layout>
      <Helmet>
        <title>{`${article.title} | ${lang === 'ar' ? 'النبأ' : 'AL NABA'}`}</title>
        <meta name="description" content={article.metaDescription || article.summary || ''} />
        <meta property="og:title" content={article.title} />
        <meta property="og:description" content={article.metaDescription || article.summary || ''} />
        {article.imageUrl && <meta property="og:image" content={article.imageUrl} />}
        <meta name="twitter:card" content="summary_large_image" />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      <div className="container py-8 md:py-12 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <article className="lg:col-span-8">
            <header className="mb-8">
              {article.categoryName && (
                <Badge className="mb-4 bg-primary text-white border-none">{article.categoryName}</Badge>
              )}
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-black font-serif leading-tight mb-4 text-foreground">
                {article.title}
              </h1>
              {article.summary && (
                <p className="text-lg md:text-xl text-muted-foreground mb-6 font-medium leading-relaxed">
                  {article.summary}
                </p>
              )}
              <div className="flex flex-wrap items-center justify-between gap-4 py-4 border-y">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  {article.publishedAt && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {format(new Date(article.publishedAt), 'MMM d, yyyy h:mm a')}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    {article.viewCount} {t('article.views')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" className="rounded-full">
                    <Facebook className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="icon" className="rounded-full">
                    <Twitter className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="icon" className="rounded-full">
                    <LinkIcon className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </header>

            {article.imageUrl && (
              <div className="mb-8 aspect-video relative rounded-xl overflow-hidden bg-muted">
                <img 
                  src={proxyImage(article.imageUrl) || ''}
                  alt={article.imageAlt || article.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div 
              className="prose prose-lg dark:prose-invert max-w-none prose-headings:font-serif prose-a:text-primary"
              dangerouslySetInnerHTML={{ __html: article.content || '' }}
            />

            {article.tags && article.tags.length > 0 && (
              <div className="mt-8 pt-8 border-t flex flex-wrap gap-2">
                {article.tags.map(tag => (
                  <Badge key={tag} variant="secondary">#{tag}</Badge>
                ))}
              </div>
            )}
          </article>

          <aside className="lg:col-span-4 space-y-8">
            <div className="border rounded-xl p-6 bg-card sticky top-24">
              <h3 className="text-xl font-bold font-serif mb-6 border-b pb-4">{t('article.related')}</h3>
              <div className="space-y-6">
                {related?.map(rel => (
                  <Link key={rel.id} href={`/article/${rel.slug}`} className="flex gap-4 group">
                    <div className="w-24 aspect-square shrink-0 bg-muted rounded-md overflow-hidden">
                      {rel.imageUrl && (
                        <img 
                          src={proxyImage(rel.imageUrl) || ''}
                          alt={rel.title}
                          className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        />
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold font-serif text-sm line-clamp-3 group-hover:text-primary transition-colors">
                        {rel.title}
                      </h4>
                      <div className="text-xs text-muted-foreground mt-2">
                        {rel.publishedAt && format(new Date(rel.publishedAt), 'MMM d, yyyy')}
                      </div>
                    </div>
                  </Link>
                ))}
                {!related?.length && (
                  <p className="text-muted-foreground text-sm">No related articles found.</p>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </Layout>
  );
}
