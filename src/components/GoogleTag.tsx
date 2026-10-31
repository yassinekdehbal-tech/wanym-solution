import Script from "next/script";
import { env } from "@/lib/env";

/** Google Ads / gtag.js. Loaded after hydration so it never blocks LCP. */
export function GoogleTag() {
  if (!env.gtagId) return null;
  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${env.gtagId}`} strategy="afterInteractive" />
      <Script id="gtag-init" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${env.gtagId}', { allow_enhanced_conversions: true });`}
      </Script>
    </>
  );
}
