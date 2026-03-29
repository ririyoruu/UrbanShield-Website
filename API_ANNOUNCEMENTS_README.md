# Announcements API Documentation

This document describes how to access announcements from the UrbanShield platform for external applications.

## Overview

Announcements are public safety alerts and notices published by administrators. They can be accessed via the Supabase database directly or through the public Edge Function API.

## API Endpoints

### 1. Public Edge Function API (Recommended)

**Endpoint:**
```
POST https://efiswsdjscypiujrvawp.supabase.co/functions/v1/public-announcements
```

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | number | 10 | Number of announcements to return (max: 50) |
| `offset` | number | 0 | Offset for pagination |
| `alert_level` | string | - | Filter by level: `critical`, `warning`, `info`, `notice` |

**Response Format:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-string",
      "title": "Evacuation Order - Barangay Tubigon",
      "content": "Due to rising flood waters, residents are advised to evacuate to designated centers immediately.",
      "alert_level": "critical",
      "alert_type": "Flood Warning",
      "areas": "Barangay Tubigon, Bohol",
      "action_items": [
        "Proceed to nearest evacuation center",
        "Bring emergency supplies",
        "Follow responder instructions"
      ],
      "created_at": "2026-03-30T10:00:00Z",
      "updated_at": "2026-03-30T10:00:00Z",
      "is_pinned": false
    }
  ],
  "meta": {
    "total": 25,
    "limit": 10,
    "offset": 0,
    "has_more": true
  }
}
```

**Example Usage:**

```javascript
// Fetch latest announcements
const response = await fetch(
  'https://efiswsdjscypiujrvawp.supabase.co/functions/v1/public-announcements?limit=5'
);
const result = await response.json();

if (result.success) {
  console.log('Announcements:', result.data);
}
```

```bash
# Using curl
curl -X POST "https://efiswsdjscypiujrvawp.supabase.co/functions/v1/public-announcements?limit=10&alert_level=critical"
```

### 2. Direct Supabase Access (Client Libraries)

**Connection Details:**
- URL: `https://efiswsdjscypiujrvawp.supabase.co`
- Anon Key: Available in your app dashboard

**Example (JavaScript/TypeScript):**

```javascript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://efiswsdjscypiujrvawp.supabase.co',
  'your-anon-key'
)

// Fetch announcements
const { data, error } = await supabase
  .from('announcements')
  .select('*')
  .order('created_at', { ascending: false })
  .limit(10)

if (error) {
  console.error('Error:', error)
} else {
  console.log('Announcements:', data)
}
```

## Alert Levels

| Level | Color | Description |
|-------|-------|-------------|
| `critical` | 🔴 Red | Immediate danger, urgent action required |
| `warning` | 🟡 Yellow | Potential danger, stay alert |
| `info` | 🔵 Blue | General information |
| `notice` | ⚫ Gray | Administrative notices |

## Data Schema

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Unique identifier |
| `title` | string | Announcement title |
| `content` | string | Full announcement text |
| `alert_level` | string | critical, warning, info, notice |
| `alert_type` | string | Category tag (e.g., "Typhoon Warning") |
| `areas` | string | Affected areas |
| `action_items` | string[] | Array of recommended actions |
| `created_at` | ISO8601 | Creation timestamp |
| `updated_at` | ISO8601 | Last update timestamp |
| `is_pinned` | boolean | Whether pinned to top |

## Rate Limits

- Edge Function API: 100 requests per minute per IP
- Direct Supabase: Limited by your project's rate limits

## Security

- Read access is public (no authentication required)
- Write access requires admin authentication
- CORS is enabled for browser-based access

## Support

For API issues or questions, contact the UrbanShield development team.
