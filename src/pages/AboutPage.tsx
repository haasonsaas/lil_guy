
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
              The mind behind The Haas Chronicle
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
                Technology Enthusiast, Software Developer, and AI Researcher
              </p>
              
              <div className="prose-custom mb-6">
                <p>
                  I'm Jonathan Haas, a software developer and technology enthusiast with a passion for understanding how emerging technologies shape our world.
                </p>
                <p>
                  My work focuses on the intersection of artificial intelligence, human-computer interaction, and software engineering. I believe that truly great technology should be both powerful and accessible, technically impressive and delightfully humane.
                </p>
                <p>
                  Through The Haas Chronicle, I share my thoughts on the evolving technology landscape, with a particular focus on AI, software development practices, and the future of human-computer interaction.
                </p>
              </div>
              
              <div className="flex gap-4">
                <a 
                  href="https://github.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Github size={18} />
                  <span>GitHub</span>
                </a>
                <a 
                  href="https://twitter.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Twitter size={18} />
                  <span>Twitter</span>
                </a>
                <a 
                  href="https://linkedin.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Linkedin size={18} />
                  <span>LinkedIn</span>
                </a>
              </div>
            </div>
          </div>
          
          <div className="border-t border-border pt-12 animate-fade-up">
            <h2 className="text-2xl font-bold mb-6 text-center">Get in Touch</h2>
            <div className="bg-card border border-border rounded-xl p-8 text-center">
              <Mail className="mx-auto mb-4 h-10 w-10 text-primary" />
              <p className="mb-4">
                Have a question, comment, or just want to say hello? Feel free to reach out!
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
