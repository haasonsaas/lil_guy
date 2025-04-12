import React from 'react';

interface SoundCloudEmbedProps {
  trackId: string;
  title?: string;
  className?: string;
}

export default function SoundCloudEmbed({ 
  trackId, 
  title = "SoundCloud Track",
  className = ""
}: SoundCloudEmbedProps) {
  return (
    <div className={`my-8 ${className}`}>
      <iframe
        width="100%"
        height="166"
        scrolling="no"
        frameBorder="no"
        allow="autoplay"
        src={`https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/${trackId}&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true`}
        title={title}
        className="rounded-lg shadow-lg"
      />
      <div className="text-xs text-gray-400 mt-2">
        <a 
          href="https://soundcloud.com/haasonsaas" 
          title="Jonathan Haas" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-gray-400 hover:text-gray-300"
        >
          Jonathan Haas
        </a>
        {" · "}
        <a 
          href={`https://soundcloud.com/haasonsaas/${title.toLowerCase().replace(/\s+/g, '-')}`}
          title={title}
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-400 hover:text-gray-300"
        >
          {title}
        </a>
      </div>
    </div>
  );
} 