import { useState } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Book, BookOpen, Star } from 'lucide-react';

// Helper function to get placeholder image path
const getPlaceholderImage = (text: string) => {
  const cleanText = text.toLowerCase().replace(/[^a-z0-9]/g, '-');
  return `/placeholders/200x300-${cleanText}.png`;
};

export default function ReadingPage() {
  const [bookView, setBookView] = useState('grid');
  
  const currentBooks = [
    {
      title: "The Age of AI: And Our Human Future",
      author: "Henry Kissinger, Eric Schmidt, Daniel Huttenlocher",
      category: "Technology",
      rating: 4,
      progress: 65,
      cover: getPlaceholderImage("AI Future")
    },
    {
      title: "Working in Public: The Making and Maintenance of Open Source Software",
      author: "Nadia Eghbal",
      category: "Technology",
      rating: 5,
      progress: 90,
      cover: getPlaceholderImage("Working in Public")
    },
    {
      title: "Competing in the Age of AI",
      author: "Marco Iansiti, Karim R. Lakhani",
      category: "Business",
      rating: 4,
      progress: 30,
      cover: getPlaceholderImage("AI Business")
    }
  ];
  
  const completedBooks = [
    {
      title: "The Innovators",
      author: "Walter Isaacson",
      category: "Biography",
      rating: 5,
      dateCompleted: "March 2025",
      cover: getPlaceholderImage("Innovators")
    },
    {
      title: "Hooked: How to Build Habit-Forming Products",
      author: "Nir Eyal",
      category: "Business",
      rating: 4,
      dateCompleted: "February 2025",
      cover: getPlaceholderImage("Hooked")
    },
    {
      title: "The Psychology of Money",
      author: "Morgan Housel",
      category: "Finance",
      rating: 5,
      dateCompleted: "January 2025",
      cover: getPlaceholderImage("Psychology of Money")
    },
    {
      title: "Atomic Habits",
      author: "James Clear",
      category: "Self-Improvement",
      rating: 5,
      dateCompleted: "December 2024",
      cover: getPlaceholderImage("Atomic Habits")
    },
    {
      title: "The Lean Startup",
      author: "Eric Ries",
      category: "Business",
      rating: 4,
      dateCompleted: "November 2024",
      cover: getPlaceholderImage("Lean Startup")
    }
  ];
  
  const recommendedBooks = [
    {
      title: "Zero to One",
      author: "Peter Thiel",
      category: "Business",
      why: "Essential insights on creating new value and building the future.",
      cover: getPlaceholderImage("Zero to One")
    },
    {
      title: "Thinking, Fast and Slow",
      author: "Daniel Kahneman",
      category: "Psychology",
      why: "Transformative understanding of how we think and make decisions.",
      cover: getPlaceholderImage("Thinking Fast Slow")
    },
    {
      title: "The Art of Doing Science and Engineering",
      author: "Richard Hamming",
      category: "Science",
      why: "Powerful approach to creative thinking and problem-solving.",
      cover: getPlaceholderImage("Science Engineering")
    }
  ];

  return (
    <Layout>
      <section className="py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4 font-serif">Reading List</h1>
            <p className="text-muted-foreground text-lg">
              Books I'm currently reading, have completed, and recommend
            </p>
          </div>
          
          <Tabs defaultValue="current" className="w-full">
            <div className="flex justify-between items-center mb-6">
              <TabsList className="grid grid-cols-3">
                <TabsTrigger value="current" className="flex items-center gap-2">
                  <BookOpen size={16} />
                  <span>Currently Reading</span>
                </TabsTrigger>
                <TabsTrigger value="completed" className="flex items-center gap-2">
                  <Star size={16} />
                  <span>Completed</span>
                </TabsTrigger>
                <TabsTrigger value="recommended" className="flex items-center gap-2">
                  <Book size={16} />
                  <span>Recommended</span>
                </TabsTrigger>
              </TabsList>
              
              <div className="hidden md:flex space-x-2">
                <Button 
                  variant={bookView === 'grid' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => setBookView('grid')}
                >
                  Grid
                </Button>
                <Button 
                  variant={bookView === 'list' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => setBookView('list')}
                >
                  List
                </Button>
              </div>
            </div>
            
            <TabsContent value="current">
              <div className={`${bookView === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}`}>
                {currentBooks.map((book, index) => (
                  <Card key={index} className={bookView === 'list' ? 'flex flex-row overflow-hidden' : ''}>
                    {bookView === 'grid' ? (
                      <>
                        <div className="relative pt-6 px-6 flex justify-center">
                          <img src={book.cover} alt={book.title} className="h-40 object-contain" />
                          <Badge className="absolute top-2 right-2">{book.category}</Badge>
                        </div>
                        <CardHeader>
                          <CardTitle className="line-clamp-1">{book.title}</CardTitle>
                          <CardDescription>{book.author}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center mb-2">
                            <span className="text-sm font-medium mr-2">Progress: {book.progress}%</span>
                            <div className="w-full bg-muted rounded-full h-2">
                              <div className="bg-primary rounded-full h-2" style={{ width: `${book.progress}%` }}></div>
                            </div>
                          </div>
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} size={16} className={i < book.rating ? 'text-yellow-500 fill-yellow-500' : 'text-muted'} />
                            ))}
                          </div>
                        </CardContent>
                      </>
                    ) : (
                      <>
                        <img src={book.cover} alt={book.title} className="h-28 w-20 object-cover m-4" />
                        <div className="flex-1 p-4">
                          <h3 className="font-bold">{book.title}</h3>
                          <p className="text-sm text-muted-foreground">{book.author}</p>
                          <div className="flex items-center mt-2 mb-1">
                            <span className="text-xs font-medium mr-2">Progress: {book.progress}%</span>
                            <div className="w-full bg-muted rounded-full h-1.5">
                              <div className="bg-primary rounded-full h-1.5" style={{ width: `${book.progress}%` }}></div>
                            </div>
                          </div>
                          <div className="flex mt-1">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} size={14} className={i < book.rating ? 'text-yellow-500 fill-yellow-500' : 'text-muted'} />
                            ))}
                            <Badge className="ml-auto">{book.category}</Badge>
                          </div>
                        </div>
                      </>
                    )}
                  </Card>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="completed">
              <div className={`${bookView === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}`}>
                {completedBooks.map((book, index) => (
                  <Card key={index} className={bookView === 'list' ? 'flex flex-row overflow-hidden' : ''}>
                    {bookView === 'grid' ? (
                      <>
                        <div className="relative pt-6 px-6 flex justify-center">
                          <img src={book.cover} alt={book.title} className="h-40 object-contain" />
                          <Badge className="absolute top-2 right-2">{book.category}</Badge>
                        </div>
                        <CardHeader>
                          <CardTitle className="line-clamp-1">{book.title}</CardTitle>
                          <CardDescription>{book.author}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm mb-2">Completed: {book.dateCompleted}</p>
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} size={16} className={i < book.rating ? 'text-yellow-500 fill-yellow-500' : 'text-muted'} />
                            ))}
                          </div>
                        </CardContent>
                      </>
                    ) : (
                      <>
                        <img src={book.cover} alt={book.title} className="h-28 w-20 object-cover m-4" />
                        <div className="flex-1 p-4">
                          <h3 className="font-bold">{book.title}</h3>
                          <p className="text-sm text-muted-foreground">{book.author}</p>
                          <p className="text-xs mt-2">Completed: {book.dateCompleted}</p>
                          <div className="flex mt-2">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} size={14} className={i < book.rating ? 'text-yellow-500 fill-yellow-500' : 'text-muted'} />
                            ))}
                            <Badge className="ml-auto">{book.category}</Badge>
                          </div>
                        </div>
                      </>
                    )}
                  </Card>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="recommended">
              <div className={`${bookView === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}`}>
                {recommendedBooks.map((book, index) => (
                  <Card key={index} className={bookView === 'list' ? 'flex flex-row overflow-hidden' : ''}>
                    {bookView === 'grid' ? (
                      <>
                        <div className="relative pt-6 px-6 flex justify-center">
                          <img src={book.cover} alt={book.title} className="h-40 object-contain" />
                          <Badge className="absolute top-2 right-2">{book.category}</Badge>
                        </div>
                        <CardHeader>
                          <CardTitle className="line-clamp-1">{book.title}</CardTitle>
                          <CardDescription>{book.author}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground">{book.why}</p>
                        </CardContent>
                        <CardFooter>
                          <Button variant="outline" size="sm" className="w-full">
                            <a href={`https://www.amazon.com/s?k=${encodeURIComponent(book.title + ' ' + book.author)}`} target="_blank" rel="noopener noreferrer" className="w-full">
                              Find on Amazon
                            </a>
                          </Button>
                        </CardFooter>
                      </>
                    ) : (
                      <>
                        <img src={book.cover} alt={book.title} className="h-28 w-20 object-cover m-4" />
                        <div className="flex-1 p-4">
                          <h3 className="font-bold">{book.title}</h3>
                          <p className="text-sm text-muted-foreground">{book.author}</p>
                          <p className="text-xs mt-2">{book.why}</p>
                          <div className="flex mt-2 items-center justify-between">
                            <Badge>{book.category}</Badge>
                            <Button variant="outline" size="sm">
                              <a href={`https://www.amazon.com/s?k=${encodeURIComponent(book.title + ' ' + book.author)}`} target="_blank" rel="noopener noreferrer">
                                Find on Amazon
                              </a>
                            </Button>
                          </div>
                        </div>
                      </>
                    )}
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </Layout>
  );
}
