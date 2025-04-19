import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Laptop, Code, Monitor, Headphones, Coffee, Smartphone, Keyboard, Mouse, Network } from 'lucide-react';

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
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
              <TabsTrigger value="hardware" className="flex items-center gap-2">
                <Laptop size={16} /> Hardware
              </TabsTrigger>
              <TabsTrigger value="mobile" className="flex items-center gap-2">
                <Smartphone size={16} /> Mobile
              </TabsTrigger>
              <TabsTrigger value="software" className="flex items-center gap-2">
                <Code size={16} /> Software
              </TabsTrigger>
              <TabsTrigger value="productivity" className="flex items-center gap-2">
                <Coffee size={16} /> Productivity
              </TabsTrigger>
              <TabsTrigger value="audio" className="flex items-center gap-2">
                <Headphones size={16} /> Audio
              </TabsTrigger>
              <TabsTrigger value="networking" className="flex items-center gap-2">
                <Network size={16} /> Networking
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
                        <h3 className="font-medium text-lg mb-2">MacBook Air (2024)</h3>
                        <p className="text-muted-foreground mb-2">M3, 24GB RAM, 8-core CPU (4 performance and 4 efficiency)</p>
                        <p className="text-sm mb-2">Why I love it: Incredibly portable while still being powerful enough for development work. Perfect for working on-the-go or from coffee shops. The M3 chip provides excellent performance while maintaining incredible battery life.</p>
                        <p className="text-sm">Price: $1,299 (base model)</p>
                      </div>
                      
                      <div>
                        <h3 className="font-medium text-lg mb-2">Custom Gaming PC</h3>
                        <p className="text-muted-foreground mb-2">High-performance workstation for gaming and development</p>
                        <div className="space-y-2">
                          <p className="text-sm"><span className="font-medium">CPU:</span> AMD Ryzen 7 9800X3D OEM Tray CPU (8 Cores, 16 Threads, 4.7GHz Base, 5.2GHz Turbo)</p>
                          <p className="text-sm"><span className="font-medium">CPU Cooler:</span> Corsair iCUE LINK TITAN 360 RX LCD Liquid CPU Cooler Black</p>
                          <p className="text-sm"><span className="font-medium">Motherboard:</span> ASUS ROG STRIX X870E-E GAMING WIFI ATX AM5</p>
                          <p className="text-sm"><span className="font-medium">Memory:</span> Corsair VENGEANCE RGB DDR5 64GB (2x 32GB) 6000MT/s</p>
                          <p className="text-sm"><span className="font-medium">GPU:</span> ROG Astral GeForce RTX 5090 32GB GDDR7 OC Edition</p>
                          <p className="text-sm"><span className="font-medium">Storage:</span> 2x Western Digital Black SN850X 4TB NVMe SSD</p>
                          <p className="text-sm"><span className="font-medium">Power Supply:</span> Seasonic VERTEX PX-1200 ATX 3.0 1200W 80 PLUS Platinum</p>
                          <p className="text-sm"><span className="font-medium">Case:</span> NZXT H7 Flow Mid-Tower ATX Case Black</p>
                          <p className="text-sm"><span className="font-medium">Fans:</span> Corsair iCUE LINK RX140 RGB 140mm PWM (Front/Rear) & RX120 MAX RGB 120mm PWM (Bottom)</p>
                          <p className="text-sm"><span className="font-medium">OS:</span> Microsoft Windows 11 Pro 64-bit</p>
                        </div>
                        <p className="text-sm mt-2">Why I love it: This beast of a machine handles everything from AAA gaming to heavy development workloads with ease. The combination of the Ryzen 7 9800X3D and RTX 5090 provides exceptional performance for both gaming and GPU-accelerated development tasks.</p>
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
            
            <TabsContent value="audio">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Headphones size={20} /> 
                    <span>Audio Setup</span>
                  </CardTitle>
                  <CardDescription>My audio equipment</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-medium text-lg mb-2">HIFIMAN HE1000 Stealth</h3>
                      <p className="text-muted-foreground mb-2">Planar magnetic audiophile headphones</p>
                      <div className="space-y-2">
                        <p className="text-sm"><span className="font-medium">Features:</span> Stealth magnet design, planar magnetic drivers, 8Hz-65kHz frequency response</p>
                        <p className="text-sm"><span className="font-medium">Comfort:</span> Premium materials, ergonomic design, lightweight construction</p>
                        <p className="text-sm"><span className="font-medium">Why I love it:</span> Exceptional detail retrieval, wide soundstage, and natural timbre. The Stealth magnet design provides improved efficiency and better bass response.</p>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-medium text-lg mb-2">Massdrop x Sennheiser HD 6XX Headphones</h3>
                      <p className="text-muted-foreground mb-2">Open-back audiophile headphones</p>
                      <div className="space-y-2">
                        <p className="text-sm"><span className="font-medium">Features:</span> Open-back design, 300-ohm impedance, 10Hz-41kHz frequency response</p>
                        <p className="text-sm"><span className="font-medium">Comfort:</span> Velour ear pads, adjustable headband, lightweight design</p>
                        <p className="text-sm"><span className="font-medium">Why I love it:</span> Exceptional sound quality with detailed mids and highs, comfortable for long listening sessions, and excellent value for audiophile-grade headphones</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="networking">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Network size={20} /> 
                    <span>Network Infrastructure</span>
                  </CardTitle>
                  <CardDescription>My Ubiquiti-based home network setup</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-medium text-lg mb-2">Dream Machine Pro Max</h3>
                      <p className="text-muted-foreground mb-2">Core Network Controller & Gateway</p>
                      <div className="space-y-2">
                        <p className="text-sm"><span className="font-medium">Features:</span> 10G throughput, IPS/IDS, multiple site-to-site VPNs</p>
                        <p className="text-sm"><span className="font-medium">Storage:</span> Redundant storage for security footage</p>
                        <p className="text-sm"><span className="font-medium">Why I chose it:</span> Enterprise-grade performance with consumer-friendly interface</p>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="font-medium text-lg mb-2">Layer 3 Pro Max 24 PoE Switch</h3>
                      <p className="text-muted-foreground mb-2">Network Backbone</p>
                      <div className="space-y-2">
                        <p className="text-sm"><span className="font-medium">Features:</span> Inter-VLAN routing, 10G uplinks, PoE power delivery</p>
                        <p className="text-sm"><span className="font-medium">Capacity:</span> 24 ports with PoE+ support</p>
                        <p className="text-sm"><span className="font-medium">Why I chose it:</span> Perfect balance of power and flexibility for home lab use</p>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="font-medium text-lg mb-2">U7 Pro Max Access Point</h3>
                      <p className="text-muted-foreground mb-2">Wireless Coverage</p>
                      <div className="space-y-2">
                        <p className="text-sm"><span className="font-medium">Features:</span> Wi-Fi 6E, high-density support, seamless roaming</p>
                        <p className="text-sm"><span className="font-medium">Coverage:</span> Whole-home coverage with optimal performance</p>
                        <p className="text-sm"><span className="font-medium">Why I chose it:</span> Future-proof wireless performance for all devices</p>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="font-medium text-lg mb-2">UNVR (UniFi Network Video Recorder)</h3>
                      <p className="text-muted-foreground mb-2">Security Storage</p>
                      <div className="space-y-2">
                        <p className="text-sm"><span className="font-medium">Storage:</span> 4x 16TB drives in RAID 10</p>
                        <p className="text-sm"><span className="font-medium">Retention:</span> 30-day footage retention</p>
                        <p className="text-sm"><span className="font-medium">Why I chose it:</span> Reliable, scalable storage for security cameras</p>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="font-medium text-lg mb-2">Network Segmentation</h3>
                      <p className="text-muted-foreground mb-2">VLAN Structure</p>
                      <div className="space-y-2">
                        <p className="text-sm"><span className="font-medium">VLAN 10:</span> Management (network devices, controllers)</p>
                        <p className="text-sm"><span className="font-medium">VLAN 20:</span> Lab Environment (kubernetes, storage clusters)</p>
                        <p className="text-sm"><span className="font-medium">VLAN 30:</span> IoT Devices</p>
                        <p className="text-sm"><span className="font-medium">VLAN 40:</span> Media Streaming</p>
                        <p className="text-sm"><span className="font-medium">VLAN 50:</span> Guest Network</p>
                        <p className="text-sm"><span className="font-medium">VLAN 60:</span> Security Systems</p>
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
