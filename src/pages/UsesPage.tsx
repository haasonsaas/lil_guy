import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Laptop, Code, Monitor, Headphones, Coffee, Smartphone, Keyboard, Mouse } from 'lucide-react';

export default function UsesPage() {
  return (
    <Layout>
      <section className="py-12 md:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4 font-serif">My Setup & Tools</h1>
            <p className="text-muted-foreground text-lg">
              The hardware, software, and tools I use daily for work and productivity
            </p>
          </div>
          
          <Tabs defaultValue="hardware" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-8">
              <TabsTrigger value="hardware" className="flex items-center gap-2">
                <Laptop size={16} />
                <span>Hardware</span>
              </TabsTrigger>
              <TabsTrigger value="mobile" className="flex items-center gap-2">
                <Smartphone size={16} />
                <span>Mobile</span>
              </TabsTrigger>
              <TabsTrigger value="software" className="flex items-center gap-2">
                <Code size={16} />
                <span>Software</span>
              </TabsTrigger>
              <TabsTrigger value="productivity" className="flex items-center gap-2">
                <Coffee size={16} />
                <span>Productivity</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="hardware">
              <div className="grid gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Laptop size={20} /> 
                      <span>Workstation</span>
                    </CardTitle>
                    <CardDescription>My primary development environment</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div>
                        <h3 className="font-medium text-lg mb-2">MacBook Pro 14" (2024)</h3>
                        <p className="text-muted-foreground mb-2">M4 Max, 128GB RAM, 2TB SSD</p>
                        <p className="text-sm mb-2">Why I love it: The perfect balance of power and portability. The M4 chip handles everything from heavy IDE loads to multiple Docker containers without breaking a sweat. The Liquid Retina XDR display makes coding and design work a joy.</p>
                        <p className="text-sm">Price: $3,199 (base model)</p>
                      </div>
                      
                      <div>
                        <h3 className="font-medium text-lg mb-2">DROP ALT Mechanical Keyboard</h3>
                        <p className="text-muted-foreground mb-2">Gateron Brown switches with PBT keycaps</p>
                        <p className="text-sm mb-2">Key Features: Hot-swappable switches, per-key RGB, USB-C passthrough</p>
                        <p className="text-sm mb-2">Why I chose it: The satisfying tactile feedback dramatically improves typing accuracy and comfort during long coding sessions. The compact 65% layout keeps my desk minimal while retaining essential keys.</p>
                        <p className="text-sm">Price: $180-230 depending on configuration</p>
                      </div>
                      
                      <div>
                        <h3 className="font-medium text-lg mb-2">Logitech MX Master 3</h3>
                        <p className="text-muted-foreground mb-2">Ergonomic design, customizable buttons, Darkfield tracking</p>
                        <p className="text-sm mb-2">Why it's essential: The thumb rest and ergonomic shape prevent wrist strain during long work sessions. The horizontal scroll wheel is invaluable for timeline editing and spreadsheets.</p>
                        <p className="text-sm">Price: $99</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="mobile">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Smartphone size={20} /> 
                    <span>Mobile Setup</span>
                  </CardTitle>
                  <CardDescription>My mobile productivity tools</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-medium text-lg mb-2">iPhone 16 Pro</h3>
                      <p className="text-muted-foreground mb-2">512GB Storage</p>
                      
                      <h4 className="font-medium mt-4 mb-2">Use Cases:</h4>
                      <ul className="list-disc pl-6 mb-4 space-y-1">
                        <li>Development: Testing mobile-responsive designs</li>
                        <li>Productivity: Quick email triage and calendar management</li>
                        <li>Photography: Capturing reference shots for design work</li>
                      </ul>
                      
                      <h4 className="font-medium mt-4 mb-2">Key Apps:</h4>
                      <ul className="list-disc pl-6 space-y-1">
                        <li>Notion Calendar</li>
                        <li>Superhuman</li>
                        <li>GitHub Mobile</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="software">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Code size={20} /> 
                    <span>Development Environment</span>
                  </CardTitle>
                  <CardDescription>Software I use for coding and development</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-medium text-lg mb-2">VS Code</h3>
                      <p className="text-muted-foreground mb-2">Theme: GitHub Dark</p>
                      
                      <h4 className="font-medium mt-4 mb-2">Essential Extensions:</h4>
                      <ul className="list-disc pl-6 mb-4 space-y-1">
                        <li>GitLens (Git supercharged)</li>
                        <li>Prettier (Code formatting)</li>
                        <li>ESLint (JavaScript linting)</li>
                        <li>Docker (Container management)</li>
                        <li>REST Client (API testing)</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h3 className="font-medium text-lg mb-2">Alacritty Terminal</h3>
                      <p className="text-muted-foreground mb-2">Configuration: GPU-accelerated, custom key bindings</p>
                      <p className="text-sm mb-2">Color Scheme: Dracula</p>
                      <p className="text-sm mb-2">Shell: Fish with Starship prompt</p>
                      <p className="text-sm">Why I switched from iTerm2: Noticeably faster rendering, especially with large log outputs</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="productivity">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Coffee size={20} /> 
                    <span>Productivity Suite</span>
                  </CardTitle>
                  <CardDescription>Tools that help me stay productive</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-medium text-lg mb-2">Raycast</h3>
                      <p className="text-muted-foreground mb-2">Replaces: Spotlight and Alfred</p>
                      
                      <h4 className="font-medium mt-4 mb-2">Favorite Features:</h4>
                      <ul className="list-disc pl-6 mb-4 space-y-1">
                        <li>Window management</li>
                        <li>Clipboard history</li>
                        <li>Custom scripts for development workflows</li>
                        <li>Quick calculator and unit conversion</li>
                      </ul>
                      
                      <h4 className="font-medium mt-4 mb-2">Must-Have Extensions:</h4>
                      <ul className="list-disc pl-6 mb-4 space-y-1">
                        <li>DevDocs integration</li>
                        <li>GitHub pull requests</li>
                        <li>Notion quick add</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h3 className="font-medium text-lg mb-2">Superhuman</h3>
                      <p className="text-muted-foreground mb-2">Email Philosophy: Inbox Zero</p>
                      
                      <h4 className="font-medium mt-4 mb-2">Key Shortcuts:</h4>
                      <ul className="list-disc pl-6 mb-4 space-y-1">
                        <li>Cmd + K: Command palette</li>
                        <li>Cmd + Shift + U: Mark as unread</li>
                        <li>Cmd + Enter: Send</li>
                      </ul>
                      
                      <p className="text-sm">Why It's Worth $30/month: The combination of keyboard shortcuts, AI-powered triage, and instant search saves me 2-3 hours weekly. It's still incredibly expensive for an email client, but so far the time savings are worth it.</p>
                    </div>
                    
                    <div>
                      <h3 className="font-medium text-lg mb-2">Notion Calendar</h3>
                      <p className="text-muted-foreground mb-2">Integration: Syncs with Google Calendar</p>
                      
                      <h4 className="font-medium mt-4 mb-2">Best Features:</h4>
                      <ul className="list-disc pl-6 mb-4 space-y-1">
                        <li>Meeting templates</li>
                        <li>Automatic time blocking</li>
                        <li>Task integration with Notion workspaces</li>
                      </ul>
                      
                      <p className="text-sm">How I Use It: Planning sprints, tracking deadlines, and managing meeting notes</p>
                    </div>
                    
                    <div>
                      <h3 className="font-medium text-lg mb-2">💰 Cost Breakdown</h3>
                      <p className="text-muted-foreground mb-2">Monthly software costs:</p>
                      
                      <div className="border rounded-md overflow-hidden">
                        <table className="w-full">
                          <thead className="bg-muted">
                            <tr>
                              <th className="px-4 py-2 text-left">Tool</th>
                              <th className="px-4 py-2 text-right">Monthly Cost</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="border-t">
                              <td className="px-4 py-2">Superhuman</td>
                              <td className="px-4 py-2 text-right">$30</td>
                            </tr>
                            <tr className="border-t">
                              <td className="px-4 py-2">VS Code</td>
                              <td className="px-4 py-2 text-right">Free</td>
                            </tr>
                            <tr className="border-t">
                              <td className="px-4 py-2">Raycast</td>
                              <td className="px-4 py-2 text-right">Free</td>
                            </tr>
                            <tr className="border-t font-medium">
                              <td className="px-4 py-2">Total</td>
                              <td className="px-4 py-2 text-right">$30</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
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
