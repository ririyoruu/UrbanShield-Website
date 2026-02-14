// Mapbox Configuration
// Get your free access token from https://www.mapbox.com/

export const MAPBOX_CONFIG = {
  // Your Mapbox access token
  ACCESS_TOKEN: process.env.REACT_APP_MAPBOX_ACCESS_TOKEN || 'pk.eyJ1IjoicmlyaXlveW8iLCJhIjoiY21manBodGNyMDRpazJscTAwN3o2Nm14MiJ9.j4bbvyMdcMeVUuOSRIIGkQ',
  
  // Default map settings
  DEFAULT_STYLE: 'mapbox://styles/mapbox/dark-v11',
  DEFAULT_CENTER: {
    longitude: 123.8554,
    latitude: 9.6496,
    zoom: 13
  },
  
  // Map styles available in the application
  STYLES: [
    { id: 'dark', name: 'Dark', style: 'mapbox://styles/mapbox/dark-v11' },
    { id: 'light', name: 'Light', style: 'mapbox://styles/mapbox/light-v11' },
    { id: 'satellite', name: 'Satellite', style: 'mapbox://styles/mapbox/satellite-streets-v12' },
    { id: 'streets', name: 'Streets', style: 'mapbox://styles/mapbox/streets-v12' }
  ]
};

export default MAPBOX_CONFIG;
