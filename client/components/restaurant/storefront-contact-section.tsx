// components/restaurant/storefront-contact-section.tsx
"use client";

import { Phone, Mail, MapPin, Globe } from "lucide-react";
import { DynamicRestaurantLocationMap } from "@/components/map/dynamic-restaurant-location-map";

interface StorefrontContactSectionProps {
  title: string;
  contact?: { phone?: string; email?: string; address?: string };
  socialLinks?: Record<string, string>;
  latitude?: number;
  longitude?: number;
  embedded?: boolean;
}

export function StorefrontContactSection({
  title,
  contact,
  socialLinks,
  latitude,
  longitude,
  embedded = false,
}: StorefrontContactSectionProps) {
  if (!contact && !socialLinks) return null;

  return (
    <div className={embedded ? "" : "max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 flex lg:justify-end"}>
      <div className={`bg-white border border-brand-line rounded-2xl p-5 space-y-4 -translate-y-1 shadow-lg shadow-brand-dark/10 w-full ${embedded ? "" : "lg:w-[460px]"}`}>
        <h2 className="font-display text-lg font-bold text-brand-dark">{title}</h2>

        {/* Contact Info */}
        {(contact?.phone || contact?.email || contact?.address) && (
          <div className="grid grid-cols-1 gap-3">
            {contact.phone && (
              <a
                href={`tel:${contact.phone}`}
                className="flex items-center gap-3 px-3.5 py-3 bg-brand-success/5 rounded-xl hover:bg-brand-success/10 transition-colors"
              >
                <Phone className="w-[18px] h-[18px] shrink-0 text-brand-success" />
                <span className="text-sm font-medium text-brand-dark">{contact.phone}</span>
              </a>
            )}
            {contact.email && (
              <a
                href={`mailto:${contact.email}`}
                className="flex items-center gap-3 px-3.5 py-3 bg-brand-gold/5 rounded-xl hover:bg-brand-gold/10 transition-colors"
              >
                <Mail className="w-[18px] h-[18px] shrink-0 text-brand-gold" />
                <span className="text-sm font-medium text-brand-dark">{contact.email}</span>
              </a>
            )}
            {contact.address && (
              <div className="flex items-center gap-3 px-3.5 py-3 bg-brand-dark/5 rounded-xl hover:bg-brand-dark/10 transition-colors">
                <MapPin className="w-[18px] h-[18px] shrink-0 text-brand-dark/60" />
                <span className="text-sm font-medium text-brand-dark">{contact.address}</span>
              </div>
            )}
          </div>
        )}

        {/* Social Links */}
        {socialLinks && Object.keys(socialLinks).length > 0 && (
          <div className="flex items-center gap-3 pt-4 border-t border-[#E8E7E2]">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#2B1410]/60">
              Follow us:
            </span>
            {socialLinks.facebook && (
              <a
                href={socialLinks.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-[#1877F2]/10 text-[#1877F2] flex items-center justify-center hover:bg-[#1877F2]/20 transition-colors"
                aria-label="Facebook"
              >
                <Globe size={18} />              </a>
            )}
            {socialLinks.instagram && (
              <a
                href={socialLinks.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-gradient-to-br from-[#F58529]/20 via-[#DD2A7B]/20 to-[#8134AF]/20 text-[#DD2A7B] flex items-center justify-center hover:from-[#F58529]/30 hover:via-[#DD2A7B]/30 hover:to-[#8134AF]/30 transition-colors"
                aria-label="Instagram"
              >
<Globe size={18} />               </a>
            )}
          </div>
        )}

        {/* Map */}
        {latitude && longitude && (
          <div className="pt-4 border-t border-[#E8E7E2]">
            <DynamicRestaurantLocationMap
              lat={latitude}
              lng={longitude}
            />
          </div>
        )}
      </div>
    </div>
  );
}