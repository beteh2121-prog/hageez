import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { getAllSettings, getPublishedPages } from '@/lib/supabase/settings';

export const revalidate = 300; // re-fetch settings every 5 minutes

export default async function StorefrontLayout({ children }: { children: React.ReactNode }) {
  const [settings, extraPages] = await Promise.all([
    getAllSettings(),
    getPublishedPages(),
  ]);

  return (
    <>
      <Navbar siteSettings={settings.site} extraPages={extraPages} />
      <main className="flex min-h-screen flex-col pt-16">{children}</main>
      <Footer
        siteSettings={settings.site}
        footerSettings={settings.footer}
        extraPages={extraPages}
      />
    </>
  );
}
