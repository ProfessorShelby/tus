'use client';

import { useEffect } from 'react';

interface AdsSlotProps {
  slot: string;
  format?: string;
  responsive?: boolean;
  className?: string;
}

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

export function AdsSlot({ 
  slot, 
  format = 'auto',
  responsive = true,
  className = '' 
}: AdsSlotProps) {
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;

  useEffect(() => {
    if (client && window.adsbygoogle) {
      try {
        window.adsbygoogle.push({});
      } catch (error) {
        console.error('AdSense error:', error);
      }
    }
  }, [client]);

  // Don't render anything if AdSense is not configured
  if (!client) {
    return (
      <div className={`bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center ${className}`}>
        <p className="text-gray-500 text-sm">
          Reklam Alanı
          <br />
          <span className="text-xs">
            (Geliştirme modunda görüntülenmez)
          </span>
        </p>
      </div>
    );
  }

  return (
    <div className={className}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={client}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive}
      />
    </div>
  );
}
