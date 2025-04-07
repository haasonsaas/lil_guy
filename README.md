# Haas Blog

A modern, feature-rich blog built with React, TypeScript, and Vite. This project showcases a clean architecture and modern web development practices.

## 🚀 Features

- 📝 Markdown-based blog posts
- 🎨 Modern UI with Tailwind CSS and shadcn/ui components
- 🌙 Dark mode support
- 📱 Responsive design
- ⚡ Fast development with Vite
- 🔍 SEO friendly
- 📊 Syntax highlighting for code blocks
- 🎯 Type-safe development with TypeScript

## 🛠️ Tech Stack

- **Framework:** React 18
- **Build Tool:** Vite
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui
- **Routing:** React Router
- **State Management:** React Query
- **Form Handling:** React Hook Form
- **Markdown Processing:** marked, gray-matter
- **Code Highlighting:** highlight.js
- **Date Handling:** date-fns
- **Validation:** Zod
- **Package Manager:** Bun

## 📦 Project Structure

```
src/
├── components/     # Reusable UI components
├── hooks/         # Custom React hooks
├── lib/           # Utility functions and configurations
├── pages/         # Page components
├── posts/         # Markdown blog posts
├── types/         # TypeScript type definitions
└── utils/         # Helper functions
```

## 🚀 Getting Started

### Prerequisites

- [Bun](https://bun.sh) (Latest version)
- Node.js (v18 or higher) - Required for some dependencies

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/haasonsaas/haas-blog.git
   cd haas-blog
   ```

2. Install dependencies:
   ```bash
   bun install
   ```

3. Start the development server:
   ```bash
   bun run dev
   ```

4. Open [http://localhost:8080](http://localhost:8080) in your browser.

## 📝 Available Scripts

- `bun run dev` - Start development server
- `bun run build` - Build for production
- `bun run build:dev` - Build for development
- `bun run lint` - Run ESLint
- `bun run preview` - Preview production build

## 🎨 Customization

### Adding New Blog Posts

1. Create a new markdown file in the `src/posts` directory
2. Add frontmatter with title, date, and other metadata
3. Write your content in markdown format

### Styling

The project uses Tailwind CSS for styling. You can customize the theme in `tailwind.config.ts`.

## 📚 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) for the beautiful UI components
- [Vite](https://vitejs.dev/) for the amazing build tool
- [Tailwind CSS](https://tailwindcss.com/) for the utility-first CSS framework
- [Bun](https://bun.sh) for the fast JavaScript runtime and package manager
