import { AdminLayout } from "@/components/admin-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { RefreshCw, Rss, Bot, PlayCircle, CheckCircle, XCircle, Loader2, Zap, Globe } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface SourceStatus {
  id: number;
  name: string;
  feedUrl: string;
  lang: string;
  lastFetchedAt: string | null;
}

interface AutomationStatus {
  aiAvailable: boolean;
  activeSources: number;
  sourcesWithFeed: number;
  sources: SourceStatus[];
}

interface FetchResult {
  sourceId: number;
  sourceName: string;
  total?: number;
  added?: number;
  skipped?: number;
  errors?: string[];
  error?: string;
}

type JobStatus = "idle" | "running" | "done" | "error";

export default function AdminAutomation() {
  const { toast } = useToast();
  const [status, setStatus] = useState<AutomationStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [useAi, setUseAi] = useState(true);
  const [jobStatus, setJobStatus] = useState<JobStatus>("idle");
  const [results, setResults] = useState<FetchResult[]>([]);
  const [fetchingSourceId, setFetchingSourceId] = useState<number | null>(null);

  async function loadStatus() {
    setLoadingStatus(true);
    try {
      const res = await fetch("/api/automation/status");
      const data = await res.json();
      setStatus(data);
    } catch {
      toast({ title: "خطأ في تحميل الحالة", variant: "destructive" });
    } finally {
      setLoadingStatus(false);
    }
  }

  async function fetchAll() {
    setJobStatus("running");
    setResults([]);
    try {
      const res = await fetch("/api/automation/fetch-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ useAi }),
      });
      const data = await res.json();
      setResults(data.results || []);
      setJobStatus("done");
      toast({
        title: `تم الاستيراد`,
        description: `أُضيف ${data.totalAdded} مقال جديد`,
      });
      loadStatus();
    } catch (err: any) {
      setJobStatus("error");
      toast({ title: "فشل الاستيراد", description: err.message, variant: "destructive" });
    }
  }

  async function fetchOne(sourceId: number) {
    setFetchingSourceId(sourceId);
    try {
      const res = await fetch(`/api/automation/fetch/${sourceId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ useAi }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast({
        title: `${data.sourceName}`,
        description: `أُضيف ${data.added} مقال جديد من ${data.total} خبر`,
      });
      setResults((prev) => {
        const filtered = prev.filter((r) => r.sourceId !== sourceId);
        return [data, ...filtered];
      });
      loadStatus();
    } catch (err: any) {
      toast({ title: "فشل الجلب", description: err.message, variant: "destructive" });
    } finally {
      setFetchingSourceId(null);
    }
  }

  // Load on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadStatus(); }, []);

  return (
    <AdminLayout>
      <div className="p-6 space-y-6 max-w-4xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">الأتمتة والاستيراد</h1>
            <p className="text-muted-foreground text-sm mt-1">استيراد أخبار من مصادر RSS مع إعادة صياغة بالذكاء الاصطناعي</p>
          </div>
          <Button variant="outline" size="sm" onClick={loadStatus} disabled={loadingStatus}>
            <RefreshCw className={`w-4 h-4 me-2 ${loadingStatus ? "animate-spin" : ""}`} />
            تحديث
          </Button>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Bot className={`w-8 h-8 ${status?.aiAvailable ? "text-green-500" : "text-muted-foreground"}`} />
                <div>
                  <p className="text-sm text-muted-foreground">الذكاء الاصطناعي</p>
                  <p className="font-bold">
                    {status?.aiAvailable ? (
                      <span className="text-green-600">متاح ✓</span>
                    ) : (
                      <span className="text-amber-600">يتطلب API key</span>
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Rss className="w-8 h-8 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">مصادر نشطة</p>
                  <p className="font-bold text-xl">{status?.activeSources ?? "—"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Globe className="w-8 h-8 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">مصادر بـ RSS</p>
                  <p className="font-bold text-xl">{status?.sourcesWithFeed ?? "—"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* AI Notice */}
        {status && !status.aiAvailable && (
          <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-start gap-3">
                <Bot className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                <div className="text-sm">
                  <p className="font-semibold text-amber-800 dark:text-amber-400">الذكاء الاصطناعي غير متاح حالياً</p>
                  <p className="text-amber-700 dark:text-amber-500 mt-1">
                    يمكن الاستيراد بدونه — المقالات ستُستورد بالنص الأصلي. لتفعيل إعادة الصياغة: فعّل تحقق الهاتف على Replit أو أضف <code className="bg-amber-100 px-1 rounded">OPENAI_API_KEY</code> في الإعدادات.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="w-4 h-4" />
              استيراد من جميع المصادر
            </CardTitle>
            <CardDescription>يجلب آخر الأخبار من كل مصادر RSS المفعّلة دفعة واحدة</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Switch
                id="use-ai"
                checked={useAi}
                onCheckedChange={setUseAi}
                disabled={!status?.aiAvailable}
              />
              <Label htmlFor="use-ai" className="cursor-pointer">
                إعادة صياغة بالذكاء الاصطناعي
                {!status?.aiAvailable && <span className="text-muted-foreground text-xs ms-2">(غير متاح)</span>}
              </Label>
            </div>

            <Button
              onClick={fetchAll}
              disabled={jobStatus === "running" || !status?.sourcesWithFeed}
              className="w-full"
            >
              {jobStatus === "running" ? (
                <><Loader2 className="w-4 h-4 me-2 animate-spin" />جاري الاستيراد...</>
              ) : (
                <><PlayCircle className="w-4 h-4 me-2" />استيراد الآن</>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Sources List */}
        {status?.sources && status.sources.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Rss className="w-4 h-4" />
                المصادر المتاحة
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {status.sources.map((src) => {
                const result = results.find((r) => r.sourceId === src.id);
                const isFetching = fetchingSourceId === src.id;
                return (
                  <div key={src.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3 min-w-0">
                      <Rss className="w-4 h-4 text-primary shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{src.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{src.feedUrl}</p>
                        {src.lastFetchedAt && (
                          <p className="text-xs text-muted-foreground">
                            آخر جلب: {new Date(src.lastFetchedAt).toLocaleString("ar-EG")}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ms-3">
                      <Badge variant="outline" className="text-xs">{src.lang.toUpperCase()}</Badge>
                      {result && !result.error && (
                        <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">
                          +{result.added}
                        </Badge>
                      )}
                      {result?.error && (
                        <XCircle className="w-4 h-4 text-destructive" />
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => fetchOne(src.id)}
                        disabled={isFetching || jobStatus === "running"}
                      >
                        {isFetching
                          ? <Loader2 className="w-3 h-3 animate-spin" />
                          : <RefreshCw className="w-3 h-3" />
                        }
                      </Button>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {results.length > 0 && jobStatus === "done" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                نتائج الاستيراد
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {results.map((r) => (
                <div key={r.sourceId} className="flex items-center justify-between text-sm p-2 border rounded">
                  <span className="font-medium">{r.sourceName}</span>
                  {r.error ? (
                    <Badge variant="destructive" className="text-xs">{r.error.substring(0, 40)}</Badge>
                  ) : (
                    <div className="flex gap-2">
                      <Badge className="bg-green-100 text-green-700 border-none text-xs">+{r.added} جديد</Badge>
                      <Badge variant="secondary" className="text-xs">{r.skipped} موجود</Badge>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* No sources notice */}
        {status && status.sourcesWithFeed === 0 && (
          <Card className="border-dashed">
            <CardContent className="pt-6 text-center text-muted-foreground space-y-2">
              <Rss className="w-10 h-10 mx-auto opacity-30" />
              <p>لا توجد مصادر بـ RSS Feed حالياً</p>
              <p className="text-sm">أضف Feed URL للمصادر من صفحة المصادر في الإدارة</p>
              <Button variant="outline" size="sm" asChild>
                <a href="/admin/sources">إدارة المصادر</a>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
