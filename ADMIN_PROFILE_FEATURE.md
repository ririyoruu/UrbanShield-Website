# Admin Profile Management Feature

## Overview

The Admin Profile Management feature provides administrators with a comprehensive interface to customize their profile, manage preferences, configure permissions, and access advanced settings. This feature enhances the admin experience by allowing personalization and fine-tuned control over the system.

## Features

### 🖼️ Profile Customization
- **Photo Upload**: Upload and manage profile pictures with preview functionality
- **Personal Information**: Manage name, email, phone, bio, department, and position
- **Contact Details**: Add website, LinkedIn, and Twitter profiles
- **Location**: Set and update location information

### ⚙️ User Preferences
- **Appearance**: Choose between dark, light, or auto theme
- **Language**: Select preferred language (English, Spanish, French, German)
- **Timezone**: Configure timezone settings
- **Notifications**: Control email, push, SMS, and desktop notifications
- **Privacy**: Manage online status, last seen, direct messages, and profile visibility

### 🔐 Permissions Management
- **User Management**: Control user account management capabilities
- **Report Management**: Manage incident report approval and review permissions
- **System Settings**: Configure system-wide settings access
- **Analytics**: Control access to analytics and reporting dashboards
- **Data Export**: Manage data export capabilities
- **System Modification**: Control system-level modification permissions

### 🚀 Advanced Settings
- **Dashboard Configuration**: Customize default view, auto-refresh, and display options
- **Report Settings**: Configure default filters, pagination, and approval workflows
- **Analytics Options**: Control trend displays, heatmaps, and data retention
- **Notification Management**: Set frequency, quiet hours, and channel preferences

### 🔒 Security Features
- **Two-Factor Authentication**: Enable/disable 2FA for enhanced security
- **Session Management**: Configure session timeout settings
- **Login Notifications**: Get notified of account access
- **Device Management**: Monitor and manage connected devices
- **Activity Logging**: View recent account activity

## Technical Implementation

### Components

#### AdminProfile.js
The main component that handles all profile management functionality:
- Profile information editing
- Photo upload with validation
- Tabbed interface for different settings categories
- Real-time form validation
- Data persistence

#### AdminProfile.css
Comprehensive styling for the profile management interface:
- Modern, responsive design
- Dark theme optimized
- Smooth animations and transitions
- Mobile-friendly layout

### Database Schema

#### admin_profiles Table
```sql
CREATE TABLE admin_profiles (
    id UUID PRIMARY KEY,
    admin_id UUID REFERENCES auth.users(id),
    full_name TEXT,
    email TEXT,
    phone TEXT,
    bio TEXT,
    department TEXT,
    position TEXT,
    location TEXT,
    website TEXT,
    linkedin TEXT,
    twitter TEXT,
    avatar_url TEXT,
    preferences JSONB,
    permissions JSONB,
    security JSONB,
    advanced_settings JSONB,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

### API Integration

#### Supabase Service Methods
- `getAdminProfile(adminId)`: Fetch admin profile data
- `updateAdminProfile(adminId, profileData)`: Update profile information
- `uploadAvatar(adminId, formData)`: Handle avatar uploads

## Usage

### Accessing the Profile
1. Navigate to the Admin Dashboard
2. Click on the "Profile" tab in the sidebar
3. The profile management interface will load

### Updating Profile Information
1. Go to the "Profile" tab
2. Edit the desired fields
3. Click "Save Profile" to persist changes

### Managing Preferences
1. Navigate to the "Preferences" tab
2. Configure appearance, notifications, and privacy settings
3. Save changes to apply new preferences

### Setting Permissions
1. Access the "Permissions" tab
2. Toggle the desired permission settings
3. Save to update admin capabilities

### Advanced Configuration
1. Go to the "Advanced" tab
2. Configure dashboard, reports, analytics, and notification settings
3. Save to apply advanced configurations

### Security Settings
1. Navigate to the "Security" tab
2. Configure authentication and security preferences
3. View recent activity and manage devices

## File Structure

```
src/
├── components/
│   ├── AdminProfile.js          # Main profile component
│   ├── AdminProfile.css         # Profile styling
│   └── AdminDashboard.js        # Updated dashboard with profile tab
├── config/
│   └── supabase.js             # Updated with profile methods
└── database/
    ├── admin_profiles_table.sql # Database schema
    └── ADMIN_PROFILE_FEATURE.md # This documentation
```

## Security Considerations

### Row Level Security (RLS)
- Admins can only access their own profile data
- Profile data is protected by Supabase RLS policies
- Secure authentication required for all operations

### Data Validation
- Client-side validation for all form inputs
- Server-side validation for uploaded files
- File type and size restrictions for avatars

### Privacy Controls
- Granular privacy settings
- Optional data sharing controls
- Secure data transmission

## Future Enhancements

### Planned Features
- **Profile Templates**: Pre-configured profile templates for different admin roles
- **Bulk Profile Management**: Manage multiple admin profiles simultaneously
- **Profile Analytics**: Track profile usage and engagement metrics
- **Advanced Photo Editing**: Built-in photo editing capabilities
- **Profile Export/Import**: Backup and restore profile configurations

### Integration Opportunities
- **Single Sign-On (SSO)**: Integration with enterprise SSO providers
- **Directory Services**: Sync with Active Directory or LDAP
- **Audit Logging**: Enhanced activity tracking and reporting
- **API Access**: RESTful API for profile management

## Troubleshooting

### Common Issues

#### Profile Not Loading
- Check if the admin_profiles table exists in the database
- Verify RLS policies are correctly configured
- Ensure the admin user has proper permissions

#### Photo Upload Failing
- Verify file size is under 5MB limit
- Check file type is supported (jpg, jpeg, png, gif)
- Ensure Supabase Storage is properly configured

#### Settings Not Saving
- Check browser console for JavaScript errors
- Verify network connectivity
- Ensure database connection is stable

### Support
For technical support or feature requests, please contact the development team or create an issue in the project repository.

## Conclusion

The Admin Profile Management feature provides a comprehensive solution for administrator personalization and system configuration. With its modern interface, robust security, and extensive customization options, it enhances the overall admin experience while maintaining data integrity and security standards.
