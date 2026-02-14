import React, { useState, useEffect } from 'react';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  MapPin, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  ThumbsUp,
  Eye
} from 'lucide-react';
import { adminService } from '../config/supabase';
import './NewsFeed.css';

const NewsFeed = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadNewsFeed();
  }, []);

  const loadNewsFeed = async () => {
    try {
      setLoading(true);
      
      // Try to get real data first
      let incidents = [];
      try {
        incidents = await adminService.getAllReports();
      } catch (err) {
        console.log('No real data available, using sample data');
      }
      
      // If no real data, use sample data
      if (incidents.length === 0) {
        incidents = getSampleIncidents();
      }
      
      // Transform incidents into social media posts
      const newsPosts = incidents.map(incident => ({
        id: incident.id,
        title: incident.title,
        description: incident.description,
        location: incident.location || `${incident.city || ''} ${incident.address || ''}`.trim() || 'Unknown Location',
        category: incident.category,
        severity: incident.severity || 'medium',
        status: incident.status,
        timestamp: incident.created_at || incident.timestamp,
        reporter: incident.reporter?.full_name || incident.reporter || 'Anonymous',
        verified: incident.is_verified === true || incident.status === 'approved',
        // Mock social media data
        likes: Math.floor(Math.random() * 50) + 5,
        comments: Math.floor(Math.random() * 20) + 1,
        shares: Math.floor(Math.random() * 10) + 1,
        views: Math.floor(Math.random() * 200) + 50,
        liked: false,
        image: getRandomImage(incident.category)
      }));

      setPosts(newsPosts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
    } catch (err) {
      console.error('Error loading news feed:', err);
      setError('Failed to load news feed');
    } finally {
      setLoading(false);
    }
  };

  const getSampleIncidents = () => [
    {
      id: '1',
      title: 'Traffic Jam on Main Street',
      description: 'Heavy traffic reported on Main Street due to road construction. Expect delays of up to 30 minutes. Please use alternate routes if possible.',
      location: 'Main Street, Downtown',
      category: 'Traffic',
      severity: 'high',
      status: 'approved',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      reporter: 'Maria Santos'
    },
    {
      id: '2',
      title: 'Street Light Outage in Residential Area',
      description: 'Multiple street lights are out in the residential area near Central Park. The area is very dark and unsafe for pedestrians at night.',
      location: 'Central Park Area',
      category: 'Infrastructure',
      severity: 'medium',
      status: 'pending',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
      reporter: 'John Admin'
    },
    {
      id: '3',
      title: 'Weather Alert - Heavy Rain Expected',
      description: 'Heavy rainfall expected in the next few hours. Flooding possible in low-lying areas. Stay indoors and avoid unnecessary travel.',
      location: 'City Wide',
      category: 'Weather',
      severity: 'critical',
      status: 'approved',
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
      reporter: 'Weather Service'
    },
    {
      id: '4',
      title: 'Community Festival at Town Square',
      description: 'Annual community festival happening at Town Square this weekend. Expect increased foot traffic and road closures around the area.',
      location: 'Town Square',
      category: 'Event',
      severity: 'low',
      status: 'active',
      timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), // 8 hours ago
      reporter: 'Event Organizer'
    },
    {
      id: '5',
      title: 'Garbage Collection Delayed',
      description: 'Garbage collection has been delayed in several neighborhoods due to truck maintenance. Collection will resume tomorrow morning.',
      location: 'Multiple Neighborhoods',
      category: 'Environment',
      severity: 'low',
      status: 'approved',
      timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
      reporter: 'City Services'
    },
    {
      id: '6',
      title: 'Safety Hazard - Fallen Tree Branch',
      description: 'Large tree branch has fallen on Oak Street, partially blocking the road. Emergency services are on scene clearing the debris.',
      location: 'Oak Street',
      category: 'Safety',
      severity: 'high',
      status: 'active',
      timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      reporter: 'Carlos Garcia'
    },
    {
      id: '7',
      title: 'Crime Report - Theft Incident',
      description: 'Theft reported near the shopping district. Suspect described as male, 30s, wearing blue jacket. Police investigation ongoing.',
      location: 'Shopping District',
      category: 'Crime',
      severity: 'high',
      status: 'approved',
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
      reporter: 'Anonymous'
    },
    {
      id: '8',
      title: 'Emergency - Medical Response',
      description: 'Medical emergency at the city center. Ambulance dispatched, traffic being redirected around the area for emergency access.',
      location: 'City Center',
      category: 'Emergency',
      severity: 'critical',
      status: 'active',
      timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
      reporter: 'Emergency Services'
    }
  ];

  const getRandomImage = (category) => {
    const images = {
      'Traffic': 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&h=200&fit=crop',
      'Infrastructure': 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=400&h=200&fit=crop',
      'Weather': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=200&fit=crop',
      'Crime': 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400&h=200&fit=crop',
      'Emergency': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=200&fit=crop',
      'Environment': 'https://images.unsplash.com/photo-1542601906990-b4d3b778b09b?w=400&h=200&fit=crop',
      'Safety': 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&h=200&fit=crop',
      'Event': 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=400&h=200&fit=crop'
    };
    return images[category] || 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&h=200&fit=crop';
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'Traffic': return <AlertTriangle size={16} />;
      case 'Infrastructure': return <MapPin size={16} />;
      case 'Weather': return <AlertTriangle size={16} />;
      case 'Crime': return <AlertTriangle size={16} />;
      case 'Emergency': return <AlertTriangle size={16} />;
      case 'Environment': return <AlertTriangle size={16} />;
      case 'Safety': return <AlertTriangle size={16} />;
      case 'Event': return <AlertTriangle size={16} />;
      default: return <AlertTriangle size={16} />;
    }
  };

  const formatTimestamp = (timestamp) => {
    const now = new Date();
    const postTime = new Date(timestamp);
    const diffInHours = Math.floor((now - postTime) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return postTime.toLocaleDateString();
  };

  const handleLike = (postId) => {
    setPosts(posts.map(post => 
      post.id === postId 
        ? { 
            ...post, 
            liked: !post.liked, 
            likes: post.liked ? post.likes - 1 : post.likes + 1 
          }
        : post
    ));
  };

  const handleShare = (post) => {
    if (navigator.share) {
      navigator.share({
        title: post.title,
        text: post.description,
        url: window.location.href
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(`${post.title} - ${post.description}`);
      alert('Post link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="news-feed-loading">
        <div className="loading-spinner"></div>
        <p>Loading news feed...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="news-feed-error">
        <AlertTriangle size={48} />
        <h3>Unable to load news feed</h3>
        <p>{error}</p>
        <button onClick={loadNewsFeed} className="retry-btn">Try Again</button>
      </div>
    );
  }

  return (
    <div className="news-feed">
      <div className="news-feed-header">
        <h2>UrbanShield News Feed</h2>
        <p>Stay updated with the latest incidents and safety information in your city</p>
      </div>

      <div className="posts-container">
        {posts.length === 0 ? (
          <div className="no-posts">
            <AlertTriangle size={48} />
            <h3>No incidents reported yet</h3>
            <p>Be the first to report an incident in your area!</p>
          </div>
        ) : (
          posts.map(post => (
            <div key={post.id} className={`post-card ${post.verified ? 'verified' : ''}`}>
              {/* Post Header */}
              <div className="post-header">
                <div className="post-author">
                  <div className="author-avatar">
                    {post.reporter.charAt(0).toUpperCase()}
                  </div>
                  <div className="author-info">
                    <div className="author-name">
                      {post.reporter}
                      {post.verified && (
                        <CheckCircle size={16} className="verified-badge" />
                      )}
                    </div>
                    <div className="post-meta">
                      <Clock size={12} />
                      <span>{formatTimestamp(post.timestamp)}</span>
                      <span className="separator">•</span>
                      <MapPin size={12} />
                      <span>{post.location}</span>
                    </div>
                  </div>
                </div>
                <div className="post-category">
                  <span 
                    className="category-badge"
                    style={{ backgroundColor: getSeverityColor(post.severity) }}
                  >
                    {getCategoryIcon(post.category)}
                    {post.category}
                  </span>
                </div>
              </div>

              {/* Post Content */}
              <div className="post-content">
                <h3 className="post-title">{post.title}</h3>
                <p className="post-description">{post.description}</p>
                
                {post.image && (
                  <div className="post-image">
                    <img src={post.image} alt={post.title} />
                  </div>
                )}
              </div>

              {/* Post Stats */}
              <div className="post-stats">
                <div className="stat-item">
                  <Eye size={14} />
                  <span>{post.views} views</span>
                </div>
                <div className="stat-item">
                  <MessageCircle size={14} />
                  <span>{post.comments} comments</span>
                </div>
                <div className="stat-item">
                  <Share2 size={14} />
                  <span>{post.shares} shares</span>
                </div>
              </div>

              {/* Post Actions */}
              <div className="post-actions">
                <button 
                  className={`action-btn like-btn ${post.liked ? 'liked' : ''}`}
                  onClick={() => handleLike(post.id)}
                >
                  <Heart size={18} fill={post.liked ? 'currentColor' : 'none'} />
                  <span>{post.likes}</span>
                </button>
                
                <button className="action-btn comment-btn">
                  <MessageCircle size={18} />
                  <span>Comment</span>
                </button>
                
                <button 
                  className="action-btn share-btn"
                  onClick={() => handleShare(post)}
                >
                  <Share2 size={18} />
                  <span>Share</span>
                </button>
              </div>

              {/* Verification Status */}
              {post.verified && (
                <div className="verification-status">
                  <CheckCircle size={16} />
                  <span>Verified by UrbanShield Admin</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NewsFeed;
