import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bot, Code, Brain, MessageSquare, Zap, Settings, Lightbulb, Shield } from 'lucide-react';

export default function AIPage() {
  return (
    <Layout>
      <section className="py-12 md:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4 font-serif">My AI Workflow</h1>
            <p className="text-muted-foreground text-lg">
              How I use AI assistants like Claude Code to augment my development process and creative work
            </p>
          </div>
          
          <Tabs defaultValue="claude-code" className="w-full">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
              <TabsTrigger value="claude-code" className="flex items-center gap-2">
                <Code size={16} /> Claude Code
              </TabsTrigger>
              <TabsTrigger value="reasoning" className="flex items-center gap-2">
                <Brain size={16} /> Reasoning
              </TabsTrigger>
              <TabsTrigger value="creative" className="flex items-center gap-2">
                <Lightbulb size={16} /> Creative
              </TabsTrigger>
              <TabsTrigger value="workflow" className="flex items-center gap-2">
                <Zap size={16} /> Workflow
              </TabsTrigger>
              <TabsTrigger value="prompting" className="flex items-center gap-2">
                <MessageSquare size={16} /> Prompting
              </TabsTrigger>
              <TabsTrigger value="philosophy" className="flex items-center gap-2">
                <Shield size={16} /> Philosophy
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="claude-code">
              <div className="grid gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Code size={20} /> 
                      <span>Claude Code (claude.ai/code)</span>
                    </CardTitle>
                    <CardDescription>My primary AI coding partner for development work</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div>
                        <h3 className="font-medium text-lg mb-2">What I Use It For</h3>
                        <ul className="list-disc pl-6 space-y-2">
                          <li><strong>Complex Implementations:</strong> Building sophisticated experiments like the HDR holographic foil and liquid metal physics simulations</li>
                          <li><strong>Architecture Decisions:</strong> Discussing tradeoffs between different approaches and getting second opinions on system design</li>
                          <li><strong>Code Review:</strong> Catching edge cases, suggesting optimizations, and improving code quality</li>
                          <li><strong>Learning New Technologies:</strong> Rapid prototyping with unfamiliar APIs or frameworks</li>
                          <li><strong>Debugging Partner:</strong> Working through complex issues with real-time collaboration</li>
                        </ul>
                      </div>
                      
                      <div>
                        <h3 className="font-medium text-lg mb-2">Why Claude Code Specifically</h3>
                        <div className="space-y-3">
                          <p className="text-sm"><strong>File System Access:</strong> Can read, write, and navigate my entire codebase, making it feel like pair programming with someone who knows the project.</p>
                          <p className="text-sm"><strong>Real Development Environment:</strong> Executes commands, runs tests, and handles git operations just like a human developer would.</p>
                          <p className="text-sm"><strong>Context Awareness:</strong> Understands project structure, existing patterns, and can maintain consistency across the codebase.</p>
                          <p className="text-sm"><strong>End-to-End Execution:</strong> Goes beyond code generation to actually implement, test, and deploy features.</p>
                        </div>
                      </div>

                      <div>
                        <h3 className="font-medium text-lg mb-2">Collaboration Style</h3>
                        <p className="text-sm mb-2">I treat Claude Code as a senior developer on my team. I explain the vision, we discuss approaches, and then work together on implementation. The key is being specific about requirements while leaving room for Claude to suggest better approaches.</p>
                        <p className="text-sm">Example: "Build a liquid metal simulation with realistic physics" becomes a conversation about metaballs, surface tension algorithms, and performance optimization strategies.</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="reasoning">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain size={20} /> 
                    <span>AI Reasoning & Problem Solving</span>
                  </CardTitle>
                  <CardDescription>How I leverage AI for complex thinking and analysis</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-medium text-lg mb-2">Strategic Thinking</h3>
                      <ul className="list-disc pl-6 space-y-2">
                        <li><strong>Technical Architecture:</strong> Exploring different approaches to complex problems before committing to implementation</li>
                        <li><strong>Product Decisions:</strong> Analyzing user needs, market positioning, and feature prioritization</li>
                        <li><strong>Business Strategy:</strong> Evaluating pricing models, go-to-market strategies, and competitive positioning</li>
                        <li><strong>Risk Assessment:</strong> Identifying potential issues before they become problems</li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="font-medium text-lg mb-2">Research & Analysis</h3>
                      <p className="text-sm mb-2">AI excels at synthesizing information from multiple perspectives. I use it to:</p>
                      <ul className="list-disc pl-6 space-y-1">
                        <li>Research emerging technologies and evaluate their potential impact</li>
                        <li>Analyze complex technical documentation and extract key insights</li>
                        <li>Compare different solutions and identify the best fit for specific use cases</li>
                        <li>Validate assumptions and identify blind spots in my thinking</li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="font-medium text-lg mb-2">Debug Thinking</h3>
                      <p className="text-sm">Sometimes the hardest bugs aren't in the code—they're in my understanding of the problem. AI helps me step back and reframe issues from different angles.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="creative">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb size={20} /> 
                    <span>Creative Collaboration</span>
                  </CardTitle>
                  <CardDescription>Using AI to enhance creativity and explore new ideas</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-medium text-lg mb-2">Content Creation</h3>
                      <ul className="list-disc pl-6 space-y-2">
                        <li><strong>Blog Post Development:</strong> Collaborating on technical articles, with AI helping structure complex topics and ensure clarity</li>
                        <li><strong>Technical Writing:</strong> Refining documentation, API references, and user guides for better accessibility</li>
                        <li><strong>Code Documentation:</strong> Generating comprehensive comments and README files that actually help</li>
                        <li><strong>Presentation Design:</strong> Structuring talks and demos for maximum impact</li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="font-medium text-lg mb-2">Experimental Projects</h3>
                      <p className="text-sm mb-2">The best use of AI in creative work is as a collaborator who can rapidly prototype wild ideas:</p>
                      <ul className="list-disc pl-6 space-y-1">
                        <li>WebGL experiments that push browser capabilities</li>
                        <li>Interactive data visualizations with novel approaches</li>
                        <li>Physics simulations that feel magical but are grounded in real math</li>
                        <li>UI concepts that challenge conventional design patterns</li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="font-medium text-lg mb-2">Ideation Partner</h3>
                      <p className="text-sm">AI is excellent at playing "yes, and..." with creative ideas. I'll throw out a half-formed concept, and AI helps flesh it out into something viable and interesting.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="workflow">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap size={20} /> 
                    <span>Workflow Integration</span>
                  </CardTitle>
                  <CardDescription>How AI fits into my daily development process</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-medium text-lg mb-2">Development Workflow</h3>
                      <div className="space-y-3">
                        <p className="text-sm"><strong>Planning Phase:</strong> Discussing architecture and breaking down complex features into manageable tasks</p>
                        <p className="text-sm"><strong>Implementation:</strong> Real-time collaboration on code, with AI handling boilerplate while I focus on business logic</p>
                        <p className="text-sm"><strong>Testing:</strong> AI suggests edge cases I might miss and helps write comprehensive test suites</p>
                        <p className="text-sm"><strong>Deployment:</strong> Assistance with CI/CD configuration and deployment troubleshooting</p>
                        <p className="text-sm"><strong>Maintenance:</strong> Code reviews, refactoring suggestions, and performance optimization</p>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-medium text-lg mb-2">Time Allocation</h3>
                      <p className="text-sm mb-2">AI changes how I spend my time as a developer:</p>
                      <ul className="list-disc pl-6 space-y-1">
                        <li><strong>Less time:</strong> Writing boilerplate, setting up project structure, debugging syntax errors</li>
                        <li><strong>More time:</strong> Solving interesting problems, experimenting with new ideas, focusing on user experience</li>
                        <li><strong>Different time:</strong> Explaining requirements clearly, reviewing AI-generated code, fine-tuning implementations</li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="font-medium text-lg mb-2">Quality Control</h3>
                      <p className="text-sm">AI-generated code still needs human oversight. I focus on ensuring the solution meets requirements, follows project patterns, and maintains good architecture.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="prompting">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare size={20} /> 
                    <span>Effective Prompting</span>
                  </CardTitle>
                  <CardDescription>Techniques for getting better results from AI assistants</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-medium text-lg mb-2">Communication Principles</h3>
                      <ul className="list-disc pl-6 space-y-2">
                        <li><strong>Context First:</strong> Always explain the broader goal before diving into specifics</li>
                        <li><strong>Constraints Matter:</strong> Be clear about limitations, requirements, and existing code patterns</li>
                        <li><strong>Examples Help:</strong> Show similar implementations or reference existing code when possible</li>
                        <li><strong>Iterate Openly:</strong> Treat the conversation as collaborative—ask questions and refine requirements</li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="font-medium text-lg mb-2">Good vs. Better Prompts</h3>
                      <div className="space-y-4">
                        <div className="bg-red-50 dark:bg-red-950/20 p-4 rounded">
                          <p className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">❌ Vague:</p>
                          <p className="text-sm text-red-700 dark:text-red-300">"Make a liquid metal effect"</p>
                        </div>
                        <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded">
                          <p className="text-sm font-medium text-green-800 dark:text-green-200 mb-1">✅ Specific:</p>
                          <p className="text-sm text-green-700 dark:text-green-300">"Create a T-1000 style liquid metal simulation using metaballs and Canvas 2D API, with realistic surface tension that responds to mouse interaction and includes environmental reflections for metallic appearance"</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-medium text-lg mb-2">Advanced Techniques</h3>
                      <ul className="list-disc pl-6 space-y-1">
                        <li><strong>Chain of Thought:</strong> Ask AI to explain its reasoning for complex decisions</li>
                        <li><strong>Role Playing:</strong> "Act as a senior React developer reviewing this component"</li>
                        <li><strong>Comparative Analysis:</strong> "Compare these three approaches and recommend the best one"</li>
                        <li><strong>Error Prevention:</strong> "What edge cases should I consider?"</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="philosophy">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield size={20} /> 
                    <span>AI Philosophy & Principles</span>
                  </CardTitle>
                  <CardDescription>My approach to AI collaboration and its role in development</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-medium text-lg mb-2">Core Principles</h3>
                      <ul className="list-disc pl-6 space-y-2">
                        <li><strong>AI as Amplifier:</strong> AI should enhance human capabilities, not replace human judgment</li>
                        <li><strong>Maintain Ownership:</strong> I remain responsible for all code and decisions—AI is a tool, not a decision maker</li>
                        <li><strong>Understand Everything:</strong> Never ship code I don't fully understand, regardless of how it was generated</li>
                        <li><strong>Preserve Creativity:</strong> Use AI to handle mundane tasks so I can focus on interesting problems</li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="font-medium text-lg mb-2">What AI Is Great At</h3>
                      <ul className="list-disc pl-6 space-y-1">
                        <li>Rapid prototyping and exploration of ideas</li>
                        <li>Handling boilerplate and repetitive tasks</li>
                        <li>Suggesting alternative approaches I might not consider</li>
                        <li>Explaining complex concepts in accessible ways</li>
                        <li>Pattern recognition across large codebases</li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="font-medium text-lg mb-2">What Humans Are Still Better At</h3>
                      <ul className="list-disc pl-6 space-y-1">
                        <li>Understanding user needs and business context</li>
                        <li>Making strategic decisions about product direction</li>
                        <li>Creative problem-solving that requires intuition</li>
                        <li>Quality assurance and edge case thinking</li>
                        <li>Building relationships and team collaboration</li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="font-medium text-lg mb-2">The Future of Development</h3>
                      <p className="text-sm">AI isn't replacing developers—it's changing what we do. We're shifting from code writers to solution architects, spending more time on problems that matter and less time on syntax and boilerplate.</p>
                      <p className="text-sm mt-2">The developers who thrive will be those who learn to collaborate effectively with AI while maintaining their creative vision and technical judgment.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </Layout>
  );
}