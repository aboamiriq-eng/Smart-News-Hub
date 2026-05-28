import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useTranslation } from "@/hooks/use-translation";
import { 
  LayoutDashboard, 
  FileText, 
  Tags, 
  Rss, 
  Megaphone, 
  BarChart, 
  Settings,
  LogOut,
  Globe
} from "lucide-react";
import { Button } from "./ui/button";

export function AdminLayout({ children }: { children: ReactNode }) {
  const { t, lang, setLang } = useTranslation();
  const [location] = useLocation();

  const navItems = [
    { href: "/admin", icon: LayoutDashboard, label: t('admin.dashboard') },
    { href: "/admin/articles", icon: FileText, label: t('admin.articles') },
    { href: "/admin/categories", icon: Tags, label: t('admin.categories') },
    { href: "/admin/sources", icon: Rss, label: t('admin.sources') },
    { href: "/admin/advertisements", icon: Megaphone, label: t('admin.advertisements') },
    { href: "/admin/analytics", icon: BarChart, label: t('admin.analytics') },
    { href: "/admin/settings", icon: Settings, label: t('admin.settings') },
  ];

  return (
    <div className="min-h-screen bg-muted/30 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r flex flex-col shrink-0">
        <div className="h-16 flex items-center px-6 border-b">
          <Link href="/" className="font-bold text-xl font-serif text-primary">
            {lang === 'ar' ? 'النبأ' : 'AL NABA'} <span className="text-muted-foreground text-sm font-sans font-normal ml-2">Admin</span>
          </Link>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = item.href === '/admin' ? location === '/admin' : location.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href}>
                <Button 
                  variant={isActive ? "secondary" : "ghost"} 
                  className={`w-full justify-start ${isActive ? 'font-bold' : ''}`}
                >
                  <item.icon className={`w-4 h-4 ${lang === 'ar' ? 'ml-3' : 'mr-3'}`} />
                  {item.label}
                </Button>
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t space-y-2">
          <Button variant="outline" className="w-full justify-start" onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}>
            <Globe className={`w-4 h-4 ${lang === 'ar' ? 'ml-3' : 'mr-3'}`} />
            {lang === 'ar' ? 'English' : 'العربية'}
          </Button>
          <Link href="/">
            <Button variant="ghost" className="w-full justify-start text-muted-foreground">
              <LogOut className={`w-4 h-4 ${lang === 'ar' ? 'ml-3' : 'mr-3'} rotate-180`} />
              Back to Site
            </Button>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-card border-b flex items-center px-8 shrink-0">
          <h1 className="text-lg font-semibold">
            {navItems.find(i => i.href === '/admin' ? location === '/admin' : location.startsWith(i.href))?.label}
          </h1>
        </header>
        <div className="flex-1 overflow-auto p-8">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
