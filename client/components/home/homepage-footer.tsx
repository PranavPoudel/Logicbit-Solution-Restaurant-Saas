"use client";

import Link from "next/link";
import { Phone, Mail, Camera, Globe } from "lucide-react";

export function HomepageFooter() {
  return (
    <footer className="bg-[#2B1410] text-[#FDF6EC] mt-12">
      <div className="max-w-6xl mx-auto px-5 py-12 grid sm:grid-cols-4 gap-8">
        <div>
          <h3 className="font-serif text-xl mb-2">LogicBit</h3>
          <p className="text-[#FDF6EC]/55 text-sm">
            Order the good stuff, delivered fast, across Kathmandu.
          </p>
        </div>

        <div>
          <h4 className="text-xs uppercase tracking-wide text-[#FDF6EC]/40 mb-3">
            Company
          </h4>
          <div className="space-y-2 text-sm text-[#FDF6EC]/70">
            <Link href="/for-restaurants" className="block hover:text-[#FDF6EC]">
              For Restaurants
            </Link>
            <Link href="/about" className="block hover:text-[#FDF6EC]">
              About Us
            </Link>
            <Link href="/careers" className="block hover:text-[#FDF6EC]">
              Careers
            </Link>
          </div>
        </div>

        <div>
          <h4 className="text-xs uppercase tracking-wide text-[#FDF6EC]/40 mb-3">
            Support
          </h4>
          <div className="space-y-2 text-sm text-[#FDF6EC]/70">
            <Link href="/help" className="block hover:text-[#FDF6EC]">
              Help Center
            </Link>
            <Link href="/terms" className="block hover:text-[#FDF6EC]">
              Terms of Service
            </Link>
            <Link href="/privacy" className="block hover:text-[#FDF6EC]">
              Privacy Policy
            </Link>
          </div>
        </div>

        <div>
          <h4 className="text-xs uppercase tracking-wide text-[#FDF6EC]/40 mb-3">
            Contact
          </h4>
          <div className="space-y-2 text-sm text-[#FDF6EC]/70">
            <div className="flex items-center gap-2">
              <Phone size={14} className="text-[#C0392B]" />
              <span>+977 1-4000000</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail size={14} className="text-[#C0392B]" />
              <span>support@logicbit.com</span>
            </div>
            <div className="flex items-center gap-3 mt-3">
              <Globe size={18} className="text-[#FDF6EC]/50 hover:text-[#FDF6EC] cursor-pointer" />
              <Camera size={18} className="text-[#FDF6EC]/50 hover:text-[#FDF6EC] cursor-pointer" />
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-[#FDF6EC]/10 py-4 text-center text-xs text-[#FDF6EC]/40">
        LogicBit. All rights reserved.
      </div>
    </footer>
  );
}