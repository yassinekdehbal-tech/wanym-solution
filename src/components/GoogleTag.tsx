import Script from "next/script";
import { env } from "@/lib/env";

/** Google Ads / gtag.js. Loaded after hydration so it never blocks LCP. Consent Mode v2: everything denied
 * until the visitor accepts (AdTags sends the update), so the tag runs cookieless by default. */
export function GoogleTag() {
  if (!env.gtagId) return null;
  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${env.gtagId}`} strategy="afterInteractive" />
      <Script id="gtag-init" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('consent', 'default', { ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', analytics_storage: 'denied', wait_for_update: 500 });
gtag('js', new Date());
gtag('config', '${env.gtagId}', { allow_enhanced_conversions: true });`}
      </Script>
    </>
  );
}
