import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { useState } from "react";
import Layout from "@/components/Layout";
import { useAsyncState } from "@/hooks/useAsyncState";
import { Loader2 } from "lucide-react";

const NewsletterPage = () => {
  const [email, setEmail] = useState("");
  const { toast } = useToast();
  const { isLoading, execute } = useAsyncState<void>();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim() || !email.includes('@')) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      await execute(async () => {
        const response = await fetch('/api/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });
        
        if (!response.ok) {
          const error = await response.text();
          throw new Error(error || 'Subscription failed');
        }
        
        return response.json();
      });
      
      toast({
        title: "Thanks for subscribing!",
        description: "You'll receive our next newsletter soon.",
      });
      setEmail("");
    } catch (error) {
      toast({
        title: "Subscription failed",
        description: "Please try again later or contact support.",
        variant: "destructive",
      });
    }
  };

  return (
    <Layout>
      <div className="container max-w-4xl py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            Join 4,700+ PMs & security engineers who get one tactical "ship-it" playbook in their inbox every Monday.
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            No fluff. Just the frameworks, templates, and war stories that turn B2B roadmaps into products customers pay for.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Trusted by 4,700 product and security pros on LinkedIn—now in your inbox.
          </p>
        </div>

        {/* Main Content */}
        <div className="grid gap-8 md:grid-cols-2">
          {/* Left Column - Benefits & Sample */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>What You'll Get</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-primary"
                    >
                      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                      <path d="m9 12 2 2 4-4" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold">Bi-weekly Playbooks</h3>
                    <p className="text-muted-foreground">
                      5-min tactical guides you can use today.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-primary"
                    >
                      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                      <path d="m9 12 2 2 4-4" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold">Real-World Breakdowns</h3>
                    <p className="text-muted-foreground">
                      Teardown of actual product wins & flops.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-primary"
                    >
                      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                      <path d="m9 12 2 2 4-4" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold">Copy-Paste Templates</h3>
                    <p className="text-muted-foreground">
                      PM scorecards, roadmap decks, KPI sheets.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Why Subscribe</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="bg-primary/10 p-2 rounded-full">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-primary"
                      >
                        <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                        <path d="M12 8v4l3 3" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold">Skip the Noise</h3>
                      <p className="text-sm text-muted-foreground">
                        I distill 20+ articles & threads into one actionable brief.
                      </p>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-start gap-4">
                    <div className="bg-primary/10 p-2 rounded-full">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-primary"
                      >
                        <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                        <path d="M12 8v4l3 3" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold">Built at Scale</h3>
                      <p className="text-sm text-muted-foreground">
                        Lessons from ThreatKey, DoorDash, Snap, and Carta that shipped to millions.
                      </p>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-start gap-4">
                    <div className="bg-primary/10 p-2 rounded-full">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-primary"
                      >
                        <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                        <path d="M12 8v4l3 3" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold">Early Access</h3>
                      <p className="text-sm text-muted-foreground">
                        Subscribers see drafts of my deep-dive articles before LinkedIn does.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Newsletter Signup */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Grab the Playbook + Free GTM Reality-Check Template</CardTitle>
              <CardDescription>
                Join product managers and founders getting actionable insights every other Monday.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Subscribing...
                    </>
                  ) : (
                    'Send It →'
                  )}
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  No spam. Unsubscribe in two clicks.
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default NewsletterPage; 