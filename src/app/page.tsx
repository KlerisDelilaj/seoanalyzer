"use client";
import { useState } from 'react';
import { analyzeSite, analyzeSpecificUrl } from '../api';
import { 
  BarChart, Bar, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area, LineChart, Line
} from 'recharts';

// Define interfaces for the data structures
interface SeoData {
  analyzed_url?: string;
  page_count?: number;
  pages?: Page[];
  sitemap_urls?: string[];
  stats: {
    numeric?: {
      word_count?: { mean: number };
      image_count?: { mean: number };
      internal_links?: { sum: number };
      external_links?: { sum: number };
    };
    pageMetrics?: PageMetric[];
    linkDistribution?: LinkDistributionItem[];
    common_keywords?: KeywordItem[];
    top_link_pages?: TopLinkPage[];
    keywords_by_page?: KeywordsByPage[];
  };
  recommendations: {
    general: Recommendation[];
    content: Recommendation[];
    pages_to_improve: PagesToImprove[];
  };
}

interface PageMetric {
  url: string;
  wordCount: number;
  imageCount: number;
  pageLink: string;
  keywordDensity?: number;
}

interface LinkDistributionItem {
  name: string;
  value: number;
}

interface KeywordItem {
  name: string;
  value: number;
  relevance?: number;
}

interface TopLinkPage {
  title?: string;
  url?: string;
  page_link: string;
  internal_links: number;
  external_links: number;
  total_links: number;
}

interface KeywordsByPage {
  title?: string;
  url?: string;
  page_link: string;
  single_keywords?: { keyword: string; count: number }[];
  phrases?: { phrase: string; count: number }[];
}

interface Recommendation {
  text: string;
  recommendation: string;
  type: 'warning' | 'success' | 'info';
}

interface PagesToImprove {
  description: string;
  pages: Page[];
}

// Define types for the component props
interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  label?: string;
}

interface CustomLegendProps {
  payload?: Array<{color: string; value: string;}>;
}

// Enhanced color palettes
const CHART_COLORS = {
  primary: ['#4f46e5', '#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe'],
  secondary: ['#06b6d4', '#22d3ee', '#67e8f9', '#a5f3fc', '#cffafe'],
  accent: ['#f59e0b', '#fbbf24', '#fcd34d', '#fde68a', '#fef3c7'],
  neutral: ['#6b7280', '#9ca3af', '#d1d5db', '#e5e7eb', '#f3f4f6'],
  success: ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#d1fae5'],
  warning: ['#f97316', '#fb923c', '#fdba74', '#fed7aa', '#ffedd5'],
  error: ['#ef4444', '#f87171', '#fca5a5', '#fecaca', '#fee2e2'],
};

// Custom tooltip component for better styling
const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 border border-gray-200 shadow-lg rounded-md">
        <p className="font-medium text-gray-900">{label}</p>
        {payload.map((entry, index) => (
          <p key={`item-${index}`} style={{ color: entry.color }} className="text-sm">
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Styled legend for charts
const CustomLegend = (props: CustomLegendProps) => {
  const { payload } = props;
  
  if (!payload) return null;

  return (
    <ul className="flex flex-wrap justify-center gap-4 mt-2">
      {payload.map((entry, index) => (
        <li key={`item-${index}`} className="flex items-center">
          <div 
            className="w-3 h-3 rounded-full mr-2"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-sm text-gray-700">{entry.value}</span>
        </li>
      ))}
    </ul>
  );
};

// Define type interfaces for the data
interface OverviewStats {
  total_pages: number;
  avg_word_count: number;
  avg_image_count: number;
  total_links: number;
}

interface Page {
  title?: string;
  url?: string;
  page_link: string;
  word_count: number;
  h1_count: number;
  image_count: number;
  raw_html?: string;
  structured_content?: {
    headings?: Array<{
      level: number;
      text: string;
    }>;
    sections?: Array<{
      heading?: {
        level: number;
        text: string;
      };
      content: Array<{
        type?: string;
        text: string;
        html?: string;
      }>;
    }>;
  };
}

export default function Home() {
  const [url, setUrl] = useState('');
  const [maxPages] = useState(20);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState<SeoData | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedPage, setSelectedPage] = useState<Page | null>(null);
  const [showPageContent, setShowPageContent] = useState(false);
  const [viewContentType, setViewContentType] = useState('structured');
  
  const startAnalysis = async () => {
    if (!url) return;
    
    setError('');
    setIsAnalyzing(true);
    
    try {
      const result = await analyzeSite(url, maxPages, true);
      setData(result);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message || 'An error occurred during analysis');
      } else {
        setError('An error occurred during analysis');
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const analyzeSitemapUrl = async (urlToAnalyze: string) => {
    if (!urlToAnalyze) return;
    
    setError('');
    setIsAnalyzing(true);
    
    try {
      const result = await analyzeSpecificUrl(urlToAnalyze);
      setData(result);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message || 'An error occurred analyzing the URL');
      } else {
        setError('An error occurred analyzing the URL');
      }
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  const getOverviewStats = (): OverviewStats => {
    if (!data?.stats?.numeric) return {
      total_pages: 0,
      avg_word_count: 0,
      avg_image_count: 0,
      total_links: 0
    };
    
    const { numeric } = data.stats;
    
    return {
      total_pages: data.page_count || 0,
      avg_word_count: numeric.word_count?.mean || 0,
      avg_image_count: numeric.image_count?.mean || 0,
      total_links: (numeric.internal_links?.sum || 0) + (numeric.external_links?.sum || 0)
    };
  };

  const renderStructuredContent = (page: Page) => {
    if (!page?.structured_content) {
      return <p className="text-gray-700">No structured content available</p>;
    }

    const { headings, sections } = page.structured_content;

    return (
      <div className="text-gray-700">
        <h3 className="text-xl font-bold mb-4">Page Structure</h3>
        
        {/* Display all headings at the top as a table of contents */}
        {headings && headings.length > 0 && (
          <div className="mb-6 bg-indigo-50 p-4 rounded-lg border border-indigo-100">
            <h4 className="font-semibold mb-2 text-indigo-800">Page Headings:</h4>
            <ul className="space-y-2">
              {headings.map((heading, idx) => (
                <li key={idx} className={`
                  ${heading.level === 1 ? 'font-bold text-indigo-800' : 
                    heading.level === 2 ? 'font-semibold text-indigo-700' : 'text-indigo-600'} 
                  pl-${heading.level * 2}
                `}>
                  {heading.text} <span className="text-indigo-400 text-sm">(H{heading.level})</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Display page content by sections */}
        {sections && sections.length > 0 ? (
          <div className="space-y-6">
            {sections.map((section, idx) => (
              <div key={idx} className="border-b border-gray-200 pb-4">
                {/* Display section heading */}
                {section.heading && (
                  <div 
                    className={`font-bold ${
                      section.heading.level === 1 ? 'text-2xl text-indigo-800' : 
                      section.heading.level === 2 ? 'text-xl text-indigo-700' : 
                      section.heading.level === 3 ? 'text-lg text-indigo-600' : 'text-base text-indigo-500'
                    } mb-2`}
                  >
                    {section.heading.text}
                  </div>
                )}
                
                {/* Display section content */}
                <div className="space-y-2">
                  {section.content.map((content, contentIdx) => {
                    if (content.type && content.type.startsWith('h') && content.type.length === 2) {
                      const level = parseInt(content.type[1]);
                      return (
                        <div 
                          key={contentIdx} 
                          className={`font-bold ${
                            level === 1 ? 'text-2xl text-indigo-800' : 
                            level === 2 ? 'text-xl text-indigo-700' : 
                            level === 3 ? 'text-lg text-indigo-600' : 'text-base text-indigo-500'
                          } mb-2`}
                        >
                          {content.text}
                        </div>
                      );
                    }
                    
                    if (content.type === 'p' || !content.html) {
                      return (
                        <div key={contentIdx} className="text-gray-700">
                          {content.text}
                        </div>
                      );
                    }
                    
                    if (content.type === 'ul' || content.type === 'ol' || content.type === 'table') {
                      return (
                        <div 
                          key={contentIdx} 
                          className="text-gray-700" 
                          dangerouslySetInnerHTML={{ __html: content.html }}
                        />
                      );
                    }
                    
                    return (
                      <div key={contentIdx} className="text-gray-700">
                        {content.text}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-700">No structured sections found on this page.</p>
        )}
        
        {/* If no sections but we have headings, display raw headings */}
        {(!sections || sections.length === 0) && headings && headings.length > 0 && (
          <div className="space-y-4">
            <p className="text-gray-700">No structured sections found, but headings were detected:</p>
            <div className="space-y-2">
              {headings.map((heading, idx) => (
                <div 
                  key={idx} 
                  className={`font-bold ${
                    heading.level === 1 ? 'text-2xl text-indigo-800' : 
                    heading.level === 2 ? 'text-xl text-indigo-700' : 
                    heading.level === 3 ? 'text-lg text-indigo-600' : 'text-base text-indigo-500'
                  }`}
                >
                  {heading.text}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderRawHtml = (page: Page) => {
    if (!page?.raw_html) {
      return <p className="text-gray-700">No HTML content available</p>;
    }

    const htmlSnippet = page.raw_html.slice(0, 2000) + '...';

    return (
      <div>
        <h3 className="text-xl font-bold mb-4 text-gray-800">Raw HTML</h3>
        <pre className="bg-gray-800 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm font-mono">
          {htmlSnippet}
        </pre>
      </div>
    );
  };
  
  return (
    <main className="min-h-screen bg-gray-50 text-gray-800">
      {/* Header with improved design */}
      <header className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 shadow-xl p-6 text-white">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between">
          <div className="flex items-center">
            <div className="mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              SEO Analyzer 
              <span className="opacity-70 text-xl ml-2 font-normal">by Kleris Delilaj</span>
            </h1>
          </div>
          
          {!data ? (
            <div className="mt-4 md:mt-0 w-full md:w-1/2">
              <div className="flex flex-col md:flex-row gap-2">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="Enter website URL (e.g., https://example.com)"
                    className="pl-10 flex-1 p-3 rounded-lg border-0 w-full focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
                <button
                  onClick={startAnalysis}
                  disabled={isAnalyzing || !url}
                  className={`p-3 rounded-lg ${isAnalyzing || !url ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-500 hover:bg-indigo-600 shadow-md hover:shadow-lg transition-all'} text-white font-medium`}
                >
                  {isAnalyzing ? 
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Analyzing...
                    </span> 
                    : 'Analyze Single Page'}
                </button>
              </div>
              
              {error && (
                <div className="mt-2 bg-red-100 border-l-4 border-red-500 text-red-700 p-2 rounded">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm">{error}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-white bg-opacity-10 p-2 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-200" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.083 9h1.946c.089-1.546.383-2.97.837-4.118A6.004 6.004 0 004.083 9zM10 2a8 8 0 100 16 8 8 0 000-16zm0 2c-.076 0-.232.032-.465.262-.238.234-.497.623-.737 1.182-.389.907-.673 2.142-.766 3.556h3.936c-.093-1.414-.377-2.649-.766-3.556-.24-.56-.5-.948-.737-1.182C10.232 4.032 10.076 4 10 4zm3.971 5c-.089-1.546-.383-2.97-.837-4.118A6.004 6.004 0 0115.917 9h-1.946zm-2.003 2H8.032c.093 1.414.377 2.649.766 3.556.24.56.5.948.737 1.182.233.23.389.262.465.262.076 0 .232-.032.465-.262.238-.234.498-.623.737-1.182.389-.907.673-2.142.766-3.556zm1.166 4.118c.454-1.147.748-2.572.837-4.118h1.946a6.004 6.004 0 01-2.783 4.118zm-6.268 0C6.412 13.97 6.118 12.546 6.03 11H4.083a6.004 6.004 0 002.783 4.118z" clipRule="evenodd" />
              </svg>
              <span className="font-medium text-indigo-100">Analyzing:</span> 
              <span className="text-white">{data.analyzed_url || url}</span>
              <button 
                onClick={() => setData(null)} 
                className="ml-2 px-3 py-1 bg-white bg-opacity-20 rounded text-sm hover:bg-opacity-30 transition-all"
              >
                New Analysis
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main content with improved UI */}
      {!data ? (
        <div className="max-w-7xl mx-auto p-6">
          {isAnalyzing ? (
            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
              <div className="animate-pulse flex flex-col items-center">
                <div className="h-16 w-16 bg-indigo-400 rounded-full flex items-center justify-center">
                  <svg className="h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="mt-4 space-y-3">
                  <div className="h-4 bg-indigo-200 rounded w-3/4 mx-auto"></div>
                  <div className="h-4 bg-indigo-200 rounded w-1/2 mx-auto"></div>
                </div>
              </div>
              <h2 className="mt-6 text-xl font-medium text-gray-800">Analyzing website...</h2>
              <p className="mt-2 text-gray-600">This may take a few moments depending on the size of the website.</p>
            </div>
          ) : (
            <div className="bg-gradient-to-br from-white to-indigo-50 rounded-xl shadow-lg p-8">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="flex-shrink-0 bg-indigo-100 p-4 rounded-full">
                  <svg className="h-16 w-16 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-2 text-gray-800">Website SEO Analysis Tool</h2>
                  <p className="text-gray-600 mb-4 max-w-2xl">
                    Enter a URL above to analyze the website&apos;s SEO metrics. The tool will analyze the page
                    you enter, extract sitemap information, and provide detailed SEO recommendations to improve your search rankings.
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <div className="bg-indigo-100 text-indigo-800 px-4 py-2 rounded-full flex items-center">
                      <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"></path>
                        <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd"></path>
                      </svg>
                      Content Analysis
                    </div>
                    <div className="bg-cyan-100 text-cyan-800 px-4 py-2 rounded-full flex items-center">
                      <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd"></path>
                      </svg>
                      Link Analysis
                    </div>
                    <div className="bg-amber-100 text-amber-800 px-4 py-2 rounded-full flex items-center">
                      <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd"></path>
                      </svg>
                      Keyword Density
                    </div>
                    <div className="bg-emerald-100 text-emerald-800 px-4 py-2 rounded-full flex items-center">
                      <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z"></path>
                      </svg>
                      SEO Recommendations
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Tabs with improved design */}
          <div className="bg-white shadow-md border-b border-gray-200">
            <div className="max-w-7xl mx-auto relative">
              <nav className="flex overflow-x-auto">
                {[
                  { id: 'dashboard', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
                  { id: 'content', label: 'Content', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
                  { id: 'links', label: 'Links', icon: 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1' },
                  { id: 'keywords', label: 'Keywords', icon: 'M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z' },
                  { id: 'recommendations', label: 'Recommendations', icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z' },
                  { id: 'sitemap', label: 'Sitemap', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-6 border-b-2 flex items-center whitespace-nowrap transition-all ${
                      activeTab === tab.id
                        ? 'border-indigo-500 text-indigo-600 font-medium'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      className="h-5 w-5 mr-2" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                    </svg>
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Dashboard content */}
          <div className="max-w-7xl mx-auto p-6">
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                {/* Summary cards with new design */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    {
                      label: 'Pages Analyzed',
                      value: getOverviewStats().total_pages,
                      icon: 'M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z',
                      color: 'from-indigo-500 to-purple-600'
                    },
                    {
                      label: 'Avg. Word Count',
                      value: Math.round(getOverviewStats().avg_word_count),
                      icon: 'M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z',
                      color: 'from-cyan-500 to-blue-500'
                    },
                    {
                      label: 'Avg. Images',
                      value: getOverviewStats().avg_image_count.toFixed(1),
                      icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
                      color: 'from-amber-500 to-orange-500'
                    },
                    {
                      label: 'Total Links',
                      value: getOverviewStats().total_links,
                      icon: 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1',
                      color: 'from-emerald-500 to-green-500'
                    }
                  ].map((card, idx) => (
                    <div 
                      key={idx} 
                      className="bg-white rounded-xl shadow-md overflow-hidden transition-all hover:shadow-lg"
                    >
                      <div className="p-5">
                        <div className="flex justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-500">{card.label}</p>
                            <p className="text-3xl font-bold mt-1 bg-clip-text text-transparent bg-gradient-to-r ${card.color}">{card.value}</p>
                          </div>
                          <div className={`rounded-full p-3 bg-gradient-to-r ${card.color} h-12 w-12 flex items-center justify-center`}>
                            <svg 
                              xmlns="http://www.w3.org/2000/svg" 
                              className="h-6 w-6 text-white" 
                              fill="none" 
                              viewBox="0 0 24 24" 
                              stroke="currentColor"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={card.icon} />
                            </svg>
                          </div>
                        </div>
                      </div>
                      <div className={`h-1 bg-gradient-to-r ${card.color}`}></div>
                    </div>
                  ))}
                </div>
                
                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  {/* Page Metrics */}
                  <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all">
                    <div className="p-5 border-b border-gray-100">
                      <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                        <svg className="h-5 w-5 mr-2 text-indigo-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                          <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"></path>
                        </svg>
                        Page Metrics
                      </h3>
                      <p className="text-sm text-gray-500">Word count and images per page</p>
                    </div>
                    <div className="p-5">
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={data.stats.pageMetrics?.slice(0, 5).map((page: PageMetric) => ({
                              ...page,
                              url: page.url.split('/').pop() || page.url // simplify URL display
                            })) || []}
                            margin={{ top: 10, right: 10, left: 10, bottom: 30 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis 
                              dataKey="url" 
                              angle={-45} 
                              textAnchor="end" 
                              height={60}
                              stroke="#6b7280"
                              tick={{ fontSize: 12 }}
                            />
                            <YAxis stroke="#6b7280" />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend content={<CustomLegend />} />
                            <Bar 
                              dataKey="wordCount" 
                              name="Word Count" 
                              fill="url(#colorWord)" 
                              radius={[4, 4, 0, 0]}
                            />
                            <Bar 
                              dataKey="imageCount" 
                              name="Image Count" 
                              fill="url(#colorImage)" 
                              radius={[4, 4, 0, 0]}
                            />
                            <defs>
                              <linearGradient id="colorWord" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={CHART_COLORS.primary[0]} stopOpacity={0.8}/>
                                <stop offset="95%" stopColor={CHART_COLORS.primary[0]} stopOpacity={0.6}/>
                              </linearGradient>
                              <linearGradient id="colorImage" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={CHART_COLORS.secondary[0]} stopOpacity={0.8}/>
                                <stop offset="95%" stopColor={CHART_COLORS.secondary[0]} stopOpacity={0.6}/>
                              </linearGradient>
                            </defs>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                  
                  {/* Link Distribution */}
                  <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all">
                    <div className="p-5 border-b border-gray-100">
                      <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                        <svg className="h-5 w-5 mr-2 text-cyan-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                          <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd"></path>
                        </svg>
                        Link Distribution
                      </h3>
                      <p className="text-sm text-gray-500">Types of links on the site</p>
                    </div>
                    <div className="p-5">
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={data.stats.linkDistribution || []}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={2}
                              dataKey="value"
                              label={({name, value, percent}) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                              labelLine={false}
                            >
                              {(data.stats.linkDistribution || []).map((entry: LinkDistributionItem, index: number) => (
                                <Cell 
                                  key={`cell-${index}`} 
                                  fill={
                                    index === 0 ? CHART_COLORS.primary[0] : 
                                    index === 1 ? CHART_COLORS.secondary[0] : 
                                    CHART_COLORS.accent[0]
                                  } 
                                />
                              ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                            <Legend content={<CustomLegend />} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Keywords Area Chart */}
                <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all">
                  <div className="p-5 border-b border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                      <svg className="h-5 w-5 mr-2 text-amber-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"></path>
                      </svg>
                      Top Keywords
                    </h3>
                    <p className="text-sm text-gray-500">Most frequently used keywords and phrases</p>
                  </div>
                  <div className="p-5">
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={data.stats.common_keywords?.slice(0, 7).map((k: KeywordItem, i: number) => ({
                            name: k.name,
                            value: k.value,
                            relevance: k.relevance ? k.relevance * 10 : 0,
                            rank: i + 1
                          })) || []}
                          margin={{ top: 10, right: 30, left: 30, bottom: 30 }}
                        >
                          <defs>
                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={CHART_COLORS.accent[1]} stopOpacity={0.8}/>
                              <stop offset="95%" stopColor={CHART_COLORS.accent[1]} stopOpacity={0.2}/>
                            </linearGradient>
                            <linearGradient id="colorRelevance" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={CHART_COLORS.primary[1]} stopOpacity={0.8}/>
                              <stop offset="95%" stopColor={CHART_COLORS.primary[1]} stopOpacity={0.2}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis 
                            dataKey="name" 
                            angle={-45} 
                            textAnchor="end" 
                            height={60}
                            stroke="#6b7280"
                            tick={{ fontSize: 12 }}
                          />
                          <YAxis stroke="#6b7280" />
                          <Tooltip content={<CustomTooltip />} />
                          <Legend content={<CustomLegend />} />
                          <Area 
                            type="monotone" 
                            dataKey="value" 
                            name="Occurrences" 
                            stroke={CHART_COLORS.accent[0]} 
                            fillOpacity={1} 
                            fill="url(#colorValue)" 
                          />
                          <Area 
                            type="monotone" 
                            dataKey="relevance" 
                            name="Relevance Score" 
                            stroke={CHART_COLORS.primary[0]} 
                            fillOpacity={1} 
                            fill="url(#colorRelevance)" 
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Content tab */}
            {activeTab === 'content' && (
              <div className="space-y-6">
                <div className="bg-white shadow-md rounded-xl overflow-hidden">
                  <div className="p-6 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-gray-200">
                    <div className="flex items-center">
                      <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-3 rounded-lg mr-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-800">Content Analysis</h3>
                        <p className="mt-1 text-gray-600">
                          Detailed metrics for each page&apos;s content, including word count, headings, and images.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {showPageContent && selectedPage && (
                    <div className="p-6 border-b border-gray-200 bg-gray-50">
                      <div className="flex justify-between items-center mb-4">
                        <div>
                          <h3 className="text-lg font-bold text-gray-800">
                            {selectedPage.title || "Page Content"}
                          </h3>
                          <p className="text-sm text-indigo-600">
                            <a 
                              href={selectedPage.page_link} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center hover:underline"
                            >
                              <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z"></path>
                                <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z"></path>
                              </svg>
                              {selectedPage.page_link}
                            </a>
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="bg-white rounded-lg shadow-sm p-1 flex">
                            <button 
                              onClick={() => setViewContentType('structured')}
                              className={`px-3 py-1.5 rounded ${viewContentType === 'structured' ? 'bg-indigo-100 text-indigo-700 font-medium' : 'text-gray-600 hover:bg-gray-100'}`}
                            >
                              Structured
                            </button>
                            <button 
                              onClick={() => setViewContentType('raw')}
                              className={`px-3 py-1.5 rounded ${viewContentType === 'raw' ? 'bg-indigo-100 text-indigo-700 font-medium' : 'text-gray-600 hover:bg-gray-100'}`}
                            >
                              HTML
                            </button>
                          </div>
                          <button 
                            onClick={() => setShowPageContent(false)}
                            className="p-1.5 bg-white text-gray-500 rounded-full shadow-sm hover:bg-gray-100"
                          >
                            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path>
                            </svg>
                          </button>
                        </div>
                      </div>
                      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm max-h-96 overflow-y-auto">
                        {viewContentType === 'structured' 
                          ? renderStructuredContent(selectedPage)
                          : renderRawHtml(selectedPage)
                        }
                      </div>
                    </div>
                  )}
                  
                  {/* Content metrics visualization */}
                  <div className="p-6 border-b border-gray-200">
                    <h4 className="text-lg font-semibold mb-4 text-gray-800">Content Overview</h4>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={data.pages?.slice(0, 6).map(page => ({
                            name: page.title || page.url?.split('/').pop() || 'Page',
                            words: page.word_count,
                            images: page.image_count,
                            headings: page.h1_count, 
                            id: page.page_link
                          })) || []}
                          margin={{ top: 20, right: 30, left: 30, bottom: 40 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis 
                            dataKey="name" 
                            angle={-45} 
                            textAnchor="end" 
                            height={60}
                            stroke="#6b7280"
                            tick={{ fontSize: 12 }}
                          />
                          <YAxis stroke="#6b7280" />
                          <Tooltip content={<CustomTooltip />} />
                          <Legend content={<CustomLegend />} />
                          <Bar 
                            dataKey="words" 
                            name="Words" 
                            fill={CHART_COLORS.primary[0]} 
                            radius={[4, 4, 0, 0]}
                          />
                          <Bar 
                            dataKey="images" 
                            name="Images" 
                            fill={CHART_COLORS.secondary[0]} 
                            radius={[4, 4, 0, 0]}
                          />
                          <Bar 
                            dataKey="headings" 
                            name="Headings" 
                            fill={CHART_COLORS.accent[0]} 
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  
                  {/* Content data table */}
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Page</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Words</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">H1</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Images</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {(data.pages || []).map((page, index) => (
                          <tr key={index} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 text-sm">
                              <div className="flex items-center">
                                <div className="bg-indigo-100 p-1 rounded mr-2">
                                  <svg className="h-4 w-4 text-indigo-700" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd"></path>
                                  </svg>
                                </div>
                                <a 
                                  href={page.page_link} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-indigo-600 hover:text-indigo-900 hover:underline font-medium truncate max-w-xs"
                                >
                                  {page.title || page.url}
                                </a>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                              <div className="flex items-center">
                                <div className="mr-2 w-16 bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="h-2 rounded-full bg-indigo-500" 
                                    style={{ width: `${Math.min(100, (page.word_count / 1000) * 100)}%` }}
                                  ></div>
                                </div>
                                <span>{page.word_count}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                page.h1_count === 1 ? 'bg-green-100 text-green-800' : 
                                page.h1_count === 0 ? 'bg-red-100 text-red-800' : 
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {page.h1_count}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{page.image_count}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <button 
                                onClick={() => {
                                  setSelectedPage(page);
                                  setShowPageContent(true);
                                  setViewContentType('structured');
                                }}
                                className="text-indigo-600 hover:text-indigo-900 flex items-center"
                              >
                                <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"></path>
                                  <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"></path>
                                </svg>
                                View Content
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
            
            {/* Links tab */}
            {activeTab === 'links' && (
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium mb-4 text-gray-800 flex items-center">
                  <svg className="h-5 w-5 mr-2 text-cyan-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd"></path>
                  </svg>
                  Link Analysis
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="h-80 border rounded-lg p-4 shadow-sm">
                    <h4 className="text-md font-medium mb-2 text-gray-800">Internal vs External Links</h4>
                    <ResponsiveContainer width="100%" height="80%">
                      <PieChart>
                        <Pie
                          data={data.stats.linkDistribution || []}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({name, value}) => `${name}: ${value}`}
                        >
                          {(data.stats.linkDistribution || []).map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={
                                index === 0 ? CHART_COLORS.primary[0] : 
                                index === 1 ? CHART_COLORS.secondary[0] : 
                                CHART_COLORS.accent[0]
                              } 
                            />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend content={<CustomLegend />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div>
                    <h4 className="text-md font-medium mb-2 text-gray-800">Top Pages by Links</h4>
                    <ul className="divide-y divide-gray-200">
                      {(data.stats.top_link_pages || []).map((page, index) => (
                        <li key={index} className="py-3">
                          <a 
                            href={page.page_link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="truncate font-medium text-indigo-600 hover:underline block"
                          >
                            {page.title || page.url}
                          </a>
                          <div className="text-sm text-gray-700 mt-1">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 mr-2">
                              Internal: {page.internal_links}
                            </span>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-cyan-100 text-cyan-800 mr-2">
                              External: {page.external_links}
                            </span>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              Total: {page.total_links}
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
            
            {/* Keywords tab */}
            {activeTab === 'keywords' && (
              <div className="space-y-6">
                <div className="bg-white shadow-md rounded-xl overflow-hidden">
                  <div className="p-6 bg-gradient-to-r from-amber-50 to-orange-50">
                    <div className="flex items-center">
                      <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-3 rounded-lg mr-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-800">Keyword Analysis</h3>
                        <p className="mt-1 text-gray-600">
                          Analysis of keywords and phrases used across your website.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Top Keywords Line Chart */}
                  <div className="p-6 border-b border-gray-200">
                    <h4 className="text-lg font-semibold mb-4 text-gray-800 flex items-center">
                      <svg className="h-5 w-5 mr-2 text-amber-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Top Keywords by Relevance
                    </h4>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={data.stats.common_keywords?.slice(0, 10).map(kw => ({
                            name: kw.name,
                            count: kw.value,
                            relevance: kw.relevance ? Math.round(kw.relevance * 10) / 10 : 0
                          })) || []}
                          margin={{ top: 10, right: 30, left: 30, bottom: 40 }}
                        >
                          <defs>
                            <linearGradient id="colorFrequency" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={CHART_COLORS.accent[0]} stopOpacity={0.8}/>
                              <stop offset="95%" stopColor={CHART_COLORS.accent[0]} stopOpacity={0.1}/>
                            </linearGradient>
                            <linearGradient id="colorRelevance" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={CHART_COLORS.primary[0]} stopOpacity={0.8}/>
                              <stop offset="95%" stopColor={CHART_COLORS.primary[0]} stopOpacity={0.1}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis 
                            dataKey="name" 
                            angle={-45} 
                            textAnchor="end" 
                            height={60}
                            stroke="#6b7280"
                            tick={{ fontSize: 12 }}
                          />
                          <YAxis yAxisId="left" stroke="#f59e0b" />
                          <YAxis yAxisId="right" orientation="right" stroke="#4f46e5" />
                          <Tooltip content={<CustomTooltip />} />
                          <Legend content={<CustomLegend />} />
                          <Line 
                            yAxisId="left"
                            type="monotone" 
                            dataKey="count" 
                            name="Frequency" 
                            stroke={CHART_COLORS.accent[0]} 
                            strokeWidth={3}
                            dot={{ r: 6, fill: CHART_COLORS.accent[0], strokeWidth: 2, stroke: "#fff" }}
                            activeDot={{ r: 8, fill: CHART_COLORS.accent[0], stroke: "#fff", strokeWidth: 2 }}
                            animationDuration={1500}
                          />
                          <Line 
                            yAxisId="right"
                            type="monotone" 
                            dataKey="relevance" 
                            name="Relevance Score" 
                            stroke={CHART_COLORS.primary[0]} 
                            strokeWidth={3}
                            dot={{ r: 6, fill: CHART_COLORS.primary[0], strokeWidth: 2, stroke: "#fff" }}
                            activeDot={{ r: 8, fill: CHART_COLORS.primary[0], stroke: "#fff", strokeWidth: 2 }}
                            animationDuration={1500}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
                
                {/* Keywords table */}
                <div className="bg-white shadow-md rounded-xl overflow-hidden">
                  <div className="p-5 border-b border-gray-200">
                    <h4 className="text-lg font-medium text-gray-800 flex items-center">
                      <svg className="h-5 w-5 mr-2 text-amber-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"></path>
                        <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd"></path>
                      </svg>
                      Keywords by Page
                    </h4>
                    <p className="text-sm text-gray-500">Detailed keyword analysis for each page</p>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Page</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Main Keyword</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Top Phrase</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Keyword Density</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {data.stats.keywords_by_page?.map((page, index) => (
                          <tr key={index} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <a 
                                href={page.page_link} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center text-indigo-600 hover:text-indigo-800 hover:underline font-medium"
                              >
                                <svg className="h-4 w-4 mr-1 text-indigo-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z"></path>
                                  <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z"></path>
                                </svg>
                                {page.title || page.url}
                              </a>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {page.single_keywords && page.single_keywords.length > 0 ? (
                                <div className="flex items-center">
                                  <span className="font-medium text-gray-800">{page.single_keywords[0].keyword}</span>
                                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                    {page.single_keywords[0].count}×
                                  </span>
                                </div>
                              ) : (
                                <span className="text-gray-500">None detected</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {page.phrases && page.phrases.length > 0 ? (
                                <div className="flex items-center">
                                  <span className="font-medium text-gray-800">{page.phrases[0].phrase}</span>
                                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-cyan-100 text-cyan-800">
                                    {page.phrases[0].count}×
                                  </span>
                                </div>
                              ) : (
                                <span className="text-gray-500">None detected</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {(() => {
                                const density = data.stats.pageMetrics?.find(p => p.pageLink === page.page_link)?.keywordDensity || 0;
                                return (
                                  <div className="flex items-center">
                                    <div className="w-16 bg-gray-200 rounded-full h-2.5 mr-2">
                                      <div 
                                        className={`h-2.5 rounded-full ${
                                          density < 1 ? 'bg-red-500' : 
                                          density < 2 ? 'bg-amber-500' : 
                                          density > 3.5 ? 'bg-amber-500' : 'bg-emerald-500'
                                        }`} 
                                        style={{ width: `${Math.min(100, density * 20)}%` }}
                                      ></div>
                                    </div>
                                    <span className="text-sm font-medium text-gray-700">
                                      {density.toFixed(2)}%
                                    </span>
                                  </div>
                                );
                              })()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
            
            {/* Recommendations tab */}
            {activeTab === 'recommendations' && (
              <div className="space-y-6">
                <div className="bg-white shadow-md rounded-xl divide-y divide-gray-100 overflow-hidden">
                  <div className="p-6 bg-gradient-to-r from-emerald-50 to-teal-50">
                    <div className="flex items-center">
                      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-3 rounded-lg mr-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-800">SEO Recommendations</h3>
                        <p className="mt-1 text-gray-600">
                          Based on the analysis of your website, here are personalized recommendations to improve your SEO.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* SEO Score Card */}
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-bold text-gray-800 flex items-center">
                        <svg className="h-5 w-5 mr-2 text-emerald-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                        </svg>
                        Overall SEO Score
                      </h4>
                      <div className="bg-emerald-100 text-emerald-800 text-lg font-bold px-4 py-1 rounded-full">
                        {Math.round(
                          (
                            // Content score (40%)
                            (Math.min(100, (getOverviewStats().avg_word_count / 800) * 100) * 0.4) +
                            // Keywords score (30%) 
                            (Math.min(100, (data.stats.common_keywords?.[0]?.relevance || 0.5) * 100) * 0.3) +
                            // Links score (30%)
                            (Math.min(100, (getOverviewStats().total_links / (getOverviewStats().total_pages * 10)) * 100) * 0.3)
                          )
                        )}%
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                          {
                            name: 'Content Quality',
                            score: Math.round(Math.min(100, (getOverviewStats().avg_word_count / 800) * 100)),
                            color: 'emerald',
                            icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                          },
                          {
                            name: 'Keyword Optimization',
                            score: Math.round(Math.min(100, (data.stats.common_keywords?.[0]?.relevance || 0.5) * 100)),
                            color: 'amber',
                            icon: 'M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z'
                          },
                          {
                            name: 'Link Structure',
                            score: Math.round(Math.min(100, (getOverviewStats().total_links / (getOverviewStats().total_pages * 10)) * 100)),
                            color: 'cyan',
                            icon: 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1'
                          }
                        ].map((metric, idx) => (
                          <div key={idx} className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
                            <div className="flex items-center mb-3">
                              <div className={`bg-${metric.color}-100 p-2 rounded-full mr-3`}>
                                <svg 
                                  xmlns="http://www.w3.org/2000/svg" 
                                  className={`h-5 w-5 text-${metric.color}-600`} 
                                  fill="none" 
                                  viewBox="0 0 24 24" 
                                  stroke="currentColor"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={metric.icon} />
                                </svg>
                              </div>
                              <h5 className="text-sm font-medium text-gray-700">{metric.name}</h5>
                            </div>
                            
                            <div className="flex items-center">
                              <div className="relative w-full mr-3">
                                <div className="h-2 bg-gray-200 rounded-full">
                                  <div 
                                    className={`h-2 rounded-full bg-${metric.color}-500`} 
                                    style={{ width: `${metric.score}%` }}
                                  ></div>
                                </div>
                              </div>
                              <span className={`text-${metric.color}-800 font-bold`}>{metric.score}%</span>
                            </div>
                            
                            <p className="text-xs text-gray-500 mt-2">
                              {metric.score < 40 ? 'Needs significant improvement' : 
                               metric.score < 70 ? 'Room for improvement' : 
                               'Good performance'}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                {/* General recommendations */}
                  <div className="p-6">
                    <h4 className="text-lg font-bold mb-4 text-gray-800 flex items-center">
                      <svg className="h-5 w-5 mr-2 text-indigo-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      General Recommendations
                    </h4>
                    
                    <div className="space-y-4">
                      {data.recommendations.general.map((rec, index) => (
                        <div 
                          key={index} 
                          className={`p-4 rounded-lg ${rec.type === 'warning' ? 'bg-amber-50 border-l-4 border-amber-500' : 
                            rec.type === 'success' ? 'bg-emerald-50 border-l-4 border-emerald-500' : 
                            'bg-indigo-50 border-l-4 border-indigo-500'
                          }`}
                        >
                          <div className="flex">
                            <div className="flex-shrink-0">
                              {rec.type === 'warning' ? (
                                <svg className="h-5 w-5 text-amber-600" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                              ) : rec.type === 'success' ? (
                                <svg className="h-5 w-5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                              ) : (
                                <svg className="h-5 w-5 text-indigo-600" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                              )}
                            </div>
                            <div className="ml-3">
                              <h5 className="text-sm font-semibold text-gray-800 mb-1">{rec.text}</h5>
                              <p className="text-sm text-gray-700">{rec.recommendation}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Content recommendations */}
                  {data.recommendations.content.length > 0 && (
                    <div className="p-6">
                      <h4 className="text-lg font-bold mb-4 text-gray-800 flex items-center">
                        <svg className="h-5 w-5 mr-2 text-cyan-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                        </svg>
                        Content Recommendations
                      </h4>
                      
                      <div className="space-y-4">
                        {data.recommendations.content.map((rec, index) => (
                          <div 
                            key={index} 
                            className={`p-4 rounded-lg ${
                              rec.type === 'warning' ? 'bg-amber-50 border-l-4 border-amber-500' : 
                              'bg-emerald-50 border-l-4 border-emerald-500'
                            }`}
                          >
                            <div className="flex">
                              <div className="flex-shrink-0">
                                {rec.type === 'warning' ? (
                                  <svg className="h-5 w-5 text-amber-600" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                  </svg>
                                ) : (
                                  <svg className="h-5 w-5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                  </svg>
                                )}
                              </div>
                              <div className="ml-3">
                                <h5 className="text-sm font-semibold text-gray-800 mb-1">{rec.text}</h5>
                                <p className="text-sm text-gray-700">{rec.recommendation}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Pages to improve */}
                  {data.recommendations.pages_to_improve.length > 0 && (
                    <div className="p-6">
                      <h4 className="text-lg font-bold mb-4 text-gray-800 flex items-center">
                        <svg className="h-5 w-5 mr-2 text-amber-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        Pages to Improve
                      </h4>
                      
                      <div className="space-y-6">
                        {data.recommendations.pages_to_improve.map((issue, index) => (
                          <div key={index} className="mb-4">
                            <div className="flex items-center">
                              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 text-amber-800 text-sm font-semibold mr-2">
                                {index + 1}
                              </span>
                              <h5 className="font-bold text-gray-800">{issue.description}</h5>
                            </div>
                            <div className="mt-3 bg-gray-50 rounded-lg p-4">
                              <ul className="divide-y divide-gray-200">
                                {issue.pages.map((page, pageIndex) => (
                                  <li key={pageIndex} className="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between">
                                    <div className="flex items-center mb-2 sm:mb-0">
                                      <svg className="h-4 w-4 text-amber-500 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                      </svg>
                                      <a 
                                        href={page.page_link} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="truncate text-indigo-600 hover:text-indigo-800 hover:underline font-medium"
                                      >
                                        {page.title || page.url}
                                      </a>
                                    </div>
                                    {page.word_count && 
                                      <div className="flex items-center">
                                        <svg className="h-4 w-4 text-gray-500 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                                        </svg>
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                          {page.word_count} words
                                        </span>
                                        {page.word_count < 300 && (
                                          <span className="ml-2 text-xs text-red-600 flex items-center">
                                            <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                            Thin content
                                          </span>
                                        )}
                                      </div>
                                    }
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Action Plan */}
                <div className="bg-white shadow-md rounded-xl overflow-hidden">
                  <div className="p-5 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
                    <h4 className="text-lg font-bold text-gray-800 flex items-center">
                      <svg className="h-5 w-5 mr-2 text-indigo-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"></path>
                        <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm9.707 5.707a1 1 0 00-1.414-1.414L9 12.586l-1.293-1.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                      </svg>
                      SEO Action Plan
                    </h4>
                    <p className="text-sm text-gray-600">Prioritized actions to improve your website&apos;s SEO</p>
                  </div>
                  
                  <div className="p-5">
                    <ol className="relative border-l border-gray-200 ml-3 space-y-6">
                      {[
                        {
                          title: "Improve Content Quality",
                          description: `${data.stats.pageMetrics?.filter(p => p.wordCount < 300).length || 0} page(s) have less than 300 words. Add more comprehensive content to these pages to increase their value to users and search engines.`,
                          priority: "High",
                          color: "red"
                        },
                        {
                          title: "Fix Heading Structure",
                          description: `${data.pages?.filter(p => p.h1_count !== 1).length || 0} page(s) have incorrect H1 heading usage. Ensure each page has exactly one H1 heading that accurately describes the page content.`,
                          priority: "Medium",
                          color: "amber"
                        },
                        {
                          title: "Enhance Internal Linking",
                          description: "Improve internal link structure by adding more contextual links between your pages to help both users and search engines navigate your content better.",
                          priority: "Medium",
                          color: "amber"
                        },
                        {
                          title: "Optimize Keyword Usage",
                          description: "Target the main keywords consistently across your content while maintaining a natural flow. Aim for a keyword density between 1-3% for optimal results.",
                          priority: "High",
                          color: "red"
                        },
                        {
                          title: "Add More Visual Content",
                          description: `Average of ${getOverviewStats().avg_image_count.toFixed(1)} images per page is ${getOverviewStats().avg_image_count < 2 ? 'low' : 'adequate'}. Add more relevant images, infographics, and visual elements to enhance user engagement.`,
                          priority: getOverviewStats().avg_image_count < 2 ? "Medium" : "Low",
                          color: getOverviewStats().avg_image_count < 2 ? "amber" : "green"
                        }
                      ].map((action, idx) => (
                        <li key={idx} className="ml-6">
                          <span 
                            className={`absolute flex items-center justify-center w-8 h-8 rounded-full -left-4 bg-${action.color}-100 ring-4 ring-white`}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className={`w-4 h-4 text-${action.color}-500`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.933 12.8a1 1 0 000-1.6L6.6 7.2A1 1 0 005 8v8a1 1 0 001.6.8l5.333-4z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.933 12.8a1 1 0 000-1.6l-5.333-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.333-4z" />
                            </svg>
                          </span>
                          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                            <div className="flex justify-between items-center mb-1">
                              <h3 className="text-lg font-semibold text-gray-800">{action.title}</h3>
                              <span 
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  action.priority === "High" ? "bg-red-100 text-red-800" : 
                                  action.priority === "Medium" ? "bg-amber-100 text-amber-800" : 
                                  "bg-green-100 text-green-800"
                                }`}
                              >
                                {action.priority} Priority
                              </span>
                            </div>
                            <p className="text-sm text-gray-600">{action.description}</p>
                          </div>
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              </div>
            )}
            
            {/* Sitemap tab */}
            {activeTab === 'sitemap' && (
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium mb-4 text-gray-800 flex items-center">
                  <svg className="h-5 w-5 mr-2 text-blue-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                  Sitemap URLs
                </h3>
                {data.sitemap_urls && data.sitemap_urls.length > 0 ? (
                  <div>
                    <p className="mb-4 text-gray-700">
                      This website has {data.sitemap_urls.length} URLs in its sitemap. Click on any URL to analyze it.
                    </p>
                    <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                      <ul className="divide-y divide-gray-200">
                        {data.sitemap_urls.map((url, index) => (
                          <li key={index} className="py-3 hover:bg-gray-100 transition-colors">
                            <div className="flex items-center justify-between">
                              <span className="text-gray-800 truncate max-w-lg font-medium">{url}</span>
                              <div className="flex space-x-2">
                                <a
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm flex items-center"
                                >
                                  <svg className="h-3.5 w-3.5 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z"></path>
                                    <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z"></path>
                                  </svg>
                                  Visit
                                </a>
                                <button
                                  onClick={() => analyzeSitemapUrl(url)}
                                  className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm flex items-center"
                                >
                                  <svg className="h-3.5 w-3.5 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M9 9a2 2 0 114 0 2 2 0 01-4 0z"></path>
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a4 4 0 00-3.446 6.032l-2.261 2.26a1 1 0 101.414 1.415l2.261-2.261A4 4 0 1011 5z" clipRule="evenodd"></path>
                                  </svg>
                                  Analyze
                                </button>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-md">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path>
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-amber-800">No Sitemap Found</h3>
                        <div className="mt-2 text-sm text-amber-700">
                          <p>
                            No sitemap was found for this website. A sitemap helps search engines discover and crawl your pages efficiently, which is important for SEO.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
      
      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                <span className="text-xl font-bold text-gray-800">SEO Analyzer</span>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                A simple SEO analysis tool.
              </p>
            </div>
            
            <div className="flex space-x-6">
              <div>
                <h3 className="text-sm font-medium text-gray-700">Key Features</h3>
                <ul className="mt-2 space-y-1">
                  <li className="text-xs text-gray-500">Content Analysis</li>
                  <li className="text-xs text-gray-500">Keyword Optimization</li>
                  <li className="text-xs text-gray-500">Link Structure Analysis</li>
                  <li className="text-xs text-gray-500">SEO Recommendations</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="mt-8 border-t border-gray-200 pt-4">
            <p className="text-xs text-gray-500 text-center">
              &copy; {new Date().getFullYear()} SEO Analyzer by Kleris Delilaj. All rights reserved. 
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
