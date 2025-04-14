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
              Product Manager at Vanta | Compliance Simplifier | Urban Explorer
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
                Product Manager at Vanta | Home Pizza Enthusiast | SF Walker
              </p>
              
              <div className="prose-custom mb-6">
                <h3 className="text-xl font-semibold mb-3">The Human Behind the Work</h3>
                <p className="mb-4">
                  At Vanta, I'm on a mission to transform security compliance from a dreaded months-long ordeal into a streamlined process that takes just days. But when I'm not simplifying compliance, you'll find me perfecting my homemade pizza dough recipe (current obsession: naturally fermented sourdough) or exploring San Francisco's hidden staircases and neighborhood gems on foot.
                </p>

                <h3 className="text-xl font-semibold mb-3">Professional Journey</h3>
                <p className="mb-4">
                  My path through the security and compliance landscape includes stops at Snapchat during their rapid growth phase, building out processes at DoorDash, and reimagining compliance frameworks at Carta. Each role showed me how manual security processes drain teams of time and enthusiasm. This insight drives my work at Vanta, where I focus on creating tools that make compliance accessible and even (dare I say) enjoyable.
                </p>

                <h3 className="text-xl font-semibold mb-3">Beyond the Office</h3>
                <p className="mb-4">
                  Weekends often find me in my kitchen experimenting with pizza techniques (my friends have become willing taste-testers), walking San Francisco's 49-mile scenic route in segments, or browsing local bookstores for science fiction and urban design titles. I'm also slowly working my way through cooking a dish from every country in the world — currently 37 countries in and counting.
                </p>

                <h3 className="text-xl font-semibold mb-3">Product Philosophy</h3>
                <p className="mb-2">I approach product development with a few core principles:</p>
                <ul className="list-disc pl-6 mb-4">
                  <li>Start with genuine problems: The best products solve real friction points, not theoretical issues. I spend time with customers understanding their actual workflows before designing solutions.</li>
                  <li>Balance data with stories: Metrics tell you what's happening, but conversations tell you why. I believe in blending quantitative insights with qualitative understanding.</li>
                  <li>Create inclusive teams: Products thrive when built by diverse groups where different perspectives are valued. I work to create environments where everyone feels their expertise contributes to the solution.</li>
                </ul>

                <h3 className="text-xl font-semibold mb-3">Real Impact</h3>
                <p className="mb-2">At Vanta, I've had the opportunity to make compliance more accessible:</p>
                <ul className="list-disc pl-6 mb-4">
                  <li>Developed frameworks that have helped startups achieve compliance certifications in weeks rather than months</li>
                  <li>Created streamlined processes that enable small teams to manage security requirements without dedicated compliance staff</li>
                  <li>Built tools that translate complex compliance language into practical, actionable tasks for non-security specialists</li>
                </ul>
                
                <h3 className="text-xl font-semibold mb-3">Little-Known Facts</h3>
                <ul className="list-disc pl-6 mb-4">
                  <li>Once walked 26 miles across San Francisco in a single day, visiting every major neighborhood</li>
                  <li>Maintain a sourdough starter named "Doughvid" that's been alive since the beginning of 2025</li>
                  <li>Run a small pizza night every third Friday, where I test new recipes on friends and neighbors</li>
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