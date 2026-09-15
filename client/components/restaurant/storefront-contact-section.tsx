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
}

export function StorefrontContactSection({
  title,
  contact,
  socialLinks,
  latitude,
  longitude,
}: StorefrontContactSectionProps) {
  if (!contact && !socialLinks) return null;

  return (
    <div className="max-w-4xl mx-auto px-4">
      <h2 className="font-display text-2xl font-bold text-[#2B1410] mb-6">{title}</h2>
      
      <div className="bg-white border border-[#E8E7E2] rounded-2xl p-6 sm:p-8 space-y-6">
        {/* Contact Info */}
        {(contact?.phone || contact?.email || contact?.address) && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {contact.phone && (
              <a
                href={`tel:${contact.phone}`}
                className="flex items-center gap-3 p-4 bg-[#0F6B5C]/5 rounded-xl hover:bg-[#0F6B5C]/10 transition-colors"
              >
                <Phone className="w-5 h-5 text-[#0F6B5C]" />
                <span className="text-sm font-medium text-[#2B1410]">{contact.phone}</span>
              </a>
            )}
            {contact.email && (
              <a
                href={`mailto:${contact.email}`}
                className="flex items-center gap-3 p-4 bg-[#E3A008]/5 rounded-xl hover:bg-[#E3A008]/10 transition-colors"
              >
                <Mail className="w-5 h-5 text-[#E3A008]" />
                <span className="text-sm font-medium text-[#2B1410]">{contact.email}</span>
              </a>
            )}
            {contact.address && (
              <div className="flex items-center gap-3 p-4 bg-[#2B1410]/5 rounded-xl">
                <MapPin className="w-5 h-5 text-[#2B1410]/60" />
                <span className="text-sm font-medium text-[#2B1410]">{contact.address}</span>
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
              address={contact?.address}
            />
          </div>
        )}
      </div>
    </div>
  );
}