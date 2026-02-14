import React from 'react';
import NewsFeed from './NewsFeed';
import './NewsPage.css';

const NewsPage = () => {
  return (
    <div className="news-page">
      {/* News Feed Container */}
      <div className="news-page-content">
        <NewsFeed />
      </div>
    </div>
  );
};

export default NewsPage;
