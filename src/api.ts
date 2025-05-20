const API_BASE_URL = 'https://seoanalyzerbackend.onrender.com';

export async function analyzeSite(url: string, maxPages: number = 20, singlePage: boolean = true) {
  const response = await fetch(`${API_BASE_URL}/api/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, max_pages: maxPages, single_page: singlePage, remove_duplicates: true }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to analyze website');
  }
  
  return response.json();
}

export async function getSitemap() {
  const response = await fetch(`${API_BASE_URL}/api/sitemap`);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get sitemap');
  }
  
  return response.json();
}

export async function analyzeSpecificUrl(url: string) {
  const response = await fetch(`${API_BASE_URL}/api/analyze-url`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, remove_duplicates: true }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to analyze URL');
  }
  
  return response.json();
}