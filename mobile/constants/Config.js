// Use local URL in development, and environment variable in production
const LOCAL_URL = 'http://192.168.178.153:8000';
const PROD_URL = process.env.EXPO_PUBLIC_API_URL || LOCAL_URL;

export const BASE_URL = __DEV__ ? LOCAL_URL : PROD_URL;
export const THEME_COLOR = '#00C2FF';
export const NAVBAR_HEIGHT = 60;
