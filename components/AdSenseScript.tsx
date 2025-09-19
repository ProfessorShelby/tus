'use client';

import Script from 'next/script';

export function AdSenseScript() {
  const adsenseClient = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;

  if (!adsenseClient) {
    return null;
  }

  return (
    <Script
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClient}`}
      strategy="afterInteractive"
      crossOrigin="anonymous"
    />
  );
}
