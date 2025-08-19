import { PageWrapper } from '@/components/layout/PageWrapper';

const TermsOfService = () => {
  return (
    <PageWrapper title="Terms of Service" showChat={false}>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8 text-center">Terms of Service</h1>
        
        <div className="prose prose-lg max-w-none">
          <p className="text-lg mb-6">
            Last updated: {new Date().toLocaleDateString()}
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
            <p className="mb-4">
              By accessing and using OgaJobs, you accept and agree to be bound by the terms 
              and provision of this agreement.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Service Description</h2>
            <p className="mb-4">
              OgaJobs is a platform that connects customers with verified service providers 
              (artisans) across Nigeria. We facilitate the booking and payment process but 
              do not directly provide services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. User Responsibilities</h2>
            <p className="mb-4">Users agree to:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Provide accurate and truthful information</li>
              <li>Use the platform for lawful purposes only</li>
              <li>Treat all users with respect and professionalism</li>
              <li>Pay for services as agreed</li>
              <li>Report any issues or disputes promptly</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibent mb-4">4. Artisan Responsibilities</h2>
            <p className="mb-4">Service providers agree to:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Maintain proper licenses and certifications</li>
              <li>Provide services with professional competence</li>
              <li>Honor booking commitments</li>
              <li>Complete background verification</li>
              <li>Maintain appropriate insurance coverage</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Payment Terms</h2>
            <p className="mb-4">
              Payments are processed securely through our platform. Funds are held in escrow 
              until service completion and customer satisfaction.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Dispute Resolution</h2>
            <p className="mb-4">
              In case of disputes, users should first attempt to resolve the issue directly. 
              If unsuccessful, OgaJobs provides mediation services to help reach a fair resolution.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Limitation of Liability</h2>
            <p className="mb-4">
              OgaJobs acts as an intermediary platform. We are not liable for the quality, 
              safety, or legality of services provided by artisans.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. Contact Information</h2>
            <p className="mb-4">
              For questions about these terms, contact us at:
            </p>
            <p className="mb-2">Email: legal@ogajobs.com</p>
            <p className="mb-2">Phone: +234 700 OGAJOBS</p>
            <p className="mb-2">Address: Lagos, Nigeria</p>
          </section>
        </div>
      </div>
    </PageWrapper>
  );
};

export default TermsOfService;