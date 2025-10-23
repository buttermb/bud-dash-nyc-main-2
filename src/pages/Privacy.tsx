import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

const Privacy = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
        
        <div className="prose prose-slate max-w-none space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Information We Collect</h2>
            <p className="text-muted-foreground">
              We collect information you provide directly to us, including your name, email address, phone number, 
              delivery address, and age verification details. We also collect payment information and order history.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. How We Use Your Information</h2>
            <p className="text-muted-foreground">
              We use your information to process orders, verify your age, communicate with you about your orders, 
              improve our service, comply with legal requirements, and send promotional communications (with your consent).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. Information Sharing</h2>
            <p className="text-muted-foreground">
              We share your information with licensed partner shops and couriers to fulfill your orders. We may also 
              share information with service providers who assist us in operating our platform, and with law enforcement 
              when required by law.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Age Verification</h2>
            <p className="text-muted-foreground">
              To comply with New York state law, we verify that all customers are 21 years or older. Your age 
              verification information is stored securely and used only for compliance purposes. Photo ID verification 
              is required at delivery.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Data Security</h2>
            <p className="text-muted-foreground">
              We implement industry-standard security measures to protect your personal information. However, no 
              method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Cookies and Tracking</h2>
            <p className="text-muted-foreground">
              We use cookies and similar technologies to enhance your experience, analyze site usage, and personalize 
              content. You can control cookies through your browser settings.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Your Rights</h2>
            <p className="text-muted-foreground">
              You have the right to access, correct, or delete your personal information. You can also opt out of 
              marketing communications at any time. To exercise these rights, contact us at privacy@newyorkminutenyc.com.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Data Retention</h2>
            <p className="text-muted-foreground">
              We retain your information for as long as necessary to provide our services and comply with legal 
              obligations. Order records are retained for regulatory compliance purposes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">9. Children's Privacy</h2>
            <p className="text-muted-foreground">
              Our service is not intended for individuals under 21 years of age. We do not knowingly collect 
              information from anyone under 21.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">10. Changes to This Policy</h2>
            <p className="text-muted-foreground">
              We may update this Privacy Policy from time to time. We will notify you of significant changes by 
              posting the new policy on this page and updating the "Last Updated" date.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">11. Contact Us</h2>
            <p className="text-muted-foreground">
              For questions about this Privacy Policy, please contact us at privacy@newyorkminutenyc.com or 
              visit our support page.
            </p>
          </section>

          <p className="text-sm text-muted-foreground mt-8">
            Last Updated: January 2025
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Privacy;
