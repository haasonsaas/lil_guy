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
                Product Manager at Vanta | Security Simplifier | San Francisco Wanderer
              </p>
              
              <div className="prose-custom mb-6">
                <h3 className="text-xl font-semibold mb-3">Making Compliance Make Sense</h3>
                <p className="mb-4">
                  At Vanta, I turn security compliance from a months-long slog into a matter of days. My role is about translating regulatory complexity into something teams can actually work with—without the jargon, delays, or burnout.
                </p>
                <p className="mb-4">
                  When I'm not deep in frameworks and audits, I'm likely tweaking a new sourdough pizza recipe or wandering San Francisco in search of overlooked gems.
                </p>

                <h3 className="text-xl font-semibold mb-3">The Backstory</h3>
                <p className="mb-4">
                  Before Vanta, I worked in security and compliance roles at Snapchat, DoorDash, and Carta. Fast-moving teams taught me the cost of clunky, manual processes—and what's needed to fix them. That's why I focus on building systems that reduce friction, cut down busywork, and help companies stay secure without losing momentum.
                </p>

                <h3 className="text-xl font-semibold mb-3">Life Outside the Laptop</h3>
                <p className="mb-4">
                  I'm slowly walking the 49-mile scenic route around San Francisco, reading way too much sci-fi and urban planning, and cooking my way through a list of 37+ countries. I also host occasional pizza nights starring "Doughvid," my trusty sourdough starter—currently booked solid with friends and neighbors.
                </p>

                <h3 className="text-xl font-semibold mb-3">How I Work</h3>
                <p className="mb-2">My product philosophy is grounded and people-first:</p>
                <ul className="list-disc pl-6 mb-4">
                  <li>Start with the problem. I get close to real workflows to understand what's actually broken.</li>
                  <li>Balance inputs. I combine metrics with lived customer experience to guide decisions.</li>
                  <li>Build inclusively. Better tools come from diverse input and open collaboration.</li>
                </ul>

                <h3 className="text-xl font-semibold mb-3">A Few Wins</h3>
                <p className="mb-2">At Vanta, I've helped:</p>
                <ul className="list-disc pl-6 mb-4">
                  <li>Cut certification timelines from months to weeks</li>
                  <li>Empower small teams to meet complex standards without hiring compliance staff</li>
                  <li>Translate dense frameworks into plain-language, step-by-step workflows</li>
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