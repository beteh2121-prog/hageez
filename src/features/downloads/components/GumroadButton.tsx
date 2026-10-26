'use client';

import { useEffect } from 'react';
import { ExternalLink } from 'lucide-react';

interface GumroadButtonProps {
  url: string;
  label: string;
}

/**
 * Gumroad's documented "overlay": a link with class `gumroad-button` plus
 * their script opens Gumroad's checkout as a popup on top of this page, so
 * the customer never leaves the site. If the script is blocked or fails, the
 * link simply opens the Gumroad product page in a new tab — it cannot break.
 *
 * The script is re-added on mount so the overlay also works after
 * client-side navigation (it only scans the page for buttons when it runs).
 */
function isGumroadUrl(url: string): boolean {
  try {
    const { protocol, hostname } = new URL(url);
    return protocol === 'https:' && /(^|\.)(gumroad\.com|gum\.co)$/i.test(hostname);
  } catch {
    return false;
  }
}

export default function GumroadButton({ url, label }: GumroadButtonProps) {
  const overlay = isGumroadUrl(url);

  useEffect(() => {
    if (!overlay) return;
    const script = document.createElement('script');
    script.src = 'https://gumroad.com/js/gumroad.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      script.remove();
    };
  }, [url, overlay]);

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`${overlay ? 'gumroad-button ' : ''}!inline-flex !items-center !gap-2 !rounded-[2px] !bg-gold !px-6 !py-2.5 !text-sm !font-medium !text-cream hover:!bg-gold-dark`}
    >
      <ExternalLink className="h-4 w-4" />
      {label}
    </a>
  );
}
