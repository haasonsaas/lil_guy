import Layout from '@/components/Layout'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Laptop,
  Code,
  Monitor,
  Headphones,
  Coffee,
  Smartphone,
  Keyboard,
  Mouse,
  Network,
} from 'lucide-react'
import { Link } from 'react-router-dom'

export default function UsesPage() {
  return (
    <Layout>
      <section className="py-12 md:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4 font-serif">
              My Setup & Tools
            </h1>
            <p className="text-muted-foreground text-lg">
              The hardware, software, and tools I use daily for work and
              productivity
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
              <TabsTrigger
                value="productivity"
                className="flex items-center gap-2"
              >
                <Coffee size={16} /> Productivity
              </TabsTrigger>
              <TabsTrigger value="audio" className="flex items-center gap-2">
                <Headphones size={16} /> Audio
              </TabsTrigger>
              <TabsTrigger
                value="networking"
                className="flex items-center gap-2"
              >
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
                    <CardDescription>
                      My primary development environment
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div>
                        <h3 className="font-medium text-lg mb-2">
                          MacBook Pro 14" (2024)
                        </h3>
                        <p className="text-muted-foreground mb-2">
                          M4 Max, 128GB RAM, 2TB SSD
                        </p>
                        <p className="text-sm mb-2">
                          Why I love it: The perfect balance of power and
                          portability. The M4 chip handles everything from heavy
                          IDE loads to multiple Docker containers without
                          breaking a sweat. The Liquid Retina XDR display makes
                          coding and design work a joy.
                        </p>
                        <p className="text-sm">Price: $3,199 (base model)</p>
                      </div>

                      <div>
                        <h3 className="font-medium text-lg mb-2">
                          MacBook Air (2024)
                        </h3>
                        <p className="text-muted-foreground mb-2">
                          M3, 24GB RAM, 8-core CPU (4 performance and 4
                          efficiency)
                        </p>
                        <p className="text-sm mb-2">
                          Why I love it: Incredibly portable while still being
                          powerful enough for development work. Perfect for
                          working on-the-go or from coffee shops. The M3 chip
                          provides excellent performance while maintaining
                          incredible battery life.
                        </p>
                        <p className="text-sm">Price: $1,299 (base model)</p>
                      </div>

                      <div>
                        <h3 className="font-medium text-lg mb-2">
                          Custom Gaming PC
                        </h3>
                        <p className="text-muted-foreground mb-2">
                          High-performance workstation for gaming and
                          development
                        </p>
                        <div className="space-y-2">
                          <p className="text-sm">
                            <span className="font-medium">CPU:</span> AMD Ryzen
                            7 9800X3D OEM Tray CPU (8 Cores, 16 Threads, 4.7GHz
                            Base, 5.2GHz Turbo)
                          </p>
                          <p className="text-sm">
                            <span className="font-medium">CPU Cooler:</span>{' '}
                            Corsair iCUE LINK TITAN 360 RX LCD Liquid CPU Cooler
                            Black
                          </p>
                          <p className="text-sm">
                            <span className="font-medium">Motherboard:</span>{' '}
                            ASUS ROG STRIX X870E-E GAMING WIFI ATX AM5
                          </p>
                          <p className="text-sm">
                            <span className="font-medium">Memory:</span> Corsair
                            VENGEANCE RGB DDR5 64GB (2x 32GB) 6000MT/s
                          </p>
                          <p className="text-sm">
                            <span className="font-medium">GPU:</span> ROG Astral
                            GeForce RTX 5090 32GB GDDR7 OC Edition
                          </p>
                          <p className="text-sm">
                            <span className="font-medium">Storage:</span> 2x
                            Western Digital Black SN850X 4TB NVMe SSD
                          </p>
                          <p className="text-sm">
                            <span className="font-medium">Power Supply:</span>{' '}
                            Seasonic VERTEX PX-1200 ATX 3.0 1200W 80 PLUS
                            Platinum
                          </p>
                          <p className="text-sm">
                            <span className="font-medium">Case:</span> NZXT H7
                            Flow Mid-Tower ATX Case Black
                          </p>
                          <p className="text-sm">
                            <span className="font-medium">Fans:</span> Corsair
                            iCUE LINK RX140 RGB 140mm PWM (Front/Rear) & RX120
                            MAX RGB 120mm PWM (Bottom)
                          </p>
                          <p className="text-sm">
                            <span className="font-medium">OS:</span> Microsoft
                            Windows 11 Pro 64-bit
                          </p>
                        </div>
                        <p className="text-sm mt-2">
                          Why I love it: This beast of a machine handles
                          everything from AAA gaming to heavy development
                          workloads with ease. The combination of the Ryzen 7
                          9800X3D and RTX 5090 provides exceptional performance
                          for both gaming and GPU-accelerated development tasks.
                        </p>
                      </div>

                      <div>
                        <h3 className="font-medium text-lg mb-2">
                          Wooting 80HE
                        </h3>
                        <p className="text-muted-foreground mb-2">
                          Lekker Linear 60 switches with PBT keycaps
                        </p>
                        <p className="text-sm mb-2">
                          Key Features: Analog input, rapid trigger, per-key
                          RGB, USB-C
                        </p>
                        <p className="text-sm mb-2">
                          Why I love it: The analog input and rapid trigger
                          features make it perfect for both gaming and typing.
                          The Lekker switches provide a smooth, consistent feel,
                          and the build quality is exceptional. The TKL layout
                          gives me more desk space while keeping the function
                          row.
                        </p>
                        <p className="text-sm">Price: $199</p>
                      </div>

                      <div>
                        <h3 className="font-medium text-lg mb-2">
                          Logitech MX Master 3
                        </h3>
                        <p className="text-muted-foreground mb-2">
                          Ergonomic design, customizable buttons, Darkfield
                          tracking
                        </p>
                        <p className="text-sm mb-2">
                          Why it's essential: The thumb rest and ergonomic shape
                          prevent wrist strain during long work sessions. The
                          horizontal scroll wheel is invaluable for timeline
                          editing and spreadsheets.
                        </p>
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
                  <CardDescription>
                    My mobile productivity tools
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-medium text-lg mb-2">
                        iPhone 16 Pro
                      </h3>
                      <p className="text-muted-foreground mb-2">
                        512GB Storage
                      </p>

                      <h4 className="font-medium mt-4 mb-2">Use Cases:</h4>
                      <ul className="list-disc pl-6 mb-4 space-y-1">
                        <li>Development: Testing mobile-responsive designs</li>
                        <li>
                          Productivity: Quick email triage and calendar
                          management
                        </li>
                        <li>
                          Photography: Capturing reference shots for design work
                        </li>
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
                  <CardDescription>
                    Software I use for coding and development
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-medium text-lg mb-2">VS Code</h3>
                      <p className="text-muted-foreground mb-2">
                        Theme: GitHub Dark
                      </p>

                      <h4 className="font-medium mt-4 mb-2">
                        Essential Extensions:
                      </h4>
                      <ul className="list-disc pl-6 mb-4 space-y-1">
                        <li>GitLens (Git supercharged)</li>
                        <li>Prettier (Code formatting)</li>
                        <li>ESLint (JavaScript linting)</li>
                        <li>Docker (Container management)</li>
                        <li>REST Client (API testing)</li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="font-medium text-lg mb-2">Cursor</h3>
                      <p className="text-muted-foreground mb-2">
                        AI-powered IDE
                      </p>

                      <h4 className="font-medium mt-4 mb-2">Key Features:</h4>
                      <ul className="list-disc pl-6 mb-4 space-y-1">
                        <li>AI pair programming assistant</li>
                        <li>Codebase-aware AI completions</li>
                        <li>Semantic code search</li>
                        <li>Built-in terminal and Git integration</li>
                      </ul>

                      <p className="text-sm">
                        Why I love it: Cursor combines the familiarity of VS
                        Code with powerful AI capabilities that make coding more
                        efficient. The AI assistant understands my codebase
                        context and provides relevant suggestions, while the
                        semantic search makes it easy to find code across the
                        project.
                      </p>
                    </div>

                    <div>
                      <h3 className="font-medium text-lg mb-2">Claude Code</h3>
                      <p className="text-muted-foreground mb-2">
                        AI coding assistant with file system access
                      </p>
                      <p className="text-sm mb-2">
                        My primary AI development partner for complex
                        implementations, architecture decisions, and creative
                        problem-solving. Unlike other AI tools, Claude Code can
                        read, write, and execute code in my actual development
                        environment.
                      </p>
                      <p className="text-sm">
                        <Link to="/ai" className="text-primary hover:underline">
                          → Read more about my complete AI workflow and
                          philosophy
                        </Link>
                      </p>
                    </div>

                    <div>
                      <h3 className="font-medium text-lg mb-2">
                        Alacritty Terminal
                      </h3>
                      <p className="text-muted-foreground mb-2">
                        Configuration: GPU-accelerated, custom key bindings
                      </p>
                      <p className="text-sm mb-2">Color Scheme: Dracula</p>
                      <p className="text-sm mb-2">
                        Shell: Fish with Starship prompt
                      </p>
                      <p className="text-sm">
                        Why I switched from iTerm2: Noticeably faster rendering,
                        especially with large log outputs
                      </p>
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
                  <CardDescription>
                    Tools that help me stay productive
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-medium text-lg mb-2">Raycast</h3>
                      <p className="text-muted-foreground mb-2">
                        Replaces: Spotlight and Alfred
                      </p>

                      <h4 className="font-medium mt-4 mb-2">
                        Favorite Features:
                      </h4>
                      <ul className="list-disc pl-6 mb-4 space-y-1">
                        <li>Window management</li>
                        <li>Clipboard history</li>
                        <li>Custom scripts for development workflows</li>
                        <li>Quick calculator and unit conversion</li>
                      </ul>

                      <h4 className="font-medium mt-4 mb-2">
                        Must-Have Extensions:
                      </h4>
                      <ul className="list-disc pl-6 mb-4 space-y-1">
                        <li>DevDocs integration</li>
                        <li>GitHub pull requests</li>
                        <li>Notion quick add</li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="font-medium text-lg mb-2">Superhuman</h3>
                      <p className="text-muted-foreground mb-2">
                        Email Philosophy: Inbox Zero
                      </p>

                      <h4 className="font-medium mt-4 mb-2">Key Shortcuts:</h4>
                      <ul className="list-disc pl-6 mb-4 space-y-1">
                        <li>Cmd + K: Command palette</li>
                        <li>Cmd + Shift + U: Mark as unread</li>
                        <li>Cmd + Enter: Send</li>
                      </ul>

                      <p className="text-sm">
                        Why It's Worth $30/month: The combination of keyboard
                        shortcuts, AI-powered triage, and instant search saves
                        me 2-3 hours weekly. It's still incredibly expensive for
                        an email client, but so far the time savings are worth
                        it.
                      </p>
                    </div>

                    <div>
                      <h3 className="font-medium text-lg mb-2">
                        Notion Calendar
                      </h3>
                      <p className="text-muted-foreground mb-2">
                        Integration: Syncs with Google Calendar
                      </p>

                      <h4 className="font-medium mt-4 mb-2">Best Features:</h4>
                      <ul className="list-disc pl-6 mb-4 space-y-1">
                        <li>Meeting templates</li>
                        <li>Automatic time blocking</li>
                        <li>Task integration with Notion workspaces</li>
                      </ul>

                      <p className="text-sm">
                        How I Use It: Planning sprints, tracking deadlines, and
                        managing meeting notes
                      </p>
                    </div>

                    <div>
                      <h3 className="font-medium text-lg mb-2">
                        💰 Cost Breakdown
                      </h3>
                      <p className="text-muted-foreground mb-2">
                        Monthly subscription costs for productivity tools
                      </p>
                      <ul className="list-disc pl-6 mb-4 space-y-1">
                        <li>Superhuman: $30/month</li>
                        <li>Notion Calendar: $8/month</li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="font-medium text-lg mb-2">
                        Task Management
                      </h3>
                      <p className="text-muted-foreground mb-2">
                        Tools for organizing and tracking work
                      </p>

                      <h4 className="font-medium mt-4 mb-2">Linear</h4>
                      <p className="text-sm mb-2">
                        Issue tracking and project management tool that's
                        perfect for software development. The keyboard-first
                        interface and GitHub integration make it a joy to use.
                      </p>
                      <p className="text-sm">Cost: Free for small teams</p>

                      <h4 className="font-medium mt-4 mb-2">Things 3</h4>
                      <p className="text-sm mb-2">
                        Beautiful and intuitive task manager for personal
                        projects. The natural language input and quick entry
                        make it easy to capture tasks on the go.
                      </p>
                      <p className="text-sm">
                        Cost: $49.99 (one-time purchase)
                      </p>
                    </div>

                    <div>
                      <h3 className="font-medium text-lg mb-2">Frameworks</h3>
                      <p className="text-muted-foreground mb-2">
                        To help others build better products, I've created a
                        collection of frameworks and templates that I use in my
                        own work. These are battle-tested approaches that have
                        helped me and my teams ship better software faster.
                      </p>
                      <a
                        href="https://frameworks.haasonsaas.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        frameworks.haasonsaas.com →
                      </a>
                    </div>

                    <div>
                      <h3 className="font-medium text-lg mb-2">Note Taking</h3>
                      <p className="text-muted-foreground mb-2">
                        Tools for capturing and organizing ideas
                      </p>

                      <h4 className="font-medium mt-4 mb-2">Obsidian</h4>
                      <p className="text-sm mb-2">
                        Local-first note-taking app with powerful linking
                        capabilities. The graph view helps visualize connections
                        between ideas, and the plugin ecosystem is extensive.
                      </p>
                      <p className="text-sm">Cost: Free for personal use</p>

                      <h4 className="font-medium mt-4 mb-2">Notion</h4>
                      <p className="text-sm mb-2">
                        All-in-one workspace for notes, docs, and project
                        management. The database features and templates make it
                        incredibly versatile.
                      </p>
                      <p className="text-sm">Cost: Free for personal use</p>
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
                      <h3 className="font-medium text-lg mb-2">
                        HIFIMAN HE1000 Stealth
                      </h3>
                      <p className="text-muted-foreground mb-2">
                        Planar magnetic audiophile headphones
                      </p>
                      <div className="space-y-2">
                        <p className="text-sm">
                          <span className="font-medium">Features:</span> Stealth
                          magnet design, planar magnetic drivers, 8Hz-65kHz
                          frequency response
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Comfort:</span> Premium
                          materials, ergonomic design, lightweight construction
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Why I love it:</span>{' '}
                          Exceptional detail retrieval, wide soundstage, and
                          natural timbre. The Stealth magnet design provides
                          improved efficiency and better bass response.
                        </p>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-medium text-lg mb-2">
                        Massdrop x Sennheiser HD 6XX Headphones
                      </h3>
                      <p className="text-muted-foreground mb-2">
                        Open-back audiophile headphones
                      </p>
                      <div className="space-y-2">
                        <p className="text-sm">
                          <span className="font-medium">Features:</span>{' '}
                          Open-back design, 300-ohm impedance, 10Hz-41kHz
                          frequency response
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Comfort:</span> Velour
                          ear pads, adjustable headband, lightweight design
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Why I love it:</span>{' '}
                          Exceptional sound quality with detailed mids and
                          highs, comfortable for long listening sessions, and
                          excellent value for audiophile-grade headphones
                        </p>
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
                  <CardDescription>
                    My Ubiquiti-based home network setup
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-medium text-lg mb-2">
                        Dream Machine Pro Max
                      </h3>
                      <p className="text-muted-foreground mb-2">
                        Core Network Controller & Gateway
                      </p>
                      <div className="space-y-2">
                        <p className="text-sm">
                          <span className="font-medium">Features:</span> 10G
                          throughput, IPS/IDS, multiple site-to-site VPNs,
                          redundant storage for security footage
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Use Cases:</span>{' '}
                          Running multiple isolated VLANs, supporting
                          container-based services, managing site-to-site VPNs,
                          handling IPS/IDS for network security monitoring
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Why I chose it:</span>{' '}
                          Enterprise-grade performance with consumer-friendly
                          interface, perfect for handling 10G throughput and
                          complex network requirements
                        </p>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-medium text-lg mb-2">
                        Layer 3 Pro Max 24 PoE Switch
                      </h3>
                      <p className="text-muted-foreground mb-2">
                        Network Backbone
                      </p>
                      <div className="space-y-2">
                        <p className="text-sm">
                          <span className="font-medium">Features:</span>{' '}
                          Inter-VLAN routing, 10G uplinks, PoE power delivery
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Capacity:</span> 24
                          ports with PoE+ support
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Use Cases:</span>{' '}
                          Handling inter-VLAN routing, powering security
                          cameras, access points, IP phones, and IoT controllers
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Why I chose it:</span>{' '}
                          Perfect balance of power and flexibility for home lab
                          use, with sufficient PoE budget for all devices
                        </p>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-medium text-lg mb-2">
                        U7 Pro Max Access Point
                      </h3>
                      <p className="text-muted-foreground mb-2">
                        Wireless Coverage
                      </p>
                      <div className="space-y-2">
                        <p className="text-sm">
                          <span className="font-medium">Features:</span> Wi-Fi
                          6E, high-density support, seamless roaming
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Coverage:</span>{' '}
                          Whole-home coverage with optimal performance
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Implementation:</span>{' '}
                          Mesh networking with wireless uplink for consistent
                          coverage and seamless roaming
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Why I chose it:</span>{' '}
                          Future-proof wireless performance for all devices,
                          with excellent high-density support
                        </p>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-medium text-lg mb-2">
                        UNVR (UniFi Network Video Recorder)
                      </h3>
                      <p className="text-muted-foreground mb-2">
                        Security Storage
                      </p>
                      <div className="space-y-2">
                        <p className="text-sm">
                          <span className="font-medium">Storage:</span> 4x 16TB
                          drives in RAID 10
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Retention:</span> 30-day
                          footage retention
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Optimization:</span>{' '}
                          Implemented edge caching and storage tiering for 70%
                          reduction in main storage I/O
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Why I chose it:</span>{' '}
                          Reliable, scalable storage for security cameras with
                          efficient I/O management
                        </p>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-medium text-lg mb-2">
                        Network Segmentation
                      </h3>
                      <p className="text-muted-foreground mb-2">
                        VLAN Structure
                      </p>
                      <div className="space-y-2">
                        <p className="text-sm">
                          <span className="font-medium">VLAN 10:</span>{' '}
                          Management (network devices, controllers)
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">VLAN 20:</span> Lab
                          Environment (kubernetes, storage clusters)
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">VLAN 30:</span> IoT
                          Devices
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">VLAN 40:</span> Media
                          Streaming
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">VLAN 50:</span> Guest
                          Network
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">VLAN 60:</span> Security
                          Systems
                        </p>
                        <p className="text-sm mt-2">
                          <span className="font-medium">Security:</span> Each
                          VLAN has specific firewall rules and traffic policies
                          to maintain security while allowing necessary
                          inter-VLAN routing
                        </p>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-medium text-lg mb-2">
                        Synology RS822+ & RX418 Expansion
                      </h3>
                      <p className="text-muted-foreground mb-2">
                        Storage & Backup Solution
                      </p>
                      <div className="space-y-2">
                        <p className="text-sm">
                          <span className="font-medium">
                            Main Unit (RS822+):
                          </span>{' '}
                          4-bay rackmount NAS with 2.5GbE connectivity, Intel
                          C3538 quad-core processor, 4GB DDR4 ECC RAM
                          (expandable to 32GB)
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">
                            Expansion Unit (RX418):
                          </span>{' '}
                          4-bay expansion unit adding 4 additional drive bays
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">
                            Storage Configuration:
                          </span>{' '}
                          8x 16TB drives in RAID 6 for optimal capacity and
                          redundancy
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Use Cases:</span>{' '}
                          Centralized storage for media, backups, and
                          development environments. Running Docker containers
                          and virtual machines.
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Why I chose it:</span>{' '}
                          Enterprise-grade reliability in a compact form factor.
                          The ability to expand storage with the RX418 unit
                          provides future-proof scalability. Synology's DSM
                          operating system offers excellent features for both
                          home and business use.
                        </p>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-medium text-lg mb-2">
                        Network Services
                      </h3>
                      <p className="text-muted-foreground mb-2">
                        Core Services
                      </p>
                      <div className="space-y-2">
                        <p className="text-sm">
                          <span className="font-medium">Monitoring:</span>{' '}
                          Prometheus for metrics collection, Grafana for
                          visualization, custom alerting via webhook integration
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Security:</span> IPS/IDS
                          with custom rulesets, network flow analysis, automated
                          threat detection
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Lab Environment:</span>{' '}
                          Kubernetes cluster for container orchestration, CI/CD
                          pipeline for testing, development environments
                        </p>
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
  )
}
