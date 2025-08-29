/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect } from 'react';
import { NewsItem } from '../types';

const CORS_PROXY_PREFIX = 'https://api.allorigins.win/raw?url=';
const RSS_FEED_URL = 'https://pokemonblog.com/feed/';

const NewsFeed = () => {
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNews = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const proxiedUrl = `${CORS_PROXY_PREFIX}${encodeURIComponent(RSS_FEED_URL)}`;
        const response = await fetch(proxiedUrl);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const xmlString = await response.text();
        
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlString, "text/xml");
        const items = xmlDoc.querySelectorAll("item");
        
        const parsedItems: NewsItem[] = Array.from(items).map(item => {
          const title = item.querySelector("title")?.textContent || 'No Title';
          const link = item.querySelector("link")?.textContent || '#';
          const pubDate = item.querySelector("pubDate")?.textContent;
          const timestamp = pubDate 
            ? new Date(pubDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            : 'No Date';
            
          const category = item.querySelector("category")?.textContent || 'News';

          const descriptionCdata = item.querySelector('description')?.textContent || '';
          const descriptionParser = new DOMParser();
          const descriptionDoc = descriptionParser.parseFromString(descriptionCdata, 'text/html');
          
          const image = descriptionDoc.querySelector('img')?.src || '';
          const imageAlt = descriptionDoc.querySelector('img')?.alt || title;
          
          // More robustly parse description from paragraphs, excluding image and source paragraphs
          const allParagraphs = Array.from(descriptionDoc.querySelectorAll('p'));
          const contentParagraphs = allParagraphs.filter(p => {
              const hasImage = p.querySelector('img');
              const isSource = p.textContent?.trim().toLowerCase() === 'source';
              return !hasImage && !isSource;
          });
          const description = contentParagraphs.map(p => p.textContent?.trim()).join(' ').trim() || 'No description available.';

          return {
            category,
            title,
            link,
            timestamp,
            image,
            imageAlt,
            description,
          };
        }).slice(0, 5); // Display the 5 most recent articles

        setNewsItems(parsedItems);
      } catch (e) {
        console.error("Failed to fetch or parse news feed:", e);
        setError("Failed to load the latest news.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchNews();
  }, []);

  const renderContent = () => {
    if (isLoading) {
      // Re-using grid-placeholder for simplicity
      return <div className="grid-placeholder" style={{padding: '2rem'}}>Loading news...</div>;
    }
    if (error) {
      return <div className="grid-placeholder" style={{padding: '2rem'}}>{error}</div>;
    }
    if (newsItems.length === 0) {
      return <div className="grid-placeholder" style={{padding: '2rem'}}>No news available.</div>;
    }
    return newsItems.map((item, index) => (
      <article key={index} className="news-item" aria-labelledby={`news-title-${index}`}>
        {item.image && <img src={item.image} alt={item.imageAlt} className="news-item-image" />}
        <div className="news-item-header">
          <span className="news-item-category">{item.category}</span>
          <span className="news-item-timestamp">{item.timestamp}</span>
        </div>
        <h3 id={`news-title-${index}`} className="news-item-title">{item.title}</h3>
        <p className="news-item-description">{item.description}</p>
        <a href={item.link} target="_blank" rel="noopener noreferrer" className="news-item-link">
          Read More &rarr;
        </a>
      </article>
    ));
  };
  
  return (
    <aside className="panel news-panel" aria-labelledby="news-title">
      <h2 id="news-title">Holo-Net News</h2>
      <div className="news-feed-content">
        {renderContent()}
      </div>
    </aside>
  );
};

export default NewsFeed;