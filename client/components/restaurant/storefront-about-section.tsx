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
    <div className="bg-white rounded-2xl border border-[#2B1410]/8 p-6 space-y-6">
      <h2 className="font-serif font-semibold text-lg text-[#2B1410]">About & Contact</h2>
      
      {config.aboutText && (
        <p className="text-sm text-[#2B1410]/65 leading-relaxed whitespace-pre-line">
          {config.aboutText}
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-[#2B1410]/8">
        {config.contactPhone && (
          <div className="flex items-center gap-3 text-sm text-[#2B1410]/65">
            <Phone size={16} className="text-[#C0392B]" />
            <span>{config.contactPhone}</span>
          </div>
        )}
        {config.contactEmail && (
          <div className="flex items-center gap-3 text-sm text-[#2B1410]/65">
            <Mail size={16} className="text-[#C0392B]" />
            <span>{config.contactEmail}</span>
          </div>
        )}
        {config.contactAddress && (
          <div className="flex items-center gap-3 text-sm text-[#2B1410]/65">
            <MapPin size={16} className="text-[#C0392B]" />
            <span>{config.contactAddress}</span>
          </div>
        )}
      </div>

      {(config.socialLinks?.facebook || config.socialLinks?.instagram) && (
        <div className="flex items-center gap-3 pt-4 border-t border-[#2B1410]/8">
          {config.socialLinks.facebook && (
            <a 
              href={config.socialLinks.facebook} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-[#2B1410]/35 hover:text-[#1877F2] transition-colors" 
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
              className="text-[#2B1410]/35 hover:text-[#E1306C] transition-colors" 
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