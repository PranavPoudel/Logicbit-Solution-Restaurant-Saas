"use client";

import { Phone, Mail, MapPin, Globe, Camera } from "lucide-react";
import type { PublicConfig } from "@/lib/api/public-storefront";

interface StorefrontAboutSectionProps {
  config: PublicConfig;
}

export function StorefrontAboutSection({ config }: StorefrontAboutSectionProps) {
  const hasContent = config.aboutText || config.contactPhone || config.contactEmail || config.contactAddress;
  if (!hasContent) return null;

  return (
    <div className="bg-white rounded-2xl border border-[#E8E7E2] p-6 space-y-6">
      <h2 className="font-display font-semibold text-lg text-[#17181C]">About & Contact</h2>
      
      {config.aboutText && (
        <p className="text-sm text-neutral-600 leading-relaxed whitespace-pre-line">
          {config.aboutText}
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-neutral-100">
        {config.contactPhone && (
          <div className="flex items-center gap-3 text-sm text-neutral-600">
            <Phone size={16} className="text-[#0F6B5C]" />
            <span>{config.contactPhone}</span>
          </div>
        )}
        {config.contactEmail && (
          <div className="flex items-center gap-3 text-sm text-neutral-600">
            <Mail size={16} className="text-[#0F6B5C]" />
            <span>{config.contactEmail}</span>
          </div>
        )}
        {config.contactAddress && (
          <div className="flex items-center gap-3 text-sm text-neutral-600">
            <MapPin size={16} className="text-[#0F6B5C]" />
            <span>{config.contactAddress}</span>
          </div>
        )}
      </div>

      {(config.socialLinks?.facebook || config.socialLinks?.instagram) && (
        <div className="flex items-center gap-3 pt-4 border-t border-neutral-100">
          {config.socialLinks.facebook && (
            <a 
              href={config.socialLinks.facebook} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-neutral-400 hover:text-[#1877F2] transition-colors" 
              title="Facebook"
            >
              <Globe size={20} />
            </a>
          )}
          {config.socialLinks.instagram && (
            <a 
              href={config.socialLinks.instagram} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-neutral-400 hover:text-[#E1306C] transition-colors" 
              title="Instagram"
            >
              <Camera size={20} />
            </a>
          )}
        </div>
      )}
    </div>
  );
}