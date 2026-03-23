import React, { useState, useEffect, useRef } from 'react';
import './ModernAuth.css';

const EmailDomainSuggestions = ({ emailValue, onChange, onSelect, textColor = '#e2e8f0' }) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const wrapperRef = useRef(null);

  const commonDomains = [
    '@gmail.com',
    '@yahoo.com',
    '@outlook.com'
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
    
    // Always show suggestions if we have some input, or handle specific logic
    // The user wants "the three common @" right below. 
    // We will show them if there is a partial match or if we are just typing (helper).
    if (atIndex === -1) {
      setShowSuggestions(false);
      return;
    }

    const domain = email.substring(atIndex).toLowerCase();
    
    // If domain is empty (just @) or partial, show suggestions
    if (domain === '@' || domain.length < 3) {
      const filtered = commonDomains.filter(d => 
        d.startsWith(domain) && d !== domain
      );
      setSuggestions(filtered.length > 0 ? filtered : commonDomains);
      setShowSuggestions(true);
      setSelectedIndex(-1);
    } else if (commonDomains.includes(domain)) {
      // Exact match found, hide suggestions
      setShowSuggestions(false);
    } else {
       // Partial domain match
      const filtered = commonDomains.filter(d => 
        d.startsWith(domain) && d !== domain
      );
      if (filtered.length > 0) {
          setSuggestions(filtered);
          setShowSuggestions(true);
      } else {
          setShowSuggestions(false);
      }
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
      <div className="email-suggestions" style={{
        background: 'transparent',
        border: 'none',
        boxShadow: 'none',
        backdropFilter: 'none',
        position: 'relative',
        marginTop: '10px',
        display: 'flex',
        gap: '15px',
        padding: '0',
        width: '100%'
      }}>
        {suggestions.map((suggestion, index) => (
          <div
            key={suggestion}
            className={`email-suggestion ${index === selectedIndex ? 'selected' : ''}`}
            onClick={() => selectSuggestion(suggestion)}
            onMouseEnter={() => setSelectedIndex(index)}
            style={{
              background: 'transparent',
              border: 'none',
              padding: '0',
              color: textColor,
              cursor: 'pointer',
              flexShrink: 0
            }}
          >
            <span className="suggestion-text" style={{
              color: textColor,
              fontWeight: '600',
              fontSize: '0.9rem'
            }}>{suggestion}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EmailDomainSuggestions;
