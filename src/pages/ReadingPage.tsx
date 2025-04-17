import { useState } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Book, BookOpen, Star, Grid, List } from 'lucide-react';
import { generateThumbnailUrl } from '../utils/ogImageUtils';

interface BaseBook {
  title: string;
  author: string;
  category: string;
  cover: string;
}

interface CurrentBook extends BaseBook {
  rating: number;
  progress: number;
}

interface CompletedBook extends BaseBook {
  rating: number;
  dateCompleted: string;
}

interface RecommendedBook extends BaseBook {
  why: string;
}

const generateImageUrl = (title: string) => {
  const cleanText = title.toLowerCase().replace(/[^a-z0-9]/g, '-');
  return generateThumbnailUrl(cleanText);
};

export default function ReadingPage() {
  const [bookView, setBookView] = useState('grid');
  
  const currentBooks: CurrentBook[] = [
    {
      title: "The Age of AI: And Our Human Future",
      author: "Henry Kissinger, Eric Schmidt, Daniel Huttenlocher",
      category: "Technology",
      rating: 4,
      progress: 65,
      cover: generateImageUrl("AI Future")
    },
    {
      title: "Working in Public: The Making and Maintenance of Open Source Software",
      author: "Nadia Eghbal",
      category: "Technology",
      rating: 5,
      progress: 90,
      cover: generateImageUrl("Working in Public")
    },
    {
      title: "Competing in the Age of AI",
      author: "Marco Iansiti, Karim R. Lakhani",
      category: "Business",
      rating: 4,
      progress: 30,
      cover: generateImageUrl("AI Business")
    }
  ];
  
  const completedBooks: CompletedBook[] = [
    {
      title: "The Innovators",
      author: "Walter Isaacson",
      category: "Biography",
      rating: 5,
      dateCompleted: "March 2025",
      cover: generateImageUrl("Innovators")
    },
    {
      title: "Hooked: How to Build Habit-Forming Products",
      author: "Nir Eyal",
      category: "Business",
      rating: 4,
      dateCompleted: "February 2025",
      cover: generateImageUrl("Hooked")
    },
    {
      title: "The Psychology of Money",
      author: "Morgan Housel",
      category: "Finance",
      rating: 5,
      dateCompleted: "January 2025",
      cover: generateImageUrl("Psychology of Money")
    },
    {
      title: "Atomic Habits",
      author: "James Clear",
      category: "Self-Improvement",
      rating: 5,
      dateCompleted: "December 2024",
      cover: generateImageUrl("Atomic Habits")
    },
    {
      title: "The Lean Startup",
      author: "Eric Ries",
      category: "Business",
      rating: 4,
      dateCompleted: "November 2024",
      cover: generateImageUrl("Lean Startup")
    }
  ];
  
  const recommendedBooks: RecommendedBook[] = [
    {
      title: "Zero to One",
      author: "Peter Thiel",
      category: "Business",
      why: "Essential insights on creating new value and building the future.",
      cover: generateImageUrl("Zero to One")
    },
    {
      title: "Thinking, Fast and Slow",
      author: "Daniel Kahneman",
      category: "Psychology",
      why: "Transformative understanding of how we think and make decisions.",
      cover: generateImageUrl("Thinking Fast Slow")
    },
    {
      title: "The Art of Doing Science and Engineering",
      author: "Richard Hamming",
      category: "Science",
      why: "Powerful approach to creative thinking and problem-solving.",
      cover: generateImageUrl("The Art of Doing Science and Engineering")
    }
  ];

  const renderBookCard = (book: CurrentBook | CompletedBook | RecommendedBook, type: 'current' | 'completed' | 'recommended') => {
    return (
      <Card key={book.title} className="h-full flex flex-col">
        <CardHeader className="p-4">
          <div className="relative aspect-[2/3] w-40 mx-auto overflow-hidden rounded-lg">
            <img
              src={book.cover}
              alt={book.title}
              className="object-cover w-full h-full"
            />
          </div>
          <CardTitle className="mt-4 text-lg">{book.title}</CardTitle>
          <CardDescription className="text-sm">{book.author}</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 p-4 pt-0">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="secondary" className="text-xs">{book.category}</Badge>
            {type === 'current' && (
              <Badge variant="outline" className="ml-auto text-xs">
                {(book as CurrentBook).progress}% complete
              </Badge>
            )}
            {type === 'completed' && (
              <Badge variant="outline" className="ml-auto text-xs">
                {(book as CompletedBook).dateCompleted}
              </Badge>
            )}
          </div>
          {type === 'recommended' && (
            <p className="text-xs text-muted-foreground">{(book as RecommendedBook).why}</p>
          )}
        </CardContent>
        <CardFooter className="flex items-center justify-between p-4 pt-0">
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`h-3 w-3 ${
                  i < (book as CurrentBook | CompletedBook).rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'
                }`}
              />
            ))}
          </div>
          {type === 'current' && (
            <Button variant="ghost" size="sm" className="h-8 text-xs">
              <BookOpen className="h-3 w-3 mr-1" />
              Continue
            </Button>
          )}
        </CardFooter>
      </Card>
    );
  };

  const renderBookList = (book: CurrentBook | CompletedBook | RecommendedBook, type: 'current' | 'completed' | 'recommended') => {
    return (
      <div key={book.title} className="flex items-start gap-3 p-3 border rounded-lg">
        <div className="relative w-16 h-24 flex-shrink-0">
          <img
            src={book.cover}
            alt={book.title}
            className="object-cover w-full h-full rounded-lg"
          />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm truncate">{book.title}</h3>
          <p className="text-xs text-muted-foreground truncate">{book.author}</p>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="secondary" className="text-xs">{book.category}</Badge>
            {type === 'current' && (
              <Badge variant="outline" className="text-xs">
                {(book as CurrentBook).progress}% complete
              </Badge>
            )}
            {type === 'completed' && (
              <Badge variant="outline" className="text-xs">
                {(book as CompletedBook).dateCompleted}
              </Badge>
            )}
          </div>
          {type === 'recommended' && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{(book as RecommendedBook).why}</p>
          )}
          <div className="flex items-center gap-1 mt-1">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`h-3 w-3 ${
                  i < (book as CurrentBook | CompletedBook).rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'
                }`}
              />
            ))}
          </div>
        </div>
        {type === 'current' && (
          <Button variant="ghost" size="sm" className="h-8 text-xs">
            <BookOpen className="h-3 w-3 mr-1" />
            Continue
          </Button>
        )}
      </div>
    );
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Reading List</h1>
          <div className="flex items-center gap-2">
            <Button
              variant={bookView === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setBookView('grid')}
            >
              <Grid className="h-4 w-4 mr-2" />
              Grid
            </Button>
            <Button
              variant={bookView === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setBookView('list')}
            >
              <List className="h-4 w-4 mr-2" />
              List
            </Button>
          </div>
        </div>

        <Tabs defaultValue="current" className="space-y-4">
          <TabsList>
            <TabsTrigger value="current">
              <BookOpen className="h-4 w-4 mr-2" />
              Currently Reading
            </TabsTrigger>
            <TabsTrigger value="completed">
              <Book className="h-4 w-4 mr-2" />
              Completed
            </TabsTrigger>
            <TabsTrigger value="recommended">
              <Star className="h-4 w-4 mr-2" />
              Recommendations
            </TabsTrigger>
          </TabsList>

          <TabsContent value="current">
            <div className={bookView === 'grid' ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4' : 'space-y-3'}>
              {currentBooks.map(book => 
                bookView === 'grid' ? renderBookCard(book, 'current') : renderBookList(book, 'current')
              )}
            </div>
          </TabsContent>

          <TabsContent value="completed">
            <div className={bookView === 'grid' ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4' : 'space-y-3'}>
              {completedBooks.map(book => 
                bookView === 'grid' ? renderBookCard(book, 'completed') : renderBookList(book, 'completed')
              )}
            </div>
          </TabsContent>

          <TabsContent value="recommended">
            <div className={bookView === 'grid' ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4' : 'space-y-3'}>
              {recommendedBooks.map(book => 
                bookView === 'grid' ? renderBookCard(book, 'recommended') : renderBookList(book, 'recommended')
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}