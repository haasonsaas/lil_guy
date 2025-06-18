export async function onRequest(context: any) {
  try {
    // Dynamic import to avoid bundling issues
    const { generateAtomFeed } = await import('../src/utils/rssGenerator');
    const atomContent = await generateAtomFeed();

    return new Response(atomContent, {
      headers: {
        'Content-Type': 'application/atom+xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600', // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error('Error generating Atom feed:', error);
    return new Response('Error generating Atom feed', { status: 500 });
  }
}