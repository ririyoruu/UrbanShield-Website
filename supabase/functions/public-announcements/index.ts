// Supabase Edge Function: Public API for Announcements
// Endpoint: POST /functions/v1/public-announcements
// 
// This function provides public read-only access to announcements
// for external applications without requiring authentication.
//
// Query Parameters:
//   - limit: Number of announcements to return (default: 10, max: 50)
//   - offset: Offset for pagination (default: 0)
//   - alert_level: Filter by alert level (critical, warning, info, notice)
//
// Response Format:
// {
//   "success": true,
//   "data": [
//     {
//       "id": "uuid",
//       "title": "Announcement Title",
//       "content": "Full content...",
//       "alert_level": "critical",
//       "alert_type": "Typhoon Warning",
//       "areas": "Barangay Tubigon",
//       "action_items": ["Evacuate immediately", "Stay indoors"],
//       "created_at": "2026-03-30T10:00:00Z",
//       "is_pinned": false
//     }
//   ],
//   "meta": {
//     "total": 25,
//     "limit": 10,
//     "offset": 0
//   }
// }

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json'
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get query parameters
    const url = new URL(req.url)
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '10'), 50)
    const offset = parseInt(url.searchParams.get('offset') || '0')
    const alertLevel = url.searchParams.get('alert_level')

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration')
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Build query
    let query = supabase
      .from('announcements')
      .select('*', { count: 'exact' })
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply alert level filter if provided
    if (alertLevel) {
      query = query.eq('alert_level', alertLevel)
    }

    const { data, error, count } = await query

    if (error) {
      console.error('Database error:', error)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to fetch announcements',
          details: error.message 
        }),
        { 
          status: 500, 
          headers: corsHeaders 
        }
      )
    }

    // Normalize and sanitize response data
    const sanitizedData = (data || []).map(ann => ({
      id: ann.id,
      title: ann.title,
      content: ann.content,
      alert_level: ann.alert_level || 'info',
      alert_type: ann.alert_type || null,
      areas: ann.areas || null,
      action_items: ann.action_items || [],
      created_at: ann.created_at,
      updated_at: ann.updated_at,
      is_pinned: ann.is_pinned || false
    }))

    return new Response(
      JSON.stringify({
        success: true,
        data: sanitizedData,
        meta: {
          total: count || 0,
          limit,
          offset,
          has_more: (count || 0) > offset + limit
        }
      }),
      { 
        status: 200, 
        headers: corsHeaders 
      }
    )

  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error',
        message: error.message 
      }),
      { 
        status: 500, 
        headers: corsHeaders 
      }
    )
  }
})
