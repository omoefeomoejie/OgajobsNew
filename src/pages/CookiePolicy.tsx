import { PageWrapper } from '@/components/layout/PageWrapper';

const CookiePolicy = () => {
  return (
    <PageWrapper title="Cookie Policy" showChat={false}>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8 text-center">Cookie Policy</h1>
        
        <div className="prose prose-lg max-w-none">
          <p className="text-lg mb-6">
            Last updated: {new Date().toLocaleDateString()}
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. What Are Cookies</h2>
            <p className="mb-4">
              Cookies are small text files that are stored on your computer or mobile device 
              when you visit our website. They help us provide you with a better experience 
              by remembering your preferences and improving our services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Types of Cookies We Use</h2>
            
            <h3 className="text-xl font-semibold mb-3">Essential Cookies</h3>
            <p className="mb-4">
              These cookies are necessary for the website to function properly. They enable 
              core functionality such as security, network management, and accessibility.
            </p>

            <h3 className="text-xl font-semibold mb-3">Performance Cookies</h3>
            <p className="mb-4">
              These cookies help us understand how visitors interact with our website by 
              collecting and reporting information anonymously.
            </p>

            <h3 className="text-xl font-semibold mb-3">Functional Cookies</h3>
            <p className="mb-4">
              These cookies enable the website to provide enhanced functionality and 
              personalization, such as remembering your location preference.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. How We Use Cookies</h2>
            <p className="mb-4">We use cookies to:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Keep you signed in to your account</li>
              <li>Remember your preferences and settings</li>
              <li>Improve website performance and user experience</li>
              <li>Analyze website traffic and usage patterns</li>
              <li>Prevent fraud and enhance security</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Managing Cookies</h2>
            <p className="mb-4">
              You can control and manage cookies in various ways:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>Browser settings: Most browsers allow you to block or delete cookies</li>
              <li>Opt-out tools: You can use industry opt-out tools for advertising cookies</li>
              <li>Mobile settings: Mobile devices have settings to control cookie behavior</li>
            </ul>
            <p className="mb-4">
              Please note that blocking or deleting cookies may affect your experience on our website.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Third-Party Cookies</h2>
            <p className="mb-4">
              We may use third-party services that place cookies on your device. These include:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>Google Analytics for website analytics</li>
              <li>Payment processors for secure transactions</li>
              <li>Social media platforms for content sharing</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Updates to This Policy</h2>
            <p className="mb-4">
              We may update this Cookie Policy from time to time. Any changes will be posted 
              on this page with an updated revision date.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Contact Us</h2>
            <p className="mb-4">
              If you have questions about our use of cookies, please contact us at:
            </p>
            <p className="mb-2">Email: privacy@ogajobs.com</p>
            <p className="mb-2">Phone: +234 700 OGAJOBS</p>
            <p className="mb-2">Address: Lagos, Nigeria</p>
          </section>
        </div>
      </div>
    </PageWrapper>
  );
};

export default CookiePolicy;