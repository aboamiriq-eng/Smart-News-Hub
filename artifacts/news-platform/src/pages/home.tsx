import { useTranslation } from "@/hooks/use-translation";
import { useGetFeaturedArticles, useListArticles, useGetTrendingArticles } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { Helmet } from "react-helmet-async";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Eye, ChevronRight, ChevronLeft } from "lucide-react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

function BreakingTicker({ articles }: { articles: any[] }) {
  const { lang, t } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!articles?.length) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % articles.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [articles]);

  if (!articles?.length) return null;

  return (
    <div className="bg-destructive text-destructive-foreground px-4 py-2 flex items-center gap-4 overflow-hidden">
      <div className="font-bold shrink-0 flex items-center gap-2 uppercase tracking-wider text-sm">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
        </span>
        {t('nav.breaking')}
      </div>
      <div className="w-px h-4 bg-destructive-foreground/30 shrink-0" />
      <div className="flex-1 relative h-6 overflow-hidden">
        <AnimatePresence mode="popLayout">
          <motion.div
            key={currentIndex}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 flex items-center"
          >
            <Link href={`/article/${articles[currentIndex].slug}`} className="hover:underline truncate block w-full text-sm">
              {articles[currentIndex].title}
            </Link>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function Home() {
  const { lang, t } = useTranslation();
  
  const { data: featured } = useGetFeaturedArticles({ lang });
  const { data: latest } = useListArticles({ lang, limit: 12, status: "published" as const });
  const { data: trending } = useGetTrendingArticles({ lang, limit: 5 });

  const breakingArticles = featured?.filter(a => a.breaking) || [];
  const heroArticle = featured?.[0];
  const otherFeatured = featured?.slice(1, 4) || [];

  return (
    <Layout>
      <Helmet>
        <title>{lang === 'ar' ? 'النبأ | الأخبار كما يجب أن تكون' : 'AL NABA | News as it should be'}</title>
        <meta name="description" content="A smart bilingual news platform." />
      </Helmet>

      <BreakingTicker articles={breakingArticles} />

      <div className="container py-8 space-y-12">
        {/* Hero Section */}
        {heroArticle && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 relative group overflow-hidden rounded-xl">
              <Link href={`/article/${heroArticle.slug}`}>
                <div className="aspect-[16/9] relative bg-muted">
                  {heroArticle.imageUrl && (
                    <img 
                      src={heroArticle.imageUrl} 
                      alt={heroArticle.imageAlt || heroArticle.title}
                      className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 text-white">
                    {heroArticle.categoryName && (
                      <Badge className="mb-4 bg-primary hover:bg-primary/90 text-white border-none rounded-sm px-3 py-1">
                        {heroArticle.categoryName}
                      </Badge>
                    )}
                    <h2 className="text-2xl md:text-4xl font-bold font-serif mb-3 leading-tight">
                      {heroArticle.title}
                    </h2>
                    {heroArticle.summary && (
                      <p className="text-white/80 md:text-lg line-clamp-2 max-w-3xl hidden md:block">
                        {heroArticle.summary}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            </div>
            <div className="lg:col-span-4 flex flex-col gap-6">
              {otherFeatured.map((article) => (
                <Link key={article.id} href={`/article/${article.slug}`} className="flex gap-4 group">
                  <div className="w-1/3 aspect-video shrink-0 bg-muted rounded-md overflow-hidden">
                    {article.imageUrl && (
                      <img 
                        src={article.imageUrl} 
                        alt={article.title}
                        className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
                      />
                    )}
                  </div>
                  <div className="flex-1 flex flex-col justify-center">
                    <h3 className="font-bold font-serif line-clamp-3 group-hover:text-primary transition-colors text-sm md:text-base leading-snug">
                      {article.title}
                    </h3>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {article.publishedAt && format(new Date(article.publishedAt), 'MMM d, yyyy')}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-8 space-y-8">
            <div className="flex items-center justify-between border-b pb-4">
              <h2 className="text-2xl font-bold font-serif">{lang === 'ar' ? 'أحدث الأخبار' : 'Latest News'}</h2>
            </div>
            <div className="space-y-6">
              {latest?.articles?.map((article) => (
                <Card key={article.id} className="overflow-hidden border-none shadow-none group bg-transparent">
                  <Link href={`/article/${article.slug}`}>
                    <div className="flex gap-4 sm:gap-5">
                      <div className="w-28 h-24 sm:w-36 sm:h-28 md:w-44 md:h-32 shrink-0 bg-muted rounded-lg overflow-hidden relative">
                        {article.imageUrl ? (
                          <img
                            src={article.imageUrl}
                            alt={article.imageAlt || article.title}
                            className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-muted">
                            <Eye className="w-6 h-6 text-muted-foreground/30" />
                          </div>
                        )}
                      </div>
                      <CardContent className="p-0 flex-1 flex flex-col justify-between py-1">
                        <div>
                          {article.categoryName && (
                            <Badge className="mb-2 text-[10px] px-1.5 py-0 bg-primary/10 text-primary hover:bg-primary/20 border-none rounded-sm">
                              {article.categoryName}
                            </Badge>
                          )}
                          <h3 className="text-base sm:text-lg font-bold font-serif line-clamp-2 group-hover:text-primary transition-colors leading-snug">
                            {article.title}
                          </h3>
                          <p className="text-muted-foreground text-sm line-clamp-1 mt-1 hidden sm:block">
                            {article.summary}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {article.publishedAt && format(new Date(article.publishedAt), lang === 'ar' ? 'dd MMM' : 'MMM d')}
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {article.viewCount?.toLocaleString()}
                          </span>
                        </div>
                      </CardContent>
                    </div>
                  </Link>
                </Card>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-8">
            <div className="border rounded-xl p-6 bg-card">
              <h2 className="text-xl font-bold font-serif border-b pb-4 mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary" />
                {lang === 'ar' ? 'الأكثر قراءة' : 'Trending Now'}
              </h2>
              <div className="space-y-6">
                {trending?.map((article, i) => (
                  <Link key={article.id} href={`/article/${article.slug}`} className="flex gap-4 group">
                    <div className="text-4xl font-black text-muted/50 font-serif w-8">
                      {i + 1}
                    </div>
                    <div className="flex-1 pt-1">
                      <h3 className="font-bold font-serif line-clamp-2 group-hover:text-primary transition-colors text-sm">
                        {article.title}
                      </h3>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Ad Placeholder */}
            <div className="aspect-[300/250] bg-muted border flex items-center justify-center text-muted-foreground rounded-xl relative overflow-hidden">
              <div className="absolute top-2 right-2 text-[10px] uppercase tracking-wider opacity-50">Advertisement</div>
              <p className="font-medium opacity-50">Ad Space</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
