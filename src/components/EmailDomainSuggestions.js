import React, { useState, useEffect, useRef } from 'react';
import './ModernAuth.css';

const EmailDomainSuggestions = ({ emailValue, onChange, onSelect }) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const wrapperRef = useRef(null);

  const commonDomains = [
    '@gmail.com',
    '@yahoo.com',
    '@outlook.com',
    '@hotmail.com',
    '@icloud.com',
    '@aol.com',
    '@protonmail.com',
    '@mail.com'
  ];

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const email = emailValue || '';
    const atIndex = email.lastIndexOf('@');
    
    if (atIndex === -1) {
      // No @ symbol, don't show suggestions
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const domain = email.substring(atIndex).toLowerCase();
    const localPart = email.substring(0, atIndex);
    
    // If domain is empty or partial, show suggestions
    if (domain === '@' || domain.length < 3) {
      const filtered = commonDomains.filter(d => 
        d.startsWith(domain) && d !== domain
      );
      setSuggestions(filtered);
      setShowSuggestions(true);
      setSelectedIndex(-1);
    } else if (commonDomains.includes(domain)) {
      // Exact match found, hide suggestions
      setShowSuggestions(false);
    } else {
      // Partial domain, show matching suggestions
      const filtered = commonDomains.filter(d => 
        d.startsWith(domain) && d !== domain
      );
      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
      setSelectedIndex(-1);
    }
  }, [emailValue]);

  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
      case 'Tab':
        e.preventDefault();
        if (selectedIndex >= 0) {
          selectSuggestion(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const selectSuggestion = (domain) => {
    const email = emailValue || '';
    const atIndex = email.lastIndexOf('@');
    const localPart = email.substring(0, atIndex);
    const newEmail = localPart + domain;
    
    onChange(newEmail);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    onSelect?.();
  };

  if (!showSuggestions || suggestions.length === 0) {
    return null;
  }

  return (
    <div className="email-suggestions-wrapper" ref={wrapperRef}>
      <div className="email-suggestions">
        {suggestions.map((suggestion, index) => (
          <div
            key={suggestion}
            className={`email-suggestion ${index === selectedIndex ? 'selected' : ''}`}
            onClick={() => selectSuggestion(suggestion)}
            onMouseEnter={() => setSelectedIndex(index)}
          >
            <span className="suggestion-text">{suggestion}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EmailDomainSuggestions;
