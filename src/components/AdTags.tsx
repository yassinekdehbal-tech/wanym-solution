"use client";

import { usePathname } from "next/navigation";
import Script from "next/script";
import { useEffect, useState } from "react";
import { CONSENT_EVENT, hasAdsConsent } from "@/lib/consent";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    _fbq?: unknown;
    lintrk?: (...args: unknown[]) => void;
    _linkedin_partner_id?: string;
    _linkedin_data_partner_ids?: string[];
  }
}

/**
 * Balises publicitaires soumises au consentement : Google Consent Mode v2 (mise à jour
 * « granted » après accord ; la balise gtag elle-même reste chargée en mode « denied »,
 * sans cookie), pixel Meta et LinkedIn Insight Tag (chargés seulement après accord).
 */
export function AdTags({ metaPixelId, linkedinPartnerId }: { metaPixelId: string; linkedinPartnerId: string }) {
  const [granted, setGranted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const apply = (ads: boolean) => {
      setGranted(ads);
      window.gtag?.("consent", "update", {
        ad_storage: ads ? "granted" : "denied",
        ad_user_data: ads ? "granted" : "denied",
        ad_personalization: ads ? "granted" : "denied",
        analytics_storage: ads ? "granted" : "denied",
      });
    };
    apply(hasAdsConsent());
    const onChange = (e: Event) => apply(Boolean((e as CustomEvent<{ ads: boolean }>).detail?.ads));
    window.addEventListener(CONSENT_EVENT, onChange);
    return () => window.removeEventListener(CONSENT_EVENT, onChange);
  }, []);

  // Meta : PageView à chaque navigation (l'App Router ne recharge pas la page).
  useEffect(() => {
    if (granted && metaPixelId) window.fbq?.("track", "PageView");
  }, [pathname, granted, metaPixelId]);

  if (!granted) return null;
  return (
    <>
      {metaPixelId && (
        <Script id="meta-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init','${metaPixelId}');fbq('track','PageView');`}
        </Script>
      )}
      {linkedinPartnerId && (
        <Script id="linkedin-insight" strategy="afterInteractive">
          {`window._linkedin_partner_id='${linkedinPartnerId}';window._linkedin_data_partner_ids=window._linkedin_data_partner_ids||[];window._linkedin_data_partner_ids.push(window._linkedin_partner_id);
(function(l){if(!l){window.lintrk=function(a,b){window.lintrk.q.push([a,b])};window.lintrk.q=[]}var s=document.getElementsByTagName('script')[0];var b=document.createElement('script');b.type='text/javascript';b.async=true;b.src='https://snap.licdn.com/li.lms-analytics/insight.min.js';s.parentNode.insertBefore(b,s)})(window.lintrk);`}
        </Script>
      )}
    </>
  );
}
