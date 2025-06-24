import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageCircle, AlertTriangle, CheckCircle, Target, Users, Brain, Lightbulb, TrendingUp } from 'lucide-react';

interface CustomerPersona {
  id: string;
  name: string;
  role: string;
  company: string;
  painPoints: string[];
  goals: string[];
  communicationStyle: 'direct' | 'analytical' | 'relationship-focused' | 'detail-oriented';
  skepticismLevel: 'low' | 'medium' | 'high';
  timeConstraints: 'flexible' | 'busy' | 'very_busy';
}

interface Question {
  id: string;
  text: string;
  type: 'open' | 'validation' | 'problem' | 'solution' | 'pricing' | 'workflow';
  bias: 'leading' | 'neutral' | 'assumption-heavy';
  effectiveness: number; // 1-10 scale
}

interface InterviewResult {
  persona: CustomerPersona;
  questions: Question[];
  insights: string[];
  redFlags: string[];
  score: number;
  timeElapsed: number;
  recommendation: string;
}

const CUSTOMER_PERSONAS: CustomerPersona[] = [
  {
    id: 'sarah_cto',
    name: 'Sarah Chen',
    role: 'CTO',
    company: 'Mid-size SaaS (200 employees)',
    painPoints: ['Legacy system maintenance', 'Security compliance', 'Team scaling', 'Technical debt'],
    goals: ['Modernize infrastructure', 'Improve team velocity', 'Reduce downtime'],
    communicationStyle: 'analytical',
    skepticismLevel: 'high',
    timeConstraints: 'very_busy'
  },
  {
    id: 'mike_founder',
    name: 'Mike Rodriguez',
    role: 'Technical Founder',
    company: 'Early-stage startup (15 employees)',
    painPoints: ['Limited resources', 'Product-market fit uncertainty', 'Hiring challenges'],
    goals: ['Scale efficiently', 'Find PMF', 'Build great team'],
    communicationStyle: 'direct',
    skepticismLevel: 'medium',
    timeConstraints: 'busy'
  },
  {
    id: 'emma_pm',
    name: 'Emma Thompson',
    role: 'Product Manager',
    company: 'Enterprise tech (1000+ employees)',
    painPoints: ['Stakeholder alignment', 'Data-driven decisions', 'User adoption'],
    goals: ['Improve metrics', 'Streamline processes', 'Better user experience'],
    communicationStyle: 'relationship-focused',
    skepticismLevel: 'medium',
    timeConstraints: 'flexible'
  },
  {
    id: 'alex_dev',
    name: 'Alex Kim',
    role: 'Senior Developer',
    company: 'Tech consultancy (50 employees)',
    painPoints: ['Tool fragmentation', 'Context switching', 'Code quality'],
    goals: ['Better development workflow', 'Reduce manual tasks', 'Learn new tech'],
    communicationStyle: 'detail-oriented',
    skepticismLevel: 'low',
    timeConstraints: 'flexible'
  }
];

const SAMPLE_QUESTIONS: Question[] = [
  {
    id: 'q1',
    text: "Tell me about your current development workflow. What's a typical day like?",
    type: 'workflow',
    bias: 'neutral',
    effectiveness: 9
  },
  {
    id: 'q2',
    text: "What's the biggest challenge you face in your role right now?",
    type: 'problem',
    bias: 'neutral',
    effectiveness: 8
  },
  {
    id: 'q3',
    text: "How much would you pay for a tool that solves this problem?",
    type: 'pricing',
    bias: 'assumption-heavy',
    effectiveness: 3
  },
  {
    id: 'q4',
    text: "Would you use our AI-powered solution to streamline your workflow?",
    type: 'solution',
    bias: 'leading',
    effectiveness: 2
  },
  {
    id: 'q5',
    text: "Can you walk me through the last time this problem caused issues for your team?",
    type: 'validation',
    bias: 'neutral',
    effectiveness: 9
  },
  {
    id: 'q6',
    text: "How do you currently handle [specific workflow step]?",
    type: 'workflow',
    bias: 'neutral',
    effectiveness: 8
  },
  {
    id: 'q7',
    text: "What tools have you tried before that didn't work out?",
    type: 'validation',
    bias: 'neutral',
    effectiveness: 7
  },
  {
    id: 'q8',
    text: "This sounds like exactly what you need, right?",
    type: 'validation',
    bias: 'leading',
    effectiveness: 1
  }
];

export default function CustomerDevelopmentSimulator() {
  const [selectedPersona, setSelectedPersona] = useState<CustomerPersona | null>(null);
  const [currentQuestions, setCurrentQuestions] = useState<Question[]>([]);
  const [customQuestion, setCustomQuestion] = useState('');
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [results, setResults] = useState<InterviewResult | null>(null);
  const [currentTab, setCurrentTab] = useState('setup');

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (interviewStarted && !results) {
      interval = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [interviewStarted, results]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const startInterview = () => {
    if (!selectedPersona) return;
    setInterviewStarted(true);
    setTimeElapsed(0);
    setCurrentTab('interview');
  };

  const addQuestion = (question: Question) => {
    setCurrentQuestions(prev => [...prev, question]);
  };

  const addCustomQuestion = () => {
    if (!customQuestion.trim()) return;
    
    const newQuestion: Question = {
      id: `custom_${Date.now()}`,
      text: customQuestion,
      type: 'open',
      bias: 'neutral', // Let user categorize this
      effectiveness: 5 // Neutral starting point
    };
    
    addQuestion(newQuestion);
    setCustomQuestion('');
  };

  const endInterview = () => {
    if (!selectedPersona) return;

    const score = calculateInterviewScore();
    const insights = generateInsights();
    const redFlags = identifyRedFlags();
    const recommendation = generateRecommendation(score);

    const result: InterviewResult = {
      persona: selectedPersona,
      questions: currentQuestions,
      insights,
      redFlags,
      score,
      timeElapsed,
      recommendation
    };

    setResults(result);
    setCurrentTab('results');
  };

  const calculateInterviewScore = (): number => {
    if (currentQuestions.length === 0) return 0;
    
    const avgEffectiveness = currentQuestions.reduce((sum, q) => sum + q.effectiveness, 0) / currentQuestions.length;
    const biasDeduction = currentQuestions.filter(q => q.bias === 'leading').length * 10;
    const assumptionDeduction = currentQuestions.filter(q => q.bias === 'assumption-heavy').length * 5;
    
    const baseScore = (avgEffectiveness / 10) * 100;
    const finalScore = Math.max(0, baseScore - biasDeduction - assumptionDeduction);
    
    return Math.round(finalScore);
  };

  const generateInsights = (): string[] => {
    const insights = [];
    
    const openQuestions = currentQuestions.filter(q => q.type === 'open' || q.type === 'workflow');
    const validationQuestions = currentQuestions.filter(q => q.type === 'validation');
    
    if (openQuestions.length >= 3) {
      insights.push("Good job focusing on open-ended questions to understand the customer's world");
    }
    
    if (validationQuestions.length >= 2) {
      insights.push("Strong validation approach - you're testing assumptions with specific examples");
    }
    
    if (currentQuestions.some(q => q.type === 'workflow')) {
      insights.push("Excellent focus on understanding current workflows and processes");
    }
    
    const highQualityQuestions = currentQuestions.filter(q => q.effectiveness >= 7);
    if (highQualityQuestions.length >= currentQuestions.length * 0.7) {
      insights.push("Most of your questions were well-crafted and likely to yield valuable insights");
    }
    
    return insights;
  };

  const identifyRedFlags = (): string[] => {
    const redFlags = [];
    
    const leadingQuestions = currentQuestions.filter(q => q.bias === 'leading');
    if (leadingQuestions.length > 2) {
      redFlags.push("Too many leading questions - you may be confirming bias rather than discovering truth");
    }
    
    const solutionQuestions = currentQuestions.filter(q => q.type === 'solution');
    if (solutionQuestions.length > 1 && currentQuestions.filter(q => q.type === 'problem').length < 2) {
      redFlags.push("Jumping to solutions before fully understanding the problem space");
    }
    
    if (currentQuestions.filter(q => q.type === 'pricing').length > 0 && currentQuestions.filter(q => q.type === 'validation').length < 2) {
      redFlags.push("Asking about pricing before validating the problem exists");
    }
    
    if (timeElapsed > 1800) { // 30 minutes
      redFlags.push("Interview running long - respect the customer's time constraints");
    }
    
    return redFlags;
  };

  const generateRecommendation = (score: number): string => {
    if (score >= 80) {
      return "Excellent interview technique! You demonstrated strong customer development skills with neutral, insightful questions.";
    } else if (score >= 60) {
      return "Good foundation, but watch for leading questions and ensure you're validating problems before discussing solutions.";
    } else if (score >= 40) {
      return "Room for improvement. Focus more on open-ended questions and avoid assuming you know the customer's needs.";
    } else {
      return "Significant improvement needed. Review customer development best practices and practice with neutral, discovery-focused questions.";
    }
  };

  const resetSimulation = () => {
    setSelectedPersona(null);
    setCurrentQuestions([]);
    setCustomQuestion('');
    setInterviewStarted(false);
    setTimeElapsed(0);
    setResults(null);
    setCurrentTab('setup');
  };

  const getPersonaResponse = (question: Question): string => {
    if (!selectedPersona) return "";
    
    // Simple response generator based on persona traits
    const responses = {
      analytical: "Let me think about the data behind that...",
      direct: "Here's the bottom line:",
      'relationship-focused': "That's interesting, let me share my perspective...",
      'detail-oriented': "I need to give you the full context first..."
    };
    
    return responses[selectedPersona.communicationStyle];
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="w-6 h-6 text-blue-600" />
            Customer Development Interview Simulator
          </CardTitle>
          <p className="text-gray-600 dark:text-gray-300">
            Practice customer interview techniques with realistic personas. Learn to ask better questions and avoid common biases.
          </p>
        </CardHeader>
      </Card>

      <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="setup">Setup</TabsTrigger>
          <TabsTrigger value="interview" disabled={!selectedPersona}>Interview</TabsTrigger>
          <TabsTrigger value="results" disabled={!results}>Results</TabsTrigger>
        </TabsList>

        <TabsContent value="setup" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Choose Your Customer Persona
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {CUSTOMER_PERSONAS.map((persona) => (
                  <Card 
                    key={persona.id} 
                    className={`cursor-pointer transition-all ${
                      selectedPersona?.id === persona.id 
                        ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                        : 'hover:shadow-md'
                    }`}
                    onClick={() => setSelectedPersona(persona)}
                  >
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div>
                          <h3 className="font-semibold text-lg">{persona.name}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            {persona.role} at {persona.company}
                          </p>
                        </div>
                        
                        <div className="space-y-2">
                          <div>
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Pain Points</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {persona.painPoints.slice(0, 2).map((pain, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {pain}
                                </Badge>
                              ))}
                              {persona.painPoints.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{persona.painPoints.length - 2} more
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-500">
                              Skepticism: <span className="capitalize">{persona.skepticismLevel}</span>
                            </span>
                            <span className="text-gray-500">
                              Time: <span className="capitalize">{persona.timeConstraints.replace('_', ' ')}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              {selectedPersona && (
                <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <h4 className="font-medium mb-2">Interview Context</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                    You're interviewing {selectedPersona.name} to understand their challenges and validate potential solutions. 
                    They have a {selectedPersona.communicationStyle} communication style and {selectedPersona.skepticismLevel} skepticism level.
                  </p>
                  <Button onClick={startInterview} className="w-full">
                    Start Interview
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="interview" className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600 dark:text-gray-300">
                Interviewing: <span className="font-medium">{selectedPersona?.name}</span>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">
                Time: <span className="font-mono">{formatTime(timeElapsed)}</span>
              </div>
            </div>
            <Button onClick={endInterview} variant="outline">
              End Interview
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Sample Questions</CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Click to add questions to your interview
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                {SAMPLE_QUESTIONS.map((question) => (
                  <div key={question.id} className="p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                    <div className="flex justify-between items-start gap-2">
                      <p className="text-sm flex-1">{question.text}</p>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => addQuestion(question)}
                      >
                        Add
                      </Button>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Badge 
                        variant={question.bias === 'neutral' ? 'default' : 'destructive'} 
                        className="text-xs"
                      >
                        {question.bias}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {question.type}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {question.effectiveness}/10
                      </Badge>
                    </div>
                  </div>
                ))}
                
                <div className="pt-4 border-t">
                  <div className="space-y-2">
                    <Textarea
                      placeholder="Write your own question..."
                      value={customQuestion}
                      onChange={(e) => setCustomQuestion(e.target.value)}
                      className="min-h-[80px]"
                    />
                    <Button onClick={addCustomQuestion} className="w-full" disabled={!customQuestion.trim()}>
                      Add Custom Question
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Your Interview Questions</CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Questions you've asked ({currentQuestions.length})
                </p>
              </CardHeader>
              <CardContent>
                {currentQuestions.length === 0 ? (
                  <p className="text-gray-500 italic text-center py-8">
                    No questions asked yet. Start by selecting questions from the sample list.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {currentQuestions.map((question, index) => (
                      <div key={question.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex items-start gap-2">
                          <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded font-mono">
                            Q{index + 1}
                          </span>
                          <div className="flex-1">
                            <p className="text-sm">{question.text}</p>
                            <div className="flex gap-2 mt-2">
                              <Badge 
                                variant={question.bias === 'neutral' ? 'default' : 'destructive'} 
                                className="text-xs"
                              >
                                {question.bias}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {question.effectiveness}/10
                              </Badge>
                            </div>
                            {selectedPersona && (
                              <p className="text-xs text-gray-500 mt-2 italic">
                                {selectedPersona.name}: "{getPersonaResponse(question)}"
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="results" className="space-y-6">
          {results && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Interview Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                        {results.score}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        Overall Score
                      </div>
                      <Progress value={results.score} className="mt-2" />
                    </div>
                    
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                        {results.questions.length}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        Questions Asked
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                        {formatTime(results.timeElapsed)}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        Interview Duration
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lightbulb className="w-5 h-5 text-green-600" />
                      Key Insights
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {results.insights.length > 0 ? (
                      <ul className="space-y-3">
                        {results.insights.map((insight, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <span className="text-sm">{insight}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-500 italic">No specific insights identified.</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                      Areas for Improvement
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {results.redFlags.length > 0 ? (
                      <ul className="space-y-3">
                        {results.redFlags.map((flag, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                            <span className="text-sm">{flag}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-500 italic">No major red flags identified. Good job!</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="w-5 h-5" />
                    Recommendation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed">{results.recommendation}</p>
                  
                  <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Next Steps:</h4>
                    <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                      <li>• Practice with different personas to build versatility</li>
                      <li>• Focus on "tell me about a time when..." questions</li>
                      <li>• Validate problems before discussing solutions</li>
                      <li>• Ask about current workflows before proposing changes</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-center">
                <Button onClick={resetSimulation} className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Try Another Interview
                </Button>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}