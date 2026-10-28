import Link from "next/link";
import { theme } from "@/config/theme";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-brand-surface py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-brand-line p-8 sm:p-12">
        <Link 
          href="/owner/register" 
          className="inline-flex items-center text-sm text-neutral-500 hover:text-brand-ink mb-6 transition-colors"
        >
          ← Back to Registration
        </Link>
        
        <h1 className="font-display text-3xl font-semibold text-brand-ink mb-2">
          Privacy Policy
        </h1>
        <p className="text-sm text-neutral-500 mb-8">
          Last updated: {new Date().toLocaleDateString()}
        </p>

        <div className="space-y-6 text-neutral-700 leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-brand-ink mb-2">1. Introduction</h2>
            <p>
              {theme.brand.name} AI ("we", "us", or "our") respects your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our restaurant management and AI chatbot platform.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-brand-ink mb-2">2. Information We Collect</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Restaurant Data:</strong> Business name, address, contact info, menu items, pricing, and operational hours.</li>
              <li><strong>Account Data:</strong> Name, email address, phone number, and encrypted password hashes for platform access.</li>
              <li><strong>Usage Data:</strong> Chat logs, AI token usage, order requests, and reservation inquiries generated through the chatbot.</li>
              <li><strong>Technical Data:</strong> IP addresses, browser types, and device information for security and analytics.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-brand-ink mb-2">3. How We Use Your Information</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>To provide, maintain, and improve the {theme.brand.name} AI Service.</li>
              <li>To power the AI Router, ensuring customer queries are answered accurately using your specific restaurant data.</li>
              <li>To process billing, manage subscriptions, and send important service notifications.</li>
              <li>To enforce our multi-tenant security architecture and prevent unauthorized access.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-brand-ink mb-2">4. Data Security & Tenant Isolation</h2>
            <p>
              We implement strict technical and organizational measures to protect your data. <strong>Every query is scoped by a unique restaurant ID at the data-access layer.</strong> Your restaurant's data is logically isolated and will never be shared with or exposed to other tenants on the platform. AI prompts are strictly filtered to prevent cross-tenant data leakage.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-brand-ink mb-2">5. Third-Party Services</h2>
            <p>
              We may use trusted third-party services for specific functions, such as payment processing, email delivery, or AI model hosting (e.g., OpenAI-compatible APIs). These providers are contractually obligated to keep your information confidential and use it only for the services we have engaged them to provide.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-brand-ink mb-2">6. Your Rights</h2>
            <p>
              Depending on your jurisdiction, you may have the right to access, correct, or delete your personal data. Restaurant owners can manage most of their data directly through the {theme.brand.name} Dashboard. For further requests, please contact us.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-brand-ink mb-2">7. Contact Us</h2>
            <p>
              If you have any questions or concerns about this Privacy Policy, please reach out to us at <a href="mailto:privacy@logicbit.ai" className="text-brand-success underline hover:text-brand-ink">privacy@logicbit.ai</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}