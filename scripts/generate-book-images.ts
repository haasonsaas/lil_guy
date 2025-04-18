import { generateBlogImages } from '../src/utils/blogImageGenerator';

// Book titles from ReadingPage.tsx
const bookTitles = [
  // Currently Reading
  "The Age of AI: And Our Human Future",
  "Working in Public: The Making and Maintenance of Open Source Software",
  "Competing in the Age of AI",
  
  // Completed Books
  "The Innovators",
  "Hooked: How to Build Habit-Forming Products",
  "The Psychology of Money",
  "Atomic Habits",
  "The Lean Startup",
  
  // Recommended Books
  "Zero to One",
  "Thinking, Fast and Slow",
  "The Art of Doing Science and Engineering"
];

async function generateBookImages() {
  console.log('Generating book images...');
  
  const imageConfigs = bookTitles.map(title => ({
    width: 800,
    height: 384,
    text: title,
    type: 'blog' as const,
    backgroundColor: '#f5f5f5',
    textColor: '#333333'
  }));

  await generateBlogImages(imageConfigs);
  console.log('Book images generated successfully!');
}

generateBookImages().catch(console.error); 