
import Layout from '@/components/Layout';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export default function FAQPage() {
  return (
    <Layout>
      <section className="py-12 md:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4 font-serif">Frequently Asked Questions</h1>
            <p className="text-muted-foreground text-lg">
              Answers to common questions about SaaS, technology, and my work
            </p>
          </div>
          
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger className="text-lg font-medium">What technologies do you write about?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                I primarily write about software-as-a-service (SaaS), artificial intelligence, machine learning, and the future of software development. I cover both technical aspects and business implications of these technologies.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-2">
              <AccordionTrigger className="text-lg font-medium">How often do you publish new content?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                I aim to publish new articles on a weekly basis, typically focusing on emerging trends and technologies in the SaaS space. For major topics, I may publish more comprehensive guides and analyses less frequently.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-3">
              <AccordionTrigger className="text-lg font-medium">Do you offer consulting services?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Yes, I do provide consulting services for companies looking to leverage modern technologies in their business. My expertise spans SaaS strategy, AI implementation, and technology roadmapping. Please reach out directly to discuss your specific needs.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-4">
              <AccordionTrigger className="text-lg font-medium">Can I suggest topics for future articles?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Absolutely! I welcome topic suggestions and reader feedback. You can reach out through the contact form or via social media with your ideas and questions you'd like to see addressed in future content.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-5">
              <AccordionTrigger className="text-lg font-medium">Do you speak at events or conferences?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Yes, I regularly speak at technology conferences and industry events on topics related to SaaS, AI, and software development. My calendar is typically booked a few months in advance, but I'm always open to considering speaking opportunities.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>
    </Layout>
  );
}
