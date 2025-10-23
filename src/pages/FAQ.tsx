import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQ = () => {
  const faqs = [
    {
      question: "Are your products legal?",
      answer:
        "Yes. All products are derived from hemp and contain less than 0.3% Delta-9 THC, complying with federal and New York State regulations. We are a licensed cannabinoid hemp retailer by the NY Office of Cannabis Management.",
    },
    {
      question: "Are your products lab tested?",
      answer:
        "Yes. Every product is third-party lab tested for potency, purity, pesticides, heavy metals, and contaminants. Certificates of Analysis (COAs) are available for all products on request.",
    },
    {
      question: "What areas do you deliver to?",
      answer:
        "We deliver across Manhattan, Brooklyn, and Queens. Enter your address at checkout to confirm delivery availability. Orders placed before 6 PM typically arrive same day.",
    },
    {
      question: "How fast is delivery?",
      answer:
        "Orders typically arrive within 30-45 minutes. Delivery windows are 2-4 hours. You'll receive real-time updates on your order status.",
    },
    {
      question: "Do you require ID?",
      answer:
        "Yes. You must be 21+ with valid government ID. Our driver will verify your age at delivery. Acceptable IDs: driver's license, state ID, passport, or military ID.",
    },
    {
      question: "What are the delivery fees?",
      answer:
        "FREE on orders over $100. $10 for orders $50-$99. $15 for orders under $50. All fees displayed at checkout.",
    },
    {
      question: "What should I expect in terms of effects?",
      answer:
        "Products may produce various effects depending on the strain and product type. Sativas tend to be energizing, indicas relaxing, and hybrids balanced. Effects vary by individual. Start with small amounts and use responsibly.",
    },
    {
      question: "Will these products show up on a drug test?",
      answer:
        "Yes. Products may result in positive drug test results. If you're subject to drug testing, consult with your employer or testing authority before purchasing.",
    },
    {
      question: "What payment methods do you accept?",
      answer:
        "We accept cash on delivery. Have cash ready when the driver arrives. Additional payment options coming soon.",
    },
    {
      question: "What is your return policy?",
      answer:
        "Contact support immediately if you receive a damaged or incorrect product. Include your order number and photos. We'll work with you to resolve any issues.",
    },
    {
      question: "How do I contact customer support?",
      answer:
        "Email us at support@newyorkminutenyc.com or use the contact form on our Support page. We typically respond within 24 hours.",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col pb-20 md:pb-0">
      <Navigation />
      
      <main className="flex-1 py-20">
        <div className="container max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Frequently Asked Questions
            </h1>
            <p className="text-xl text-muted-foreground">
              Everything you need to know about premium flower delivery in NYC
            </p>
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="border rounded-lg px-6 bg-card"
              >
                <AccordionTrigger className="text-left hover:no-underline">
                  <span className="font-semibold">{faq.question}</span>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          <div className="mt-12 p-6 bg-muted/50 rounded-lg text-center">
            <h3 className="text-xl font-semibold mb-2">Still have questions?</h3>
            <p className="text-muted-foreground mb-4">
              Our support team is here to help
            </p>
            <a
              href="/support"
              className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
            >
              Contact Support
            </a>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default FAQ;
