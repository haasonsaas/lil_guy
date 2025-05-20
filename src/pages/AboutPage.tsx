import Layout from '@/components/Layout';
import { Mail } from 'lucide-react';

export default function AboutPage() {
  return (
    <Layout>
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 animate-fade-in">
            <h1 className="text-4xl font-bold mb-4">About</h1>
            <p className="text-muted-foreground text-lg">
              Security & Compliance Expert
            </p>
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
                Security & Compliance Expert
              </p>
              
              <div className="prose-custom mb-6">
                <p className="mb-4">
                  I help businesses tackle security compliance challenges. I'm passionate about transforming what used to be painful months-long processes into streamlined operations through smart automation.
                </p>

                <h3 className="text-xl font-semibold mb-3">From Firefights to Frameworks</h3>
                <p className="mb-4">
                  I started my career deep in the mess—leading a variety of security efforts at high-growth teams like Snapchat, DoorDash, and Carta, where compliance felt like a tax on velocity. So I built something better.
                </p>
                <p className="mb-4">
                  After founding ThreatKey, I'm now building something new focused on helping companies scale their operations efficiently. My focus: eliminate busywork, automate complexity, and scale trust through better systems.
                </p>

                <h3 className="text-xl font-semibold mb-3">What I Build</h3>
                <p className="mb-4">
                  AI-powered tools for the real world. Products that understand the workflow, not just the checkbox.
                </p>
                <ul className="list-disc pl-6 mb-4">
                  <li>Compress weeks of compliance work into hours</li>
                  <li>Translate frameworks into step-by-step guidance</li>
                  <li>Let startups ship fast without trading off trust</li>
                </ul>

                <h3 className="text-xl font-semibold mb-3">Impact</h3>
                <p className="mb-2">I've helped reshape how businesses approach compliance:</p>
                <ul className="list-disc pl-6 mb-4">
                  <li>Start at the edge cases — They reveal the real job</li>
                  <li>Balance precision with pragmatism — Especially in regulated environments</li>
                  <li>Design for humans — Because complexity doesn't have to feel complicated</li>
                </ul>

                <h3 className="text-xl font-semibold mb-3">A Bit More Human</h3>
                <p className="mb-4">
                  Outside work, I'm slow-walking San Francisco's 49-mile scenic route, cooking my way across 37 countries, and hosting pizza nights featuring Doughvid, my high-hydration sourdough starter. He's cranky but worth it.
                </p>
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
