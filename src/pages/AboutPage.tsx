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
                  src="https://images.unsplash.com/photo-1519389950473-47ba0277781c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80"
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
                <h3 className="text-xl font-semibold mb-3">About</h3>
                <p className="mb-4">
                  As a product manager at Vanta, I'm on a mission to revolutionize how businesses handle security compliance. By automating security assessments, we're turning what was once a months-long ordeal into a streamlined process that takes days.
                </p>

                <h3 className="text-xl font-semibold mb-3">My Story</h3>
                <p className="mb-4">
                  My journey into security and compliance started in the trenches. After serving as a security engineer at Snapchat, DoorDash, and Carta, I noticed a persistent problem: companies were struggling with security assessments, burning countless hours on manual processes. This insight led me to found ThreatKey, a SaaS security company focused on automated misconfiguration detection.
                </p>

                <h3 className="text-xl font-semibold mb-3">Product Philosophy</h3>
                <ul className="list-disc pl-6 mb-4">
                  <li>Start with customer pain points, not solutions</li>
                  <li>Make data-driven decisions while respecting qualitative insights</li>
                  <li>Build diverse, empowered teams</li>
                </ul>

                <h3 className="text-xl font-semibold mb-3">Impact & Results</h3>
                <ul className="list-disc pl-6 mb-4">
                  <li>Reduced average security assessment completion time from months to weeks</li>
                  <li>Helped thousands of companies achieve SOC 2 compliance</li>
                  <li>Led development of enterprise security integrations with industry leaders</li>
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
                href="mailto:contact@example.com"
                className="text-primary hover:text-primary/80 font-medium"
              >
                contact@example.com
              </a>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
