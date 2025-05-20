import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Star } from 'lucide-react';

interface BaseBook {
  title: string;
  author: string;
  category: string;
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

export default function ReadingPage() {
  const [currentBooks, setCurrentBooks] = useState<CurrentBook[]>([]);
  const [completedBooks, setCompletedBooks] = useState<CompletedBook[]>([]);
  const [recommendedBooks, setRecommendedBooks] = useState<RecommendedBook[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeBooks = async () => {
      const initialCurrentBooks: CurrentBook[] = [
        {
          title: "The Age of AI: And Our Human Future",
          author: "Henry Kissinger, Eric Schmidt, Daniel Huttenlocher",
          category: "Technology",
          rating: 4,
          progress: 65
        },
        {
          title: "Working in Public: The Making and Maintenance of Open Source Software",
          author: "Nadia Eghbal",
          category: "Technology",
          rating: 5,
          progress: 90
        },
        {
          title: "Competing in the Age of AI",
          author: "Marco Iansiti, Karim R. Lakhani",
          category: "Business",
          rating: 4,
          progress: 30
        },
        {
          title: "High Output Management",
          author: "Andrew Grove",
          category: "Management",
          rating: 5,
          progress: 45
        }
      ];

      const initialCompletedBooks: CompletedBook[] = [
        {
          title: "The Innovators",
          author: "Walter Isaacson",
          category: "Biography",
          rating: 5,
          dateCompleted: "March 2025"
        },
        {
          title: "Hooked: How to Build Habit-Forming Products",
          author: "Nir Eyal",
          category: "Business",
          rating: 4,
          dateCompleted: "February 2025"
        },
        {
          title: "The Psychology of Money",
          author: "Morgan Housel",
          category: "Finance",
          rating: 5,
          dateCompleted: "January 2025"
        },
        {
          title: "Atomic Habits",
          author: "James Clear",
          category: "Self-Improvement",
          rating: 5,
          dateCompleted: "December 2024"
        },
        {
          title: "The Lean Startup",
          author: "Eric Ries",
          category: "Business",
          rating: 4,
          dateCompleted: "November 2024"
        },
        {
          title: "Snow Crash",
          author: "Neal Stephenson",
          category: "Fiction",
          rating: 5,
          dateCompleted: "October 2024"
        },
        {
          title: "The Making of a Manager",
          author: "Julie Zhuo",
          category: "Management",
          rating: 4,
          dateCompleted: "September 2024"
        },
        {
          title: "The Hard Thing About Hard Things",
          author: "Ben Horowitz",
          category: "Business",
          rating: 5,
          dateCompleted: "August 2024"
        }
      ];

      const initialRecommendedBooks: RecommendedBook[] = [
        {
          title: "Range",
          author: "David Epstein",
          category: "Psychology",
          why: "Shows how generalists triumph in a specialized world."
        },
        {
          title: "Algorithms to Live By",
          author: "Brian Christian & Tom Griffiths",
          category: "Science",
          why: "Practical computational thinking you can apply to everyday decisions."
        },
        {
          title: "Working in Public",
          author: "Nadia Eghbal",
          category: "Technology",
          why: "A fresh take on how open source communities actually function."
        },
        {
          title: "Mismatch",
          author: "Kat Holmes",
          category: "Design",
          why: "Offers a current and inclusive approach to design."
        },
        {
          title: "The Scout Mindset",
          author: "Julia Galef",
          category: "Psychology",
          why: "Learn how to change your thinking habits."
        }
      ];

      setCurrentBooks(initialCurrentBooks);
      setCompletedBooks(initialCompletedBooks);
      setRecommendedBooks(initialRecommendedBooks);
      setIsLoading(false);
    };

    initializeBooks();
  }, []);

  const renderBookCard = (book: CurrentBook | CompletedBook | RecommendedBook, type: 'current' | 'completed' | 'recommended') => {
    return (
      <Card key={book.title} className="p-4">
        <CardHeader className="p-0">
          <CardTitle className="text-lg">{book.title}</CardTitle>
          <CardDescription className="text-sm">{book.author}</CardDescription>
        </CardHeader>
        <CardContent className="p-0 mt-2">
          <div className="flex items-center gap-2 mb-2">
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
            <p className="text-sm text-muted-foreground mt-2">{(book as RecommendedBook).why}</p>
          )}
          {(type === 'current' || type === 'completed') && (
            <div className="flex items-center gap-1 mt-2">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-3 w-3 ${
                    i < (book as CurrentBook | CompletedBook).rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'
                  }`}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <Layout>
      <div className="container py-8">
        <h1 className="text-4xl font-bold mb-8">Reading List</h1>
        <Tabs defaultValue="current" className="w-full">
          <TabsList>
            <TabsTrigger value="current">Currently Reading</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="recommended">Recommended</TabsTrigger>
          </TabsList>
          <TabsContent value="current" className="mt-6">
            <div className="grid gap-4">
              {currentBooks.map(book => renderBookCard(book, 'current'))}
            </div>
          </TabsContent>
          <TabsContent value="completed" className="mt-6">
            <div className="grid gap-4">
              {completedBooks.map(book => renderBookCard(book, 'completed'))}
            </div>
          </TabsContent>
          <TabsContent value="recommended" className="mt-6">
            <div className="grid gap-4">
              {recommendedBooks.map(book => renderBookCard(book, 'recommended'))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}