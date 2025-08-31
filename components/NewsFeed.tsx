/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect, useCallback } from 'react';
import { NewsItem } from '../types';

const RSS_FEED_URL = 'https://www.youtube.com/feeds/videos.xml?channel_id=UCFctpiB_Hnlk3ejWfHqSm6Q';
const RSS2JSON_SERVICE_URL = `https://api.rss2json.com/v1/api.json?rss_url=`;

const NewsFeed = () => {
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNews = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fetchUrl = `${RSS2JSON_SERVICE_URL}${encodeURIComponent(RSS_FEED_URL)}`;
      const response = await fetch(fetchUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();

      if (data.status !== 'ok') {
        throw new Error('Failed to convert RSS feed to JSON.');
      }

      // Helper to strip HTML from description
      const stripHtml = (html: string) => {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        return doc.body.textContent || "";
      };
      
      const parsedItems: NewsItem[] = data.items.map((item: any) => {
        const title = item.title || 'No Title';
        const link = item.link || '#';
        const published = item.pubDate;
        const timestamp = published 
          ? new Date(published).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
          : 'No Date';
          
        const category = 'Official Video';
        const image = item.thumbnail || '';
        const imageAlt = title;
        
        const description = stripHtml(item.description || '').trim() || 'No description available.';

        return {
          category,
          title,
          link,
          timestamp,
          image,
          imageAlt,
          description,
        };
      }).slice(0, 5); // Display the 5 most recent videos

      setNewsItems(parsedItems);
    } catch (e) {
      console.error("Failed to fetch or parse news feed:", e);
      setError("Failed to load the latest videos.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  const renderContent = () => {
    if (isLoading) {
      return <div className="placeholder-container">Loading videos...</div>;
    }
    if (error) {
      return (
        <div className="placeholder-container">
          <span>{error}</span>
          <button onClick={fetchNews} className="retry-btn">Retry</button>
        </div>
      );
    }
    if (newsItems.length === 0) {
      return <div className="placeholder-container">No videos available.</div>;
    }
    return newsItems.map((item, index) => (
      <a
        key={item.link}
        href={item.link}
        target="_blank"
        rel="noopener noreferrer"
        className="news-item"
        aria-labelledby={`news-title-${index}`}
      >
        {item.image && <img src={item.image} alt={item.imageAlt} className="news-item-image" />}
        <div className="news-item-header">
          <span className="news-item-category">{item.category}</span>
          <span className="news-item-timestamp">{item.timestamp}</span>
        </div>
        <h3 id={`news-title-${index}`} className="news-item-title">{item.title}</h3>
        <p className="news-item-description">{item.description}</p>
      </a>
    ));
  };
  
  return (
    <aside className="panel news-panel" aria-labelledby="news-title">
      <h2 id="news-title">Official Pokémon Channel</h2>
      <div className="news-feed-content">
        {renderContent()}
      </div>
    </aside>
  );
};

export default NewsFeed;
