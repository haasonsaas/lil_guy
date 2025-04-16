import { useState } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Book, BookOpen, Star } from 'lucide-react';
import { generateThumbnailUrl } from '../utils/ogImageUtils';

const generateImageUrl = (title: string) => {
  const cleanText = title.toLowerCase().replace(/[^a-z0-9]/g, '-');
  return generateThumbnailUrl(cleanText);
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
  
  const completedBooks = [
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
  
  const recommendedBooks = [
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

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">Reading List</h1>
        {/* Rest of the component code */}
      </div>
    </Layout>
  );
}