# UrbanShield Database Setup Instructions

## Prerequisites
- Supabase account (free tier available)
- Node.js and npm installed
- Git (for version control)

## Database Setup

### 1. Create Supabase Project
1. Go to [https://supabase.com](https://supabase.com)
2. Sign in or create a new account
3. Click "New Project"
4. Choose your organization
5. Fill in project details:
   - Name: `urbanshield`
   - Database Password: Choose a strong password
   - Region: Choose closest to your location
6. Click "Create new project"

### 2. Configure Database Schema
1. In your Supabase dashboard, go to the SQL Editor
2. Copy and paste the contents of `database_schema.sql` into the editor
3. Click "Run" to execute the SQL commands
4. This will create all necessary tables, indexes, and security policies

### 3. Set Up Row Level Security (RLS)
The schema automatically enables RLS and creates policies for:
- Users can only view/edit their own data
- Admins can view/edit all data
- Public can view approved incident reports

### 4. Environment Configuration
1. In your Supabase dashboard, go to Settings > API
2. Copy your project URL and anon key
3. Update the credentials in `src/config/supabase.js` (already done)
4. Create a `.env` file in your project root with:
```
REACT_APP_MAPBOX_ACCESS_TOKEN=your_mapbox_token_here
REACT_APP_SUPABASE_URL=https://jphydwbpizcmltrehuyp.supabase.co/
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpwaHlkd2JwaXpjbWx0cmVodXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxMDYyMDQsImV4cCI6MjA3NDY4MjIwNH0.LBscRvA_Y-xKVD27UphJYXr62cmapUMr-yZcgzd4bG8
```

## Admin Dashboard Features

### Real-time Data Integration
- **Live Statistics**: Dashboard stats update automatically from database
- **Real-time Reports**: New incident reports appear instantly
- **Live Analytics**: Charts and graphs reflect current database state
- **Auto-refresh**: Data refreshes automatically with real-time subscriptions

### Report Management
- **View All Reports**: See all incident reports from the database
- **Filter by Status**: Filter reports by pending, approved, rejected
- **Approve/Reject**: Update report status with admin notes
- **Delete Reports**: Remove inappropriate or duplicate reports
- **Search Functionality**: Search reports by title or location

### Analytics Dashboard
- **Monthly Trends**: View incident trends over time
- **Type Distribution**: See breakdown of incident types
- **Response Metrics**: Track response times and resolution rates
- **Geographic Insights**: Map-based incident visualization

### User Management
- **View All Users**: See registered users (admins and tourists)
- **User Statistics**: Track active users and registration trends
- **Account Management**: Enable/disable user accounts

## Database Tables

### `users`
- Extends Supabase auth.users
- Stores additional profile information
- Links to incident reports

### `incident_reports`
- Main table for all incident reports
- Includes location, type, priority, status
- Links to reporter and admin who reviewed

### `incident_analytics`
- Tracks response and resolution times
- Used for performance metrics

### `system_settings`
- Configurable system settings
- Auto-approval rules, notification settings

### `notifications`
- User notifications system
- Admin alerts for new reports

## Security Features

### Row Level Security (RLS)
- Users can only access their own data
- Admins have full access to all data
- Public can only view approved reports

### Authentication
- Supabase Auth integration
- Email/password authentication
- User type-based access control
- Session management

### Data Validation
- Input validation on all forms
- SQL injection protection
- XSS protection
- CSRF protection

## API Integration

### Real-time Subscriptions
```javascript
// Subscribe to report changes
const subscription = adminService.subscribeToReports((payload) => {
  // Handle real-time updates
});
```

### CRUD Operations
```javascript
// Get all reports
const reports = await adminService.getAllReports();

// Update report status
await adminService.updateReportStatus(reportId, 'approved', 'Admin notes');

// Get analytics data
const analytics = await adminService.getAnalyticsData();
```

## Deployment Notes

### Environment Variables
- Never commit `.env` files to version control
- Use environment-specific configurations
- Secure API keys and database credentials

### Production Considerations
- Enable SSL/HTTPS
- Configure CORS properly
- Set up monitoring and logging
- Regular database backups
- Performance optimization

## Troubleshooting

### Common Issues
1. **Connection Errors**: Check Supabase URL and API key
2. **Permission Denied**: Verify RLS policies are correct
3. **Real-time Not Working**: Check subscription setup
4. **Authentication Issues**: Verify user creation process

### Debug Mode
Enable debug logging by adding to your environment:
```
REACT_APP_DEBUG=true
```

## Support
For issues or questions:
1. Check Supabase documentation
2. Review error logs in browser console
3. Verify database schema is correctly applied
4. Test API endpoints in Supabase dashboard

---

**Note**: This setup provides a complete admin dashboard with real-time database integration. All data is stored and managed through Supabase, providing scalability, security, and real-time capabilities.
