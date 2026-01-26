export const environment = {
  production: true,
  apiUrl: typeof apiUrl !== 'undefined' ? apiUrl : 'https://your-domain.com/api',
  hookahDbApiUrl: 'https://hdb.coolify.dknas.org',
  hookahDbApiKey: typeof hookahDbApiKey !== 'undefined' ? hookahDbApiKey : 'YOUR_API_KEY_HERE',
};
