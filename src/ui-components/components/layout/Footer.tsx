/**
 * Footer component for VORTEX PROTOCOL
 * Contains links to legal pages, social links, and trust copy
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { ExternalLink, Shield, Lock, FileText } from 'lucide-react';

const footerLinks = {
  product: [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Scan', href: '/scan' },
    { label: 'Documentation', href: 'https://docs.vortex.xyz', isExternal: true },
  ],
  legal: [
    { label: 'Security', href: '/security', icon: Shield },
    { label: 'Privacy', href: '/privacy', icon: Lock },
    { label: 'Terms', href: '/terms', icon: FileText },
  ],
  social: [
    { label: 'X (Twitter)', href: 'https://twitter.com/vortexprotocol', isExternal: true },
    { label: 'Farcaster', href: 'https://warpcast.com/vortex', isExternal: true },
    { label: 'Discord', href: 'https://discord.gg/vortex', isExternal: true },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <span className="text-white font-bold text-sm">V</span>
              </div>
              <span className="font-bold text-lg text-foreground tracking-tight">VORTEX</span>
            </div>
            <p className="text-sm text-muted-foreground max-w-xs">
              Portfolio hygiene, reimagined. Scan, classify, and consolidate dust—Base-first, risk-aware, gasless.
            </p>
            {/* Trust badges */}
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-accent/10 text-accent text-xs font-medium">
                <Shield className="w-3 h-3" />
                Non-custodial
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-primary/10 text-primary text-xs font-medium">
                <Lock className="w-3 h-3" />
                Audited
              </span>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Product</h4>
            <ul className="space-y-3">
              {footerLinks.product.map(link => (
                <li key={link.label}>
                  {link.isExternal ? (
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Legal</h4>
            <ul className="space-y-3">
              {footerLinks.legal.map(link => {
                const Icon = link.icon;
                return (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Icon className="w-4 h-4" />
                      {link.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Social Links */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Community</h4>
            <ul className="space-y-3">
              {footerLinks.social.map(link => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} VORTEX PROTOCOL. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">
            Built on Base. Powered by Account Abstraction.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;

