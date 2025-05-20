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
              <AccordionTrigger className="text-lg font-medium">Do you do angel investing?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Yes, I primarily invest through <a href="https://sidechannel.ventures" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">sidechannel.ventures</a>, focusing on early-stage startups in SaaS, security, and enterprise software. I look for founders with strong technical backgrounds and clear product visions.
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

            <AccordionItem value="item-6">
              <AccordionTrigger className="text-lg font-medium">Are you involved in any industry groups?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Yes, I'm an active participant in several industry groups including OWASP, BSides, and similar security and technology communities. These groups provide valuable opportunities for knowledge sharing, networking, and contributing to the broader tech community.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-7">
              <AccordionTrigger className="text-lg font-medium">What formats do you publish content in?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                I primarily publish written articles on this blog, but I also create technical tutorials, case studies, and occasionally produce video content. All content is designed to be accessible to both technical and non-technical audiences.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-8">
              <AccordionTrigger className="text-lg font-medium">What advice do you have for founders?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                <ul className="list-disc pl-6 space-y-2">
                  <li>Focus on solving a real problem before building features</li>
                  <li>Talk to your customers early and often - they'll tell you what to build</li>
                  <li>Start with security in mind, not as an afterthought</li>
                  <li>Build a strong technical foundation - technical debt compounds quickly</li>
                  <li>Hire for cultural fit and learning ability, not just technical skills</li>
                  <li>Document everything - from architecture decisions to operational procedures</li>
                  <li>Measure what matters - focus on metrics that drive business outcomes</li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-9">
              <AccordionTrigger className="text-lg font-medium">Do you collaborate with other writers or creators?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Yes, I'm open to collaborations with other writers, developers, and content creators in the tech space. If you have an interesting project or idea, feel free to reach out through the contact form.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>
    </Layout>
  );
}
