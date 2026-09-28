import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#F8F9FA] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-[#E8E7E2] p-8 sm:p-12">
        <Link 
          href="/owner/register" 
          className="inline-flex items-center text-sm text-neutral-500 hover:text-[#1B2333] mb-6 transition-colors"
        >
          ← Back to Registration
        </Link>
        
        <h1 className="font-display text-3xl font-semibold text-[#1B2333] mb-2">
          Terms of Service
        </h1>
        <p className="text-sm text-neutral-500 mb-8">
          Last updated: {new Date().toLocaleDateString()}
        </p>

        <div className="space-y-6 text-neutral-700 leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-[#1B2333] mb-2">1. Acceptance of Terms</h2>
            <p>
              By accessing or using the LogicBit AI platform ("Service"), you agree to be bound by these Terms of Service. If you are registering on behalf of a restaurant or business, you represent that you have the authority to bind that entity to these terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#1B2333] mb-2">2. Use of the Service</h2>
            <p>
              LogicBit AI provides a multi-tenant SaaS platform enabling restaurants to deploy AI-powered digital assistants. You agree to use the Service only for lawful purposes and in accordance with these Terms. You are responsible for maintaining the confidentiality of your account credentials.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#1B2333] mb-2">3. AI Usage & Limitations</h2>
            <p>
              The Service utilizes an "AI Router" to answer customer queries. While we strive for accuracy, the AI is designed to prioritize structured database answers and may occasionally generate responses based on provided knowledge bases. 
              <strong> LogicBit AI will never claim to know real-world state (e.g., live table availability or real-time inventory) unless explicitly integrated with a verified third-party system.</strong> You are responsible for reviewing and correcting your restaurant's knowledge base and menu data.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#1B2333] mb-2">4. Tenant Data Isolation</h2>
            <p>
              We enforce strict multi-tenant data isolation. Your restaurant's data (menus, orders, customer interactions) is logically separated from other tenants. You may not attempt to access, scrape, or interfere with the data of any other restaurant on the platform.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#1B2333] mb-2">5. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, LogicBit AI and its affiliates shall not be liable for any indirect, incidental, or consequential damages arising from your use of the Service, including but not limited to loss of profits, data, or business interruption.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#1B2333] mb-2">6. Changes to Terms</h2>
            <p>
              We reserve the right to modify these Terms at any time. We will notify you of significant changes via email or through the dashboard. Continued use of the Service after such changes constitutes your acceptance of the new Terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#1B2333] mb-2">7. Contact</h2>
            <p>
              If you have any questions about these Terms, please contact us at <a href="mailto:support@logicbit.ai" className="text-[#0F6B5C] underline hover:text-[#1B2333]">support@logicbit.ai</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}