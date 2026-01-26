export const environment = {
  production: false,
  apiUrl: typeof apiUrl !== 'undefined' ? apiUrl : 'http://localhost:3000/api',
  hookahDbApiUrl: 'https://hdb.coolify.dknas.org',
  hookahDbApiKey: typeof hookahDbApiKey !== 'undefined' ? hookahDbApiKey : '',
};
