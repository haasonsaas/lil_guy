import Layout from '@/components/Layout';
import { Mail } from 'lucide-react';

export default function AboutPage() {
  return (
    <Layout>
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 animate-fade-in">
            <h1 className="text-4xl font-bold mb-4">About</h1>
          </div>
          
          <div className="flex flex-col md:flex-row gap-8 mb-12 animate-fade-up">
            <div className="w-full md:w-1/3">
              <div className="rounded-xl overflow-hidden bg-card border border-border">
                <img
                  src="/images/self.jpeg"
                  alt="Jonathan Haas"
                  className="w-full aspect-square object-cover"
                />
              </div>
            </div>
            
            <div className="w-full md:w-2/3">
              <h2 className="text-2xl font-bold mb-4">Jonathan Haas</h2>
              <p className="text-muted-foreground mb-6">
                Compliance Transformation Specialist at Vanta | Making Security Accessible | San Francisco Explorer
              </p>
              
              <div className="prose-custom mb-6">
                <h3 className="text-xl font-semibold mb-3">The Human Behind the Work</h3>
                <p className="mb-4">
                  I transform security compliance from a months-long headache into a streamlined process that takes days. At Vanta, I build bridges between complex regulatory requirements and practical business needs. When I'm not revolutionizing compliance, I'm perfecting sourdough pizza techniques or discovering San Francisco's hidden treasures on foot—always seeking the perfect balance between structure and creativity.
                </p>

                <h3 className="text-xl font-semibold mb-3">Professional Journey</h3>
                <p className="mb-4">
                  My security and compliance expertise was forged at high-growth companies like Snapchat, DoorDash, and Carta. Each environment taught me how excessive manual processes drain innovation and team morale. This firsthand experience drives my mission at Vanta: creating intuitive tools that transform compliance from a burden into a business advantage.
                </p>

                <h3 className="text-xl font-semibold mb-3">Beyond the Office</h3>
                <p className="mb-4">
                  My curiosity extends beyond work—I'm methodically exploring San Francisco's 49-mile scenic route, curating a collection of science fiction and urban planning books, and undertaking a global culinary challenge (37 countries and counting). My legendary pizza nights featuring "Doughvid," my sourdough starter, have created a waiting list of eager taste-testers among friends and neighbors.
                </p>

                <h3 className="text-xl font-semibold mb-3">Product Philosophy</h3>
                <p className="mb-2">My approach combines pragmatism with empathy:</p>
                <ul className="list-disc pl-6 mb-4">
                  <li>Problem-first development: I immerse myself in customers' workflows to understand pain points before proposing solutions</li>
                  <li>Balanced decision-making: Combining data-driven insights with customer narratives to build complete understanding</li>
                  <li>Inclusive innovation: Creating environments where diverse perspectives thrive and contribute to better outcomes</li>
                </ul>

                <h3 className="text-xl font-semibold mb-3">Impact Highlights</h3>
                <p className="mb-2">My work at Vanta has democratized compliance:</p>
                <ul className="list-disc pl-6 mb-4">
                  <li>Engineered frameworks that compress certification timelines from months to weeks</li>
                  <li>Developed processes enabling small teams to manage complex requirements without specialized staff</li>
                  <li>Created tools that translate compliance jargon into clear, actionable steps for non-specialists</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="border-t border-border pt-12 animate-fade-up">
            <h2 className="text-2xl font-bold mb-6 text-center">Let's Connect</h2>
            <div className="bg-card border border-border rounded-xl p-8 text-center">
              <Mail className="mx-auto mb-4 h-10 w-10 text-primary" />
              <p className="mb-4">
                I'm always up for conversations about simplifying security, product development challenges, San Francisco's best walking routes, or pizza-making techniques. Whether you're curious about automated compliance, building user-friendly security tools, or where to find the city's best views, I'd enjoy connecting.
              </p>
              <a 
                href="mailto:jonathan@haasonsaas.com"
                className="text-primary hover:text-primary/80 font-medium"
              >
                jonathan@haasonsaas.com
              </a>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}