
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Laptop, Code, Monitor, Headphones, Coffee } from 'lucide-react';

export default function UsesPage() {
  return (
    <Layout>
      <section className="py-12 md:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4 font-serif">My Setup & Tools</h1>
            <p className="text-muted-foreground text-lg">
              The hardware, software, and tools I use daily for work and content creation
            </p>
          </div>
          
          <Tabs defaultValue="hardware" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="hardware" className="flex items-center gap-2">
                <Laptop size={16} />
                <span>Hardware</span>
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
                      <span>Computer Setup</span>
                    </CardTitle>
                    <CardDescription>My primary workstation configuration</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-4">
                      <li className="flex justify-between items-center border-b pb-2">
                        <span className="font-medium">Primary Computer</span>
                        <span className="text-muted-foreground">MacBook Pro 16" (M1 Max, 64GB RAM)</span>
                      </li>
                      <li className="flex justify-between items-center border-b pb-2">
                        <span className="font-medium">Secondary Computer</span>
                        <span className="text-muted-foreground">Custom PC (AMD Ryzen 9, 64GB RAM, RTX 3090)</span>
                      </li>
                      <li className="flex justify-between items-center border-b pb-2">
                        <span className="font-medium">Displays</span>
                        <span className="text-muted-foreground">2× Dell UltraSharp 32" 4K</span>
                      </li>
                      <li className="flex justify-between items-center border-b pb-2">
                        <span className="font-medium">Keyboard</span>
                        <span className="text-muted-foreground">Keychron Q1 (Custom)</span>
                      </li>
                      <li className="flex justify-between items-center">
                        <span className="font-medium">Mouse</span>
                        <span className="text-muted-foreground">Logitech MX Master 3</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Headphones size={20} /> 
                      <span>Audio & Video</span>
                    </CardTitle>
                    <CardDescription>Equipment for content creation and meetings</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-4">
                      <li className="flex justify-between items-center border-b pb-2">
                        <span className="font-medium">Microphone</span>
                        <span className="text-muted-foreground">Shure SM7B with Cloudlifter</span>
                      </li>
                      <li className="flex justify-between items-center border-b pb-2">
                        <span className="font-medium">Audio Interface</span>
                        <span className="text-muted-foreground">Focusrite Scarlett 2i2</span>
                      </li>
                      <li className="flex justify-between items-center border-b pb-2">
                        <span className="font-medium">Headphones</span>
                        <span className="text-muted-foreground">Sony WH-1000XM4</span>
                      </li>
                      <li className="flex justify-between items-center">
                        <span className="font-medium">Camera</span>
                        <span className="text-muted-foreground">Sony A6400 (as webcam)</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="software">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Code size={20} /> 
                    <span>Development & Design Tools</span>
                  </CardTitle>
                  <CardDescription>Software I use for coding and design work</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-4">
                    <li className="flex justify-between items-center border-b pb-2">
                      <span className="font-medium">Code Editor</span>
                      <span className="text-muted-foreground">VS Code with GitHub Copilot</span>
                    </li>
                    <li className="flex justify-between items-center border-b pb-2">
                      <span className="font-medium">Terminal</span>
                      <span className="text-muted-foreground">iTerm2 with Oh My Zsh</span>
                    </li>
                    <li className="flex justify-between items-center border-b pb-2">
                      <span className="font-medium">Design Tools</span>
                      <span className="text-muted-foreground">Figma, Adobe Creative Suite</span>
                    </li>
                    <li className="flex justify-between items-center border-b pb-2">
                      <span className="font-medium">Browser</span>
                      <span className="text-muted-foreground">Arc by The Browser Company</span>
                    </li>
                    <li className="flex justify-between items-center border-b pb-2">
                      <span className="font-medium">Note Taking</span>
                      <span className="text-muted-foreground">Notion and Obsidian</span>
                    </li>
                    <li className="flex justify-between items-center">
                      <span className="font-medium">Database Tools</span>
                      <span className="text-muted-foreground">TablePlus, MongoDB Compass</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="productivity">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Coffee size={20} /> 
                    <span>Productivity & Lifestyle</span>
                  </CardTitle>
                  <CardDescription>Tools and items that help me stay productive</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-4">
                    <li className="flex justify-between items-center border-b pb-2">
                      <span className="font-medium">Task Management</span>
                      <span className="text-muted-foreground">Todoist Premium</span>
                    </li>
                    <li className="flex justify-between items-center border-b pb-2">
                      <span className="font-medium">Calendar</span>
                      <span className="text-muted-foreground">Google Calendar with Calendly</span>
                    </li>
                    <li className="flex justify-between items-center border-b pb-2">
                      <span className="font-medium">Email</span>
                      <span className="text-muted-foreground">Superhuman</span>
                    </li>
                    <li className="flex justify-between items-center border-b pb-2">
                      <span className="font-medium">Password Manager</span>
                      <span className="text-muted-foreground">1Password</span>
                    </li>
                    <li className="flex justify-between items-center border-b pb-2">
                      <span className="font-medium">Writing Setup</span>
                      <span className="text-muted-foreground">iA Writer and Grammarly</span>
                    </li>
                    <li className="flex justify-between items-center">
                      <span className="font-medium">Coffee Setup</span>
                      <span className="text-muted-foreground">Fellow Stagg EKG and Chemex</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </Layout>
  );
}
