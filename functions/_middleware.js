// Middleware Cloudflare Pages pour rediriger les API calls
export async function onRequest(context) {
  const url = new URL(context.request.url);
  
  // Rediriger les appels API vers le backend
  if (url.pathname.startsWith('/api/')) {
    const backendUrl = 'https://votre-backend.railway.app' + url.pathname + url.search;
    
    return fetch(backendUrl, {
      method: context.request.method,
      headers: {
        ...Object.fromEntries(context.request.headers),
        'Host': 'votre-backend.railway.app'
      },
      body: context.request.body
    });
  }
  
  // Servir les fichiers statiques
  return context.next();
}
