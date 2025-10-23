import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Leaf, Shield, Truck, Users } from "lucide-react";

const About = () => {
  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Navigation />
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-6">About New York Minute NYC</h1>
          
          <p className="text-lg text-muted-foreground mb-12">
            New York Minute NYC is New York's trusted premium flower delivery service. We partner with licensed NYC cultivators
            to bring you the finest selection of flower, pre-rolls, and edibles—delivered fast and discreetly to 
            Manhattan, Brooklyn, and Queens.
          </p>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Leaf className="w-6 h-6 text-primary" />
                </div>
              <h2 className="text-xl font-semibold">Premium Quality</h2>
              </div>
              <p className="text-muted-foreground">
                We work exclusively with licensed NYC cultivators who grow premium indoor flower. Every product 
                is third-party lab tested for potency, purity, and contaminants before it reaches you.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
              <h2 className="text-xl font-semibold">Licensed & Compliant</h2>
              </div>
              <p className="text-muted-foreground">
                Licensed Cannabinoid Hemp Retailer by the NY Office of Cannabis Management. All products are 
                derived from hemp and comply with federal and state regulations.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Truck className="w-6 h-6 text-primary" />
                </div>
              <h2 className="text-xl font-semibold">Fast Delivery</h2>
              </div>
              <p className="text-muted-foreground">
                Same-day delivery across NYC, typically within 30-45 minutes. Professional drivers, discreet 
                packaging, and real-time order tracking.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="w-6 h-6 text-primary" />
                </div>
              <h2 className="text-xl font-semibold">Curated Selection</h2>
              </div>
              <p className="text-muted-foreground">
                We carefully select strains and products from cultivators who prioritize quality. Hand-trimmed flower,
                properly cured, and consistently potent.
              </p>
            </div>
          </div>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">Our Mission</h2>
            <p className="text-muted-foreground">
              We started New York Minute with a simple mission: make premium products accessible to New Yorkers who want 
              quality, consistency, and convenience. No hassle, no compromise—just great flower delivered fast.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">Our Standards</h2>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>Work only with licensed, compliant vendors</li>
              <li>Third-party lab test every batch</li>
              <li>Premium indoor-grown products only</li>
              <li>Proper curing and quality control</li>
              <li>Professional, discreet delivery</li>
              <li>21+ age verification on every order</li>
              <li>Transparent pricing—no hidden fees</li>
              <li>Dedicated customer support</li>
            </ul>
          </section>

          <section className="bg-muted/30 p-8 rounded-lg">
            <h2 className="text-2xl font-semibold mb-4">Questions?</h2>
            <p className="text-muted-foreground mb-4">
              Our team is here to help.
            </p>
            <div className="space-y-2 text-muted-foreground">
              <p>Email: support@newyorkminutenyc.com</p>
              <p>Phone: (212) 555-DASH</p>
              <p>Hours: 8 AM - 10 PM, 7 Days a Week</p>
            </div>
            <div className="mt-4 pt-4 border-t text-xs text-muted-foreground">
              <p className="font-semibold">Licensed Cannabinoid Hemp Retailer</p>
              <p>NY Office of Cannabis Management License #[Pending]</p>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default About;
