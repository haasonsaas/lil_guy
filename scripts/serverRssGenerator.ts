import { loadPostsFromDisk } from './serverFileLoader';
import type { BlogPost } from '../src/types/blog';

interface RSSItem {
  title: string;
  description: string;
  link: string;
  pubDate: string;
  guid: string;
  category?: string[];
}

export const generateRSSFeed = (): string => {
  const posts = loadPostsFromDisk();
  const baseUrl = 'https://www.haasonsaas.com';
  
  // Get the most recent 50 posts for the feed
  const recentPosts = posts.slice(0, 50);
  
  const rssItems = recentPosts.map((post: BlogPost): RSSItem => ({
    title: post.frontmatter.title,
    description: post.frontmatter.description,
    link: `${baseUrl}/blog/${post.slug}`,
    pubDate: new Date(post.frontmatter.pubDate).toUTCString(),
    guid: `${baseUrl}/blog/${post.slug}`,
    category: post.frontmatter.tags
  }));

  const latestPost = recentPosts[0];
  const lastBuildDate = latestPost ? new Date(latestPost.frontmatter.pubDate).toUTCString() : new Date().toUTCString();

  const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Haas on SaaS</title>
    <description>Expert insights on bridging technical vision with market reality. Learn from a decade of enterprise software experience about AI, vertical SaaS, and building products that can't be ignored.</description>
    <link>${baseUrl}</link>
    <language>en-us</language>
    <managingEditor>jonathan@haasonsaas.com (Jonathan Haas)</managingEditor>
    <webMaster>jonathan@haasonsaas.com (Jonathan Haas)</webMaster>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <pubDate>${lastBuildDate}</pubDate>
    <ttl>60</ttl>
    <image>
      <url>${baseUrl}/placeholders/1200x630-haas-on-saas.png</url>
      <title>Haas on SaaS</title>
      <link>${baseUrl}</link>
      <width>144</width>
      <height>144</height>
    </image>
    <atom:link href="${baseUrl}/rss.xml" rel="self" type="application/rss+xml" />
    ${rssItems.map(item => `
    <item>
      <title><![CDATA[${item.title}]]></title>
      <description><![CDATA[${item.description}]]></description>
      <link>${item.link}</link>
      <guid isPermaLink="true">${item.guid}</guid>
      <pubDate>${item.pubDate}</pubDate>
      ${item.category ? item.category.map(cat => `<category><![CDATA[${cat}]]></category>`).join('\n      ') : ''}
    </item>`).join('')}
  </channel>
</rss>`;

  return rssXml;
};

export const generateAtomFeed = (): string => {
  const posts = loadPostsFromDisk();
  const baseUrl = 'https://www.haasonsaas.com';
  
  // Get the most recent 50 posts for the feed
  const recentPosts = posts.slice(0, 50);
  
  const latestPost = recentPosts[0];
  const updated = latestPost ? new Date(latestPost.frontmatter.pubDate).toISOString() : new Date().toISOString();

  const atomXml = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Haas on SaaS</title>
  <subtitle>Expert insights on bridging technical vision with market reality. Learn from a decade of enterprise software experience about AI, vertical SaaS, and building products that can't be ignored.</subtitle>
  <link href="${baseUrl}/atom.xml" rel="self" type="application/atom+xml" />
  <link href="${baseUrl}" rel="alternate" type="text/html" />
  <id>${baseUrl}/</id>
  <updated>${updated}</updated>
  <author>
    <name>Jonathan Haas</name>
    <email>jonathan@haasonsaas.com</email>
    <uri>${baseUrl}</uri>
  </author>
  <rights>Copyright © ${new Date().getFullYear()} Jonathan Haas</rights>
  ${recentPosts.map(post => `
  <entry>
    <title><![CDATA[${post.frontmatter.title}]]></title>
    <link href="${baseUrl}/blog/${post.slug}" rel="alternate" type="text/html" />
    <id>${baseUrl}/blog/${post.slug}</id>
    <published>${new Date(post.frontmatter.pubDate).toISOString()}</published>
    <updated>${new Date(post.frontmatter.pubDate).toISOString()}</updated>
    <summary><![CDATA[${post.frontmatter.description}]]></summary>
    <author>
      <name>Jonathan Haas</name>
      <email>jonathan@haasonsaas.com</email>
    </author>
    ${post.frontmatter.tags.map(tag => `<category term="${tag}" />`).join('\n    ')}
  </entry>`).join('')}
</feed>`;

  return atomXml;
};