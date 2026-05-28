import { useTranslation } from "@/hooks/use-translation";
import { Link } from "wouter";

export function Footer() {
  const { t, lang } = useTranslation();

  return (
    <footer className="border-t bg-card mt-auto">
      <div className="container py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <h3 className="text-lg font-bold font-serif text-primary">
              {lang === 'ar' ? 'النبأ' : 'AL NABA'}
            </h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              {lang === 'ar' 
                ? 'منصة إخبارية ذكية تواكب الأحداث لحظة بلحظة بمصداقية واحترافية.' 
                : 'A smart news platform keeping you updated with credibility and professionalism.'}
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">{lang === 'ar' ? 'أقسام' : 'Sections'}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/" className="hover:text-primary">{t('nav.home')}</Link></li>
              <li><Link href="/category/politics" className="hover:text-primary">{lang === 'ar' ? 'سياسة' : 'Politics'}</Link></li>
              <li><Link href="/category/economy" className="hover:text-primary">{lang === 'ar' ? 'اقتصاد' : 'Economy'}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">{lang === 'ar' ? 'عن المنصة' : 'About'}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><span className="hover:text-primary cursor-pointer">{lang === 'ar' ? 'من نحن' : 'About Us'}</span></li>
              <li><span className="hover:text-primary cursor-pointer">{lang === 'ar' ? 'اتصل بنا' : 'Contact Us'}</span></li>
              <li><span className="hover:text-primary cursor-pointer">{lang === 'ar' ? 'سياسة الخصوصية' : 'Privacy Policy'}</span></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">{lang === 'ar' ? 'النشرة البريدية' : 'Newsletter'}</h4>
            <p className="text-sm text-muted-foreground mb-4">
              {lang === 'ar' ? 'اشترك ليصلك كل جديد' : 'Subscribe to our newsletter'}
            </p>
            <div className="flex gap-2">
              <input 
                type="email" 
                placeholder={lang === 'ar' ? 'البريد الإلكتروني' : 'Email address'} 
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              />
              <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2">
                {lang === 'ar' ? 'اشترك' : 'Subscribe'}
              </button>
            </div>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} AL NABA News. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
