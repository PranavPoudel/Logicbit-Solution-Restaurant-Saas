 "use client";

import { Phone, Mail, MapPin, Globe, Camera } from "lucide-react";
import type { PublicConfig } from "@/lib/api/public-storefront";
import { theme } from "@/config/theme";

interface StorefrontAboutSectionProps {
  config: PublicConfig;
}

export function StorefrontAboutSection({ config }: StorefrontAboutSectionProps) {
  const hasContent = config.aboutText || config.contactPhone || config.contactEmail || config.contactAddress;
  if (!hasContent) return null;

  return (
    <div className="bg-white rounded-2xl p-6 space-y-6" style={{ border: `1px solid ${theme.colors.dark}14` }}>
      <h2 className="font-serif font-semibold text-lg" style={{ color: theme.colors.dark }}>
        {theme.content.aboutContactHeading}
      </h2>

      {config.aboutText && (
        <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: `${theme.colors.dark}A6` }}>
          {config.aboutText}
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4" style={{ borderTop: `1px solid ${theme.colors.dark}14` }}>
        {config.contactPhone && (
          <div className="flex items-center gap-3 text-sm" style={{ color: `${theme.colors.dark}A6` }}>
            <Phone size={16} style={{ color: theme.colors.primary }} />
            <span>{config.contactPhone}</span>
          </div>
        )}
        {config.contactEmail && (
          <div className="flex items-center gap-3 text-sm" style={{ color: `${theme.colors.dark}A6` }}>
            <Mail size={16} style={{ color: theme.colors.primary }} />
            <span>{config.contactEmail}</span>
          </div>
        )}
        {config.contactAddress && (
          <div className="flex items-center gap-3 text-sm" style={{ color: `${theme.colors.dark}A6` }}>
            <MapPin size={16} style={{ color: theme.colors.primary }} />
            <span>{config.contactAddress}</span>
          </div>
        )}
      </div>

      {(config.socialLinks?.facebook || config.socialLinks?.instagram) && (
        <div className="flex items-center gap-3 pt-4" style={{ borderTop: `1px solid ${theme.colors.dark}14` }}>
          {config.socialLinks.facebook && (
            <a href={config.socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="hover:text-[#1877F2] transition-colors" style={{ color: `${theme.colors.dark}59` }} title="Facebook">
              <Globe size={20} />
            </a>
          )}
          {config.socialLinks.instagram && (
            <a href={config.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="hover:text-[#E1306C] transition-colors" style={{ color: `${theme.colors.dark}59` }} title="Instagram">
              <Camera size={20} />
            </a>
          )}
        </div>
      )}
    </div>
  );
}