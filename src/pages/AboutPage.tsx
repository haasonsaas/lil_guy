import Layout from '@/components/Layout';
import { Github, Twitter, Linkedin, Mail } from 'lucide-react';

export default function AboutPage() {
  return (
    <Layout>
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 animate-fade-in">
            <h1 className="text-4xl font-bold mb-4">About</h1>
            <p className="text-muted-foreground text-lg">
              Product Manager at Vanta, Security & Compliance Expert
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
                Product Manager at Vanta | Security & Compliance Expert
              </p>
              
              <div className="prose-custom mb-6">
                <h3 className="text-xl font-semibold mb-3">About Me</h3>
                <p className="mb-4">
                  I help businesses tackle security compliance at Vanta. We're transforming what used to be a painful months-long process into something that takes just days through smart automation.
                </p>

                <h3 className="text-xl font-semibold mb-3">My Journey</h3>
                <p className="mb-4">
                  I've been in the security trenches at companies like Snapchat, DoorDash, and Carta, where I saw firsthand how manual security processes drain teams of time and resources.
                </p>

                <h3 className="text-xl font-semibold mb-3">Product Philosophy</h3>
                <p className="mb-2">I build products that solve real problems, not imagined ones. My approach:</p>
                <ul className="list-disc pl-6 mb-4">
                  <li>Customer-first thinking: I start by deeply understanding pain points before designing solutions. The best products address what keeps people up at night, not what looks good in a pitch deck.</li>
                  <li>Right-sized data: Numbers tell important stories, but so do customer conversations. I blend quantitative metrics with qualitative insights to capture the full picture.</li>
                  <li>Teams as ecosystems: Products thrive when built by diverse teams where different perspectives challenge assumptions. I create environments where people feel empowered to contribute their unique expertise.</li>
                </ul>

                <h3 className="text-xl font-semibold mb-3">Impact</h3>
                <p className="mb-2">At Vanta, I've helped reshape how businesses approach compliance:</p>
                <ul className="list-disc pl-6 mb-4">
                  <li>Cut assessment completion times from months to weeks</li>
                  <li>Guided thousands of companies to successful SOC 2 certification</li>
                  <li>Built enterprise-grade integrations that connect security across organizational boundaries</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="border-t border-border pt-12 animate-fade-up">
            <h2 className="text-2xl font-bold mb-6 text-center">Let's Connect</h2>
            <div className="bg-card border border-border rounded-xl p-8 text-center">
              <Mail className="mx-auto mb-4 h-10 w-10 text-primary" />
              <p className="mb-4">
                I'm always eager to exchange ideas with fellow product leaders and security enthusiasts. Whether you're curious about automated compliance, building security products, or transitioning from engineering to product management, I'd love to share experiences.
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
