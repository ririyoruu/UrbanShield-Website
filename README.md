# UrbanShield - Incident Reporting System

UrbanShield is a modern, responsive web application for urban safety and incident reporting in Tagbilaran City, Bohol, Philippines. Built with React.js, it provides separate dashboards for administrators and tourists with advanced UI components, interactive Mapbox integration, and a dark red theme.

## Features

### 🏠 Landing Page
- Modern hero section with animated elements
- Navigation bar with Home, News, and Reports sections
- Interactive features showcase
- Statistics display
- Responsive design for all devices

### 👨‍💼 Admin Dashboard
- **Overview**: Real-time analytics and statistics
- **Reports Management**: Approve/reject incident reports
- **Analytics**: Interactive charts and trend analysis
- **Map View**: Placeholder for interactive map integration
- **Settings**: System configuration and user management

### 👥 Tourist Dashboard
- **Safety Overview**: Real-time safety scores and alerts
- **Incident Browser**: View current incidents with filtering
- **Safety Map**: Area-based safety ratings (placeholder)
- **Favorites**: Save important locations and alerts
- **Safety Tips**: Essential safety information for visitors

### 🎨 Design Features
- **Dark Red Theme**: Professional color scheme with gradients
- **Glass Morphism**: Modern UI with backdrop blur effects
- **Responsive Design**: Mobile-first approach
- **Advanced Animations**: Smooth transitions and hover effects
- **Modern Typography**: Inter font family for better readability

## Technology Stack

- **React.js 18** - Frontend framework
- **React Router** - Client-side routing
- **Mapbox GL JS** - Interactive maps and geospatial visualization
- **React Map GL** - React wrapper for Mapbox GL JS
- **Recharts** - Data visualization
- **Lucide React** - Modern icon library
- **Framer Motion** - Animation library
- **CSS3** - Styling with modern features

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Mapbox account (free) for map functionality

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd urbanshield
```

2. Install dependencies:
```bash
npm install
```

3. Set up Mapbox (Required for map functionality):
   - Go to [https://www.mapbox.com/](https://www.mapbox.com/)
   - Create a free account
   - Get your access token from the dashboard
   - Create a `.env` file in the root directory:
   ```bash
   REACT_APP_MAPBOX_ACCESS_TOKEN=your_mapbox_access_token_here
   ```

4. Start the development server:
```bash
npm start
```

5. Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

## Project Structure

```
src/
├── components/
│   ├── LandingPage.js          # Main landing page
│   ├── LandingPage.css         # Landing page styles
│   ├── AdminDashboard.js       # Admin dashboard component
│   ├── AdminDashboard.css      # Admin dashboard styles
│   ├── TouristDashboard.js     # Tourist dashboard component
│   ├── TouristDashboard.css    # Tourist dashboard styles
│   ├── MapComponent.js         # Interactive Mapbox component
│   ├── MapComponent.css        # Map component styles
│   ├── LoginModal.js           # Login modal component
│   ├── SignupModal.js          # Signup modal component
│   └── Modal.css               # Modal styles
├── config/
│   └── mapbox.js               # Mapbox configuration
├── App.js                      # Main app component
├── App.css                     # Global app styles
├── index.js                    # Entry point
└── index.css                   # Global styles
```

## Usage

### For Administrators
1. Click "Sign Up" or "Login" on the landing page
2. Select "Administrator" as user type
3. Access the admin dashboard with full management capabilities
4. Review and approve/reject incident reports
5. View analytics and system settings

### For Tourists
1. Click "Sign Up" or "Login" on the landing page
2. Select "Tourist" as user type
3. Access the tourist dashboard for safety information
4. View current incidents and safety alerts
5. Save favorite locations and access safety tips

## Key Features

### Authentication System
- Separate login flows for administrators and tourists
- User type-based routing and access control
- Secure modal-based authentication

### Responsive Design
- Mobile-first approach
- Adaptive layouts for all screen sizes
- Touch-friendly interface elements

### Advanced UI Components
- Interactive charts and graphs
- Real-time data visualization
- Smooth animations and transitions
- Modern glass morphism effects

### Data Management
- Sample data for demonstration
- Filtering and search functionality
- Status management for reports
- Favorites system for tourists

## Customization

### Theme Colors
The application uses a dark red theme with the following color palette:
- Primary Red: `#dc2626`
- Secondary Red: `#ef4444`
- Accent Blue: `#3b82f6`
- Success Green: `#10b981`
- Warning Orange: `#f59e0b`

### Adding New Features
1. Create new components in the `src/components/` directory
2. Add corresponding CSS files for styling
3. Update routing in `App.js` if needed
4. Follow the existing design patterns and color scheme

## Mapbox Features

### Interactive Maps
- **Multiple Map Styles**: Dark, Light, Satellite, and Streets views
- **Custom Markers**: Color-coded incident markers with severity indicators
- **Interactive Popups**: Detailed incident information with admin actions
- **Real-time Updates**: Dynamic marker updates based on incident status
- **Navigation Controls**: Zoom, pan, fullscreen, and scale controls
- **Responsive Design**: Optimized for desktop and mobile devices

### Map Functionality
- **Incident Visualization**: All incidents displayed with appropriate icons
- **Severity Indicators**: Color-coded markers (red=high, orange=medium, green=low)
- **Animated Markers**: Pulsing animation for high-priority incidents
- **Click Interactions**: Detailed popups with incident information
- **Style Switching**: Easy switching between different map styles
- **Statistics Overlay**: Real-time incident counts and metrics

## Future Enhancements

- [x] ~~Real-time map integration~~ ✅ **Completed with Mapbox**
- [ ] Heatmap visualization for incident density
- [ ] Route optimization for emergency responders
- [ ] Geofencing and alert zones
- [ ] Push notifications
- [ ] Real-time chat system
- [ ] Advanced reporting tools
- [ ] Mobile app development
- [ ] Backend API integration
- [ ] Database connectivity
- [ ] User authentication with backend

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support or questions, please contact the development team or create an issue in the repository.

---

**UrbanShield** - Protecting urban communities through technology and innovation.
