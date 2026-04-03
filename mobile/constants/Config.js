const LOCAL_URL = 'http://192.168.178.153:8000';
// 👇 HIER deine echte Render-URL eintragen:
const PROD_URL = 'https://rezepttok.onrender.com';

export const BASE_URL = PROD_URL; // Changed to always use PROD_URL for now to avoid local connection timeouts
export const THEME_COLOR = '#660ac2';  // New Primary Purple
export const BG_DARK = '#191022';      // New Dark Background
export const BG_LIGHT = '#f7f5f8';     // New Light Background
export const NAVBAR_HEIGHT = 80;       // Slightly taller for the new layout

// Helper: makes any URL absolute (handles both /static/... and https://... URLs)
export const getFullUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
};