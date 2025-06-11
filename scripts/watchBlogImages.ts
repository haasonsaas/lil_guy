import chokidar from 'chokidar';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const postsDir = path.join(process.cwd(), 'src', 'posts');

console.log('👁️  Watching for blog post changes...');

// Initialize watcher
const watcher = chokidar.watch(postsDir, {
  persistent: true,
  ignoreInitial: true,
  awaitWriteFinish: {
    stabilityThreshold: 1000,
    pollInterval: 100
  }
});

// Debounce function to avoid multiple triggers
let timeout: NodeJS.Timeout;
function debounce(func: () => void, wait: number) {
  clearTimeout(timeout);
  timeout = setTimeout(func, wait);
}

async function generateImages() {
  try {
    console.log('\n🖼️  Generating missing blog images...');
    const { stdout, stderr } = await execAsync('bun run generate-blog-images');
    if (stdout) console.log(stdout);
    if (stderr) console.error(stderr);
  } catch (error) {
    console.error('Error generating images:', error);
  }
}

// Watch for new posts
watcher.on('add', (filePath) => {
  if (filePath.endsWith('.md')) {
    console.log(`\n📝 New blog post: ${path.basename(filePath)}`);
    debounce(generateImages, 2000);
  }
});

// Watch for title changes
watcher.on('change', (filePath) => {
  if (filePath.endsWith('.md')) {
    console.log(`\n✏️  Blog post updated: ${path.basename(filePath)}`);
    debounce(generateImages, 2000);
  }
});

// Handle errors
watcher.on('error', error => {
  console.error('Watcher error:', error);
});

// Keep the process running
process.on('SIGINT', () => {
  console.log('\n👋 Stopping blog image watcher...');
  watcher.close();
  process.exit();
});