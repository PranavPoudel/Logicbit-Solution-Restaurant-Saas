"use client";

import { Phone, Mail, MapPin, Globe, Camera } from "lucide-react";

interface StorefrontAboutSectionProps {
  title: string;
  aboutText?: string;
  contact?: {
    phone?: string;
    email?: string;
    address?: string;
  };
  socialLinks?: Record<string, string>;
}

export function StorefrontAboutSection({
  title,
  aboutText,
  contact,
  socialLinks,
}: StorefrontAboutSectionProps) {
  // Only render if there is actual content to show
  if (!aboutText && !contact && !socialLinks) return null;

  return (
    <div className="max-w-4xl mx-auto px-4">
      <h2 className="font-display text-2xl font-bold text-[#2B1410] mb-6">
        {title}
      </h2>
      
      <div className="bg-white border border-[#E8E7E2] rounded-2xl p-6 sm:p-8 space-y-6">
        {/* About Text */}
        {aboutText && (
          <p className="text-[#2B1410]/80 leading-relaxed whitespace-pre-wrap">
            {aboutText}
          </p>
        )}

        {/* Contact Info */}
        {(contact?.phone || contact?.email || contact?.address) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-[#E8E7E2]">
            {contact.phone && (
              <div className="flex items-center gap-3 text-sm text-[#2B1410]/70">
                <Phone size={16} className="text-[#E3A008]" />
                <span>{contact.phone}</span>
              </div>
            )}
            {contact.email && (
              <div className="flex items-center gap-3 text-sm text-[#2B1410]/70">
                <Mail size={16} className="text-[#E3A008]" />
                <span>{contact.email}</span>
              </div>
            )}
            {contact.address && (
              <div className="flex items-center gap-3 text-sm text-[#2B1410]/70">
                <MapPin size={16} className="text-[#E3A008]" />
                <span>{contact.address}</span>
              </div>
            )}
          </div>
        )}

        {/* Social Links */}
        {(socialLinks?.facebook || socialLinks?.instagram) && (
          <div className="flex items-center gap-4 pt-4 border-t border-[#E8E7E2]">
            {socialLinks.facebook && (
              <a
                href={socialLinks.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#2B1410]/50 hover:text-[#1877F2] transition-colors"
                title="Facebook"
              >
                <Globe size={20} />
              </a>
            )}
            {socialLinks.instagram && (
              <a
                href={socialLinks.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#2B1410]/50 hover:text-[#E1306C] transition-colors"
                title="Instagram"
              >
                <Camera size={20} />
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}