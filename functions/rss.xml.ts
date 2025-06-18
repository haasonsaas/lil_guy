export async function onRequest(context: any) {
  try {
    // Dynamic import to avoid bundling issues
    const { generateRSSFeed } = await import('../src/utils/rssGenerator');
    const rssContent = await generateRSSFeed();

    return new Response(rssContent, {
      headers: {
        'Content-Type': 'application/rss+xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600', // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error('Error generating RSS feed:', error);
    return new Response('Error generating RSS feed', { status: 500 });
  }
}