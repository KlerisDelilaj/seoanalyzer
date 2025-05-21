"use client";
import { useState } from 'react';
import { analyzeSite, analyzeSpecificUrl } from '../api';
import { 
  BarChart, Bar, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area, LineChart, Line, RadarChart, PolarGrid, 
  PolarAngleAxis, PolarRadiusAxis, Radar, RadialBarChart, RadialBar, Scatter
} from 'recharts';

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

interface NumericStats {
  word_count?: { mean: number };
  image_count?: { mean: number };
  internal_links?: { sum: number };
  external_links?: { sum: number };
}

interface KeywordData {
  name: string;
  value: number;
  relevance?: number;
  page_count?: number;
  is_phrase?: boolean;
}

interface KeywordPhrase {
  phrase: string;
  count: number;
  relevance: number;
  words: number;
}

interface SingleKeyword {
  keyword: string;
  count: number;
  relevance: number;
}

interface PageKeywords {
  url: string;
  title: string;
  page_link: string;
  single_keywords: SingleKeyword[];
  phrases: {
    phrase: string;
    count: number;
    relevance: number;
  }[];
}

interface Stats {
  numeric: NumericStats;
  pageMetrics?: PageMetric[];
  linkDistribution?: LinkDistribution[];
  common_keywords?: KeywordData[];
  common_phrases?: KeywordData[];
  keywords_by_page?: PageKeywords[];
  top_link_pages?: LinkPage[];
}

interface LinkDistribution {
  name: string;
  value: number;
}

interface LinkPage {
  page_link: string;
  title?: string;
  url?: string;
  internal_links: number;
  external_links: number;
  total_links: number;
}

interface PageMetric {
  url: string;
  wordCount: number;
  imageCount: number;
  internalLinks: number;
  externalLinks: number;
  keywordDensity: number;
  mainKeyword: string;
  mainPhrase: string;
  pageLink: string;
}

interface PageData {
  page_link: string;
  title?: string;
  url?: string;
  word_count: number;
  h1_count: number;
  image_count: number;
  main_keyword?: string;
  main_keyword_phrase?: string;
  keyword_density?: number;
  keyword_relevance?: number;
  keywords?: [string, number, number][]; 
  keyword_phrases?: KeywordPhrase[];
  structured_content?: {
    headings?: Heading[];
    sections?: Section[];
  };
  raw_html?: string;
}

interface Heading {
  level: number;
  text: string;
  html?: string;
}

interface SectionContent {
  type: string;
  text: string;
  html?: string;
}

interface Section {
  heading?: Heading;
  content: SectionContent[];
}

interface Recommendation {
  type: 'warning' | 'success' | 'info';
  text: string;
  recommendation: string;
}

interface PageToImprove {
  description: string;
  pages: {
    page_link: string;
    title?: string;
    url?: string;
    word_count?: number;
  }[];
}

interface SiteData {
  analyzed_url?: string;
  page_count?: number;
  stats: Stats;
  pages?: PageData[];
  sitemap_urls?: string[];
  recommendations: {
    general: Recommendation[];
    content: Recommendation[];
    pages_to_improve: PageToImprove[];
  };
}

// Custom tooltip component for better styling
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 border border-gray-200 shadow-lg rounded-md">
        <p className="font-medium text-gray-900">{label}</p>
        {payload.map((entry: any, index: number) => (
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
const CustomLegend = (props: any) => {
  const { payload } = props;
  
  return (
    <ul className="flex flex-wrap justify-center gap-4 mt-2">
      {payload.map((entry: any, index: number) => (
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

export default function Home() {
  const [url, setUrl] = useState('');
  const [maxPages] = useState(20);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState<SiteData | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedPage, setSelectedPage] = useState<PageData | null>(null);
  const [showPageContent, setShowPageContent] = useState(false);
  const [viewContentType, setViewContentType] = useState<'structured' | 'raw'>('structured');
  
  const startAnalysis = async () => {
    if (!url) return;
    
    setError('');
    setIsAnalyzing(true);
    
    try {
      const result = await analyzeSite(url, maxPages, true);
      setData(result);
    } catch (err: unknown) {
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
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || 'An error occurred analyzing the URL');
      } else {
        setError('An error occurred analyzing the URL');
      }
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  const getOverviewStats = () => {
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

  const renderStructuredContent = (page: PageData) => {
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

  const renderRawHtml = (page: PageData) => {
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

          {/* Dashboard content with improved design */}
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
                
                {/* Charts with improved design */}
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
                            data={data.stats.pageMetrics?.slice(0, 5).map(page => ({
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
                  
                  {/* Link Distribution with improved design */}
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
                    </div>
                  </div>
                </div>
                
                {/* Keywords Area Chart - New enhanced visualization */}
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
                          data={data.stats.common_keywords?.slice(0, 7).map((k, i) => ({
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
                
                {/* Performance Radar Chart - New visualization */}
                <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all">
                  <div className="p-5 border-b border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                      <svg className="h-5 w-5 mr-2 text-emerald-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                      </svg>
                      SEO Performance Radar
                    </h3>
                    <p className="text-sm text-gray-500">Overall SEO performance metrics</p>
                  </div>
                  <div className="p-5">
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart 
                          cx="50%" 
                          cy="50%" 
                          outerRadius="80%" 
                          data={[
                            {
                              subject: 'Content',
                              score: Math.min(100, (getOverviewStats().avg_word_count / 500) * 100), // normalize to 0-100
                              fullMark: 100
                            },
                            {
                              subject: 'Images',
                              score: Math.min(100, (getOverviewStats().avg_image_count / 5) * 100),
                              fullMark: 100
                            },
                            {
                              subject: 'Links',
                              score: Math.min(100, (getOverviewStats().total_links / (getOverviewStats().total_pages * 10)) * 100),
                              fullMark: 100
                            },
                            {
                              subject: 'Keywords',
                              score: data.stats.common_keywords && data.stats.common_keywords.length > 0 ? 
                                Math.min(100, (data.stats.common_keywords[0].relevance || 0.5) * 100) : 50,
                              fullMark: 100
                            },
                            {
                              subject: 'Pages',
                              score: Math.min(100, (getOverviewStats().total_pages / 20) * 100),
                              fullMark: 100
                            }
                          ]}
                        >
                          <PolarGrid stroke="#e5e7eb" />
                          <PolarAngleAxis dataKey="subject" tick={{ fill: '#6b7280' }} />
                          <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#6b7280' }} />
                          <Radar 
                            name="SEO Score" 
                            dataKey="score" 
                            stroke={CHART_COLORS.primary[0]} 
                            fill={CHART_COLORS.primary[0]} 
                            fillOpacity={0.6} 
                          />
                          <Tooltip content={<CustomTooltip />} />
                          <Legend content={<CustomLegend />} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Content tab with improved design */}
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
                          Detailed metrics for each page's content, including word count, headings, and images.
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
                
                {/* Content Quality Score */}
                <div className="bg-white shadow-md rounded-xl overflow-hidden">
                  <div className="p-5 border-b border-gray-200">
                    <h4 className="text-lg font-semibold text-gray-800 flex items-center">
                      <svg className="h-5 w-5 mr-2 text-indigo-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"></path>
                      </svg>
                      Content Quality Score
                    </h4>
                    <p className="text-sm text-gray-500">Assessment of content quality based on metrics like word count, heading structure, and image usage</p>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <RadialBarChart 
                            cx="50%" 
                            cy="50%" 
                            innerRadius="20%" 
                            outerRadius="80%" 
                            barSize={10} 
                            data={[
                              {
                                name: 'Word Count Score',
                                value: Math.min(100, (getOverviewStats().avg_word_count / 800) * 100),
                                fill: CHART_COLORS.primary[1]
                              },
                              {
                                name: 'Headings Score',
                                value: Math.min(100, ((data.pages?.reduce((sum, page) => sum + page.h1_count, 0) || 0) / (data.pages?.length || 1)) * 100),
                                fill: CHART_COLORS.secondary[1]
                              },
                              {
                                name: 'Image Score',
                                value: Math.min(100, (getOverviewStats().avg_image_count / 4) * 100),
                                fill: CHART_COLORS.accent[1]
                              },
                              {
                                name: 'Overall Score',
                                value: Math.min(100, 
                                  ((getOverviewStats().avg_word_count / 800) * 40) + 
                                  (((data.pages?.reduce((sum, page) => sum + page.h1_count, 0) || 0) / (data.pages?.length || 1)) * 30) + 
                                  ((getOverviewStats().avg_image_count / 4) * 30)
                                ),
                                fill: CHART_COLORS.success[1]
                              }
                            ]}
                          >
                            <PolarAngleAxis
                              type="number"
                              domain={[0, 100]}
                              angleAxisId={0}
                              tick={false}
                            />
                            <CircularGrid />
                            <RadialBar
                              background
                              dataKey="value"
                              angleAxisId={0}
                              label={{ position: 'insideStart', fill: '#fff', fontSize: 12 }}
                            />
                            <Legend 
                              content={<CustomLegend />}
                              iconSize={10}
                              layout="vertical"
                              verticalAlign="middle"
                              wrapperStyle={{ top: 0, right: 0, transform: 'translate(0, 0)' }}
                            />
                            <Tooltip content={<CustomTooltip />} />
                          </RadialBarChart>
                        </ResponsiveContainer>
                      </div>
                      
                      <div className="space-y-6">
                        <div>
                          <h5 className="text-sm font-medium text-gray-500 mb-1">Word Count Score</h5>
                          <div className="flex items-center">
                            <div className="flex-1 bg-gray-200 rounded-full h-2.5 mr-2">
                              <div 
                                className="h-2.5 rounded-full bg-indigo-500" 
                                style={{ width: `${Math.min(100, (getOverviewStats().avg_word_count / 800) * 100)}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium text-gray-700">
                              {Math.round(Math.min(100, (getOverviewStats().avg_word_count / 800) * 100))}%
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {getOverviewStats().avg_word_count < 300 
                              ? 'Content is too thin. Consider adding more detailed information.' 
                              : getOverviewStats().avg_word_count < 600
                                ? 'Content length is acceptable but could be improved.'
                                : 'Good content length with sufficient detail.'}
                          </p>
                        </div>
                        
                        <div>
                          <h5 className="text-sm font-medium text-gray-500 mb-1">Headings Structure</h5>
                          <div className="flex items-center">
                            <div className="flex-1 bg-gray-200 rounded-full h-2.5 mr-2">
                              <div 
                                className="h-2.5 rounded-full bg-cyan-500" 
                                style={{ width: `${Math.min(100, ((data.pages?.reduce((sum, page) => sum + page.h1_count, 0) || 0) / (data.pages?.length || 1)) * 100)}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium text-gray-700">
                              {Math.round(Math.min(100, ((data.pages?.reduce((sum, page) => sum + page.h1_count, 0) || 0) / (data.pages?.length || 1)) * 100))}%
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {
                              (data.pages?.filter(p => p.h1_count === 0).length || 0) > 0
                                ? `Warning: ${data.pages?.filter(p => p.h1_count === 0).length} pages are missing H1 headings.`
                                : (data.pages?.filter(p => p.h1_count > 1).length || 0) > 0
                                  ? `Warning: ${data.pages?.filter(p => p.h1_count > 1).length} pages have multiple H1 headings.`
                                  : 'Good heading structure across pages.'
                            }
                          </p>
                        </div>
                        
                        <div>
                          <h5 className="text-sm font-medium text-gray-500 mb-1">Image Usage</h5>
                          <div className="flex items-center">
                            <div className="flex-1 bg-gray-200 rounded-full h-2.5 mr-2">
                              <div 
                                className="h-2.5 rounded-full bg-amber-500" 
                                style={{ width: `${Math.min(100, (getOverviewStats().avg_image_count / 4) * 100)}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium text-gray-700">
                              {Math.round(Math.min(100, (getOverviewStats().avg_image_count / 4) * 100))}%
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {getOverviewStats().avg_image_count < 1 
                              ? 'Content lacks visual elements. Consider adding relevant images.' 
                              : getOverviewStats().avg_image_count < 3
                                ? 'Some visual elements present, but could use more.'
                                : 'Good use of images throughout the content.'}
                          </p>
                        </div>
                        
                        <div>
                          <h5 className="text-sm font-medium text-gray-500 mb-1">Overall Content Quality</h5>
                          <div className="flex items-center">
                            <div className="flex-1 bg-gray-200 rounded-full h-2.5 mr-2">
                              <div 
                                className={`h-2.5 rounded-full ${
                                  Math.min(100, 
                                    ((getOverviewStats().avg_word_count / 800) * 40) + 
                                    (((data.pages?.reduce((sum, page) => sum + page.h1_count, 0) || 0) / (data.pages?.length || 1)) * 30) + 
                                    ((getOverviewStats().avg_image_count / 4) * 30)
                                  ) < 50 
                                    ? 'bg-red-500' 
                                    : Math.min(100, 
                                        ((getOverviewStats().avg_word_count / 800) * 40) + 
                                        (((data.pages?.reduce((sum, page) => sum + page.h1_count, 0) || 0) / (data.pages?.length || 1)) * 30) + 
                                        ((getOverviewStats().avg_image_count / 4) * 30)
                                      ) < 70 
                                      ? 'bg-amber-500' 
                                      : 'bg-emerald-500'
                                }`} 
                                style={{ width: `${Math.min(100, 
                                  ((getOverviewStats().avg_word_count / 800) * 40) + 
                                  (((data.pages?.reduce((sum, page) => sum + page.h1_count, 0) || 0) / (data.pages?.length || 1)) * 30) + 
                                  ((getOverviewStats().avg_image_count / 4) * 30)
                                )}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium text-gray-700">
                              {Math.round(Math.min(100, 
                                ((getOverviewStats().avg_word_count / 800) * 40) + 
                                (((data.pages?.reduce((sum, page) => sum + page.h1_count, 0) || 0) / (data.pages?.length || 1)) * 30) + 
                                ((getOverviewStats().avg_image_count / 4) * 30)
                              ))}%
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {Math.min(100, 
                              ((getOverviewStats().avg_word_count / 800) * 40) + 
                              (((data.pages?.reduce((sum, page) => sum + page.h1_count, 0) || 0) / (data.pages?.length || 1)) * 30) + 
                              ((getOverviewStats().avg_image_count / 4) * 30)
                            ) < 50 
                              ? 'Content needs significant improvement. Focus on all aspects of content quality.' 
                              : Math.min(100, 
                                  ((getOverviewStats().avg_word_count / 800) * 40) + 
                                  (((data.pages?.reduce((sum, page) => sum + page.h1_count, 0) || 0) / (data.pages?.length || 1)) * 30) + 
                                  ((getOverviewStats().avg_image_count / 4) * 30)
                                ) < 70 
                                ? 'Content quality is moderate. Some areas need improvement.'
                                : 'Good overall content quality. Continue refining for even better results.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Links tab with improved design */}
            {activeTab === 'links' && (
              <div className="space-y-6">
                <div className="bg-white shadow-md rounded-xl overflow-hidden">
                  <div className="p-6 bg-gradient-to-r from-cyan-50 to-blue-50">
                    <div className="flex items-center">
                      <div className="bg-gradient-to-r from-cyan-500 to-blue-500 p-3 rounded-lg mr-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-800">Link Analysis</h3>
                        <p className="mt-1 text-gray-600">
                          Analysis of internal and external links across your website.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
                    {/* Internal vs External Links Pie Chart */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                      <h4 className="text-lg font-medium mb-4 text-gray-800 flex items-center">
                        <svg className="h-5 w-5 mr-2 text-cyan-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                          <path fillRule="evenodd" d="M5 3a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2H5zm9 4a1 1 0 10-2 0v6a1 1 0 102 0V7zm-3 2a1 1 0 10-2 0v4a1 1 0 102 0V9zm-3 3a1 1 0 10-2 0v1a1 1 0 102 0v-1z" clipRule="evenodd"></path>
                        </svg>
                        Internal vs External Links
                      </h4>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={data.stats.linkDistribution || []}
                              cx="50%"
                              cy="50%"
                              innerRadius={80}
                              outerRadius={110}
                              paddingAngle={2}
                              dataKey="value"
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
                            <Legend 
                              content={<CustomLegend />}
                              iconType="circle"
                            />
                            <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="text-2xl font-bold">
                              <tspan 
                                x="50%" 
                                dy="-10" 
                                fontSize="20" 
                                fill="#4f46e5"
                              >
                                {(data.stats.linkDistribution || []).reduce((sum, item) => sum + item.value, 0)}
                              </tspan>
                              <tspan 
                                x="50%" 
                                dy="20" 
                                fontSize="14" 
                                fill="#6b7280"
                              >
                                Total Links
                              </tspan>
                            </text>
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-4">
                        {(data.stats.linkDistribution || []).map((item, index) => (
                          <div key={index} className={`p-3 rounded-lg ${
                            index === 0 ? 'bg-indigo-50 text-indigo-800' : 
                            index === 1 ? 'bg-cyan-50 text-cyan-800' : 
                            'bg-amber-50 text-amber-800'
                          }`}>
                            <div className="text-sm font-medium">{item.name}</div>
                            <div className="text-xl font-bold">{item.value}</div>
                            <div className="text-xs mt-1">
                              {index === 0 ? 
                                'Links to other pages on your site' : 
                                'Links to external websites'}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Link Distribution by Page */}
                    <div className="space-y-4">
                      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                        <h4 className="text-lg font-medium mb-4 text-gray-800 flex items-center">
                          <svg className="h-5 w-5 mr-2 text-cyan-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z"></path>
                          </svg>
                          Links Distribution by Page
                        </h4>
                        <div className="h-60">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              layout="vertical"
                              data={(data.stats.top_link_pages || []).slice(0, 5).map(page => ({
                                name: page.title || page.url?.split('/').pop() || 'Page',
                                internal: page.internal_links,
                                external: page.external_links
                              }))}
                              margin={{ top: 5, right: 30, left: 70, bottom: 5 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                              <XAxis type="number" stroke="#6b7280" />
                              <YAxis 
                                dataKey="name" 
                                type="category" 
                                width={120} 
                                stroke="#6b7280"
                                tick={{ fontSize: 12 }}
                              />
                              <Tooltip content={<CustomTooltip />} />
                              <Legend content={<CustomLegend />} />
                              <Bar 
                                dataKey="internal" 
                                name="Internal Links" 
                                stackId="a" 
                                fill={CHART_COLORS.primary[0]}
                              />
                              <Bar 
                                dataKey="external" 
                                name="External Links" 
                                stackId="a" 
                                fill={CHART_COLORS.secondary[0]}
                              />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                      
                      {/* Link Quality Score */}
                      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                        <h4 className="text-lg font-medium mb-2 text-gray-800 flex items-center">
                          <svg className="h-5 w-5 mr-2 text-cyan-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                          </svg>
                          Link Quality Score
                        </h4>
                        
                        <div>
                          <div className="mb-3">
                            <div className="flex justify-between mb-1">
                              <span className="text-sm font-medium text-gray-700">Internal Link Structure</span>
                              <span className="text-sm font-medium text-gray-700">
                                {Math.round(Math.min(100, 
                                  ((data.stats.numeric.internal_links?.sum || 0) / ((data.pages?.length || 1) * 5)) * 100
                                ))}%
                              </span>
                            </div>
                            <div className="h-2 bg-gray-200 rounded-full">
                              <div 
                                className="h-2 rounded-full bg-indigo-500" 
                                style={{ width: `${Math.min(100, ((data.stats.numeric.internal_links?.sum || 0) / ((data.pages?.length || 1) * 5)) * 100)}%` }}
                              ></div>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              {Math.min(100, ((data.stats.numeric.internal_links?.sum || 0) / ((data.pages?.length || 1) * 5)) * 100) < 30 
                                ? 'Poor internal linking. Add more links between your pages.' 
                                : Math.min(100, ((data.stats.numeric.internal_links?.sum || 0) / ((data.pages?.length || 1) * 5)) * 100) < 60
                                  ? 'Moderate internal linking structure.'
                                  : 'Good internal linking between pages.'}
                            </p>
                          </div>
                          
                          <div className="mb-3">
                            <div className="flex justify-between mb-1">
                              <span className="text-sm font-medium text-gray-700">External Link Quality</span>
                              <span className="text-sm font-medium text-gray-700">
                                {Math.round(Math.min(100, 
                                  ((data.stats.numeric.external_links?.sum || 0) / ((data.pages?.length || 1) * 3)) * 100
                                ))}%
                              </span>
                            </div>
                            <div className="h-2 bg-gray-200 rounded-full">
                              <div 
                                className="h-2 rounded-full bg-cyan-500" 
                                style={{ width: `${Math.min(100, ((data.stats.numeric.external_links?.sum || 0) / ((data.pages?.length || 1) * 3)) * 100)}%` }}
                              ></div>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              {Math.min(100, ((data.stats.numeric.external_links?.sum || 0) / ((data.pages?.length || 1) * 3)) * 100) < 30 
                                ? 'Few external links. Consider linking to authority sites.' 
                                : Math.min(100, ((data.stats.numeric.external_links?.sum || 0) / ((data.pages?.length || 1) * 3)) * 100) < 60
                                  ? 'Moderate use of external links.'
                                  : 'Good balance of external links.'}
                            </p>
                          </div>
                          
                          <div className="mb-3">
                            <div className="flex justify-between mb-1">
                              <span className="text-sm font-medium text-gray-700">Link Distribution</span>
                              <span className="text-sm font-medium text-gray-700">
                                {data.stats.linkDistribution && data.stats.linkDistribution.length > 0 
                                  ? Math.round(
                                      Math.min(100, 
                                        (data.stats.linkDistribution[0].value / 
                                        (data.stats.linkDistribution.reduce((sum, item) => sum + item.value, 0) || 1)) * 100
                                      )
                                    )
                                  : 0}%
                              </span>
                            </div>
                            <div className="h-2 bg-gray-200 rounded-full">
                              <div 
                                className={`h-2 rounded-full ${
                                  (data.stats.linkDistribution && data.stats.linkDistribution.length > 0 
                                    ? Math.min(100, (data.stats.linkDistribution[0].value / (data.stats.linkDistribution.reduce((sum, item) => sum + item.value, 0) || 1)) * 100) 
                                    : 0) < 40 
                                    ? 'bg-yellow-500' 
                                    : (data.stats.linkDistribution && data.stats.linkDistribution.length > 0 
                                        ? Math.min(100, (data.stats.linkDistribution[0].value / (data.stats.linkDistribution.reduce((sum, item) => sum + item.value, 0) || 1)) * 100) 
                                        : 0) > 80 
                                      ? 'bg-yellow-500' 
                                      : 'bg-emerald-500'
                                }`} 
                                style={{ width: `${
                                  data.stats.linkDistribution && data.stats.linkDistribution.length > 0 
                                    ? Math.min(100, (data.stats.linkDistribution[0].value / (data.stats.linkDistribution.reduce((sum, item) => sum + item.value, 0) || 1)) * 100) 
                                    : 0}%` }}
                              ></div>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              {(data.stats.linkDistribution && data.stats.linkDistribution.length > 0 
                                ? Math.min(100, (data.stats.linkDistribution[0].value / (data.stats.linkDistribution.reduce((sum, item) => sum + item.value, 0) || 1)) * 100) 
                                : 0) < 40 
                                ? 'Too few internal links compared to external links.' 
                                : (data.stats.linkDistribution && data.stats.linkDistribution.length > 0 
                                    ? Math.min(100, (data.stats.linkDistribution[0].value / (data.stats.linkDistribution.reduce((sum, item) => sum + item.value, 0) || 1)) * 100) 
                                    : 0) > 80 
                                  ? 'Too many internal links compared to external links.'
                                  : 'Good balance between internal and external links.'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Top Pages by Links Table */}
                <div className="bg-white shadow-md rounded-xl overflow-hidden">
                  <div className="p-5 border-b border-gray-200">
                    <h4 className="text-lg font-medium text-gray-800 flex items-center">
                      <svg className="h-5 w-5 mr-2 text-cyan-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd"></path>
                      </svg>
                      Top Pages by Links
                    </h4>
                    <p className="text-sm text-gray-500">Pages that have the most internal and external links</p>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Page</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Internal Links</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">External Links</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Links</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Link Balance</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {(data.stats.top_link_pages || []).map((page, index) => (
                          <tr key={index} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 text-sm">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-8 w-8 bg-cyan-100 rounded-full flex items-center justify-center">
                                  <svg className="h-4 w-4 text-cyan-600" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                    <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd"></path>
                                  </svg>
                                </div>
                                <div className="ml-3">
                                  <a 
                                    href={page.page_link} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-indigo-600 hover:text-indigo-900 hover:underline font-medium truncate max-w-xs block"
                                  >
                                    {page.title || page.url}
                                  </a>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                {page.internal_links}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-cyan-100 text-cyan-800">
                                {page.external_links}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 font-medium">{page.total_links}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <div className="flex items-center">
                                <div className="h-2 w-16 bg-gray-200 rounded-full mr-2">
                                  <div 
                                    className={`h-2 rounded-full ${
                                      page.internal_links / (page.total_links || 1) < 0.3 
                                        ? 'bg-red-500' 
                                        : page.internal_links / (page.total_links || 1) > 0.8 
                                          ? 'bg-yellow-500' 
                                          : 'bg-emerald-500'
                                    }`} 
                                    style={{ width: `${(page.internal_links / (page.total_links || 1)) * 100}%` }}
                                  ></div>
                                </div>
                                <span className="text-xs text-gray-500">
                                  {Math.round((page.internal_links / (page.total_links || 1)) * 100)}% internal
                                </span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                
                {/* Link Visualization */}
                <div className="bg-white shadow-md rounded-xl overflow-hidden">
                  <div className="p-5 border-b border-gray-200">
                    <h4 className="text-lg font-medium text-gray-800 flex items-center">
                      <svg className="h-5 w-5 mr-2 text-cyan-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z"></path>
                        <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z"></path>
                      </svg>
                      Link Relationships
                    </h4>
                    <p className="text-sm text-gray-500">Visual representation of link relationships between pages</p>
                  </div>
                  
                  <div className="p-5">
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <Scatter
                          data={data.stats.top_link_pages?.map((page, index) => ({
                            x: page.internal_links,
                            y: page.external_links,
                            z: page.total_links,
                            name: page.title || page.url?.split('/').pop() || 'Page'
                          })) || []}
                          margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis 
                            type="number" 
                            dataKey="x" 
                            name="Internal Links" 
                            stroke="#6b7280"
                            label={{
                              value: 'Internal Links',
                              position: 'insideBottom',
                              offset: -10
                            }} 
                          />
                          <YAxis 
                            type="number" 
                            dataKey="y" 
                            name="External Links" 
                            stroke="#6b7280"
                            label={{
                              value: 'External Links',
                              angle: -90,
                              position: 'insideLeft'
                            }} 
                          />
                          <Tooltip 
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                return (
                                  <div className="bg-white p-4 border border-gray-200 shadow-md rounded-md">
                                    <p className="text-sm font-medium text-gray-800">{payload[0].payload.name}</p>
                                    <p className="text-sm text-indigo-600">Internal Links: {payload[0].value}</p>
                                    <p className="text-sm text-cyan-600">External Links: {payload[1].value}</p>
                                    <p className="text-sm text-gray-600">Total Links: {payload[0].payload.z}</p>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Scatter 
                            name="Pages" 
                            data={data.stats.top_link_pages?.map((page, index) => ({
                              x: page.internal_links,
                              y: page.external_links,
                              z: page.total_links,
                              name: page.title || page.url?.split('/').pop() || 'Page'
                            })) || []} 
                            fill={CHART_COLORS.primary[0]}
                            shape={props => {
                              const { cx, cy, payload } = props;
                              const size = Math.max(8, Math.min(20, payload.z / 5));
                              
                              return (
                                <circle 
                                  cx={cx} 
                                  cy={cy} 
                                  r={size} 
                                  fill={CHART_COLORS.primary[0]}
                                  stroke={CHART_COLORS.primary[2]}
                                  strokeWidth={2}
                                  opacity={0.8}
                                />
                              );
                            }}
                          />
                        </Scatter>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-3 text-sm text-gray-500 text-center">
                      Each bubble represents a page. Size indicates total number of links. 
                      <br />
                      Position shows the ratio of internal to external links. Pages toward the bottom-right have a good balance.
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Keywords tab with improved design */}
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
                  
                  {/* Top Keywords Line Chart - Enhanced visualization */}
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
                
                {/* Keyword Density Grid */}
                <div className="bg-white shadow-md rounded-xl overflow-hidden">
                  <div className="p-5 border-b border-gray-200">
                    <h4 className="text-lg font-medium text-gray-800 flex items-center">
                      <svg className="h-5 w-5 mr-2 text-amber-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path>
                      </svg>
                      Keyword Density Grid
                    </h4>
                    <p className="text-sm text-gray-500">Visual representation of keyword density across pages</p>
                  </div>
                  
                  <div className="p-5">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {data.stats.keywords_by_page?.slice(0, 6).map((page, pageIndex) => (
                        <div key={pageIndex} className="bg-gradient-to-br from-white to-amber-50 rounded-lg p-4 border border-amber-100 shadow-sm">
                          <div className="flex items-center mb-3">
                            <div className="flex-shrink-0 h-8 w-8 bg-amber-100 rounded-full flex items-center justify-center">
                              <svg className="h-4 w-4 text-amber-600" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd"></path>
                              </svg>
                            </div>
                            <a 
                              href={page.page_link} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="ml-3 text-sm font-medium text-indigo-600 hover:underline truncate"
                            >
                              {page.title || page.url}
                            </a>
                          </div>
                          
                          <div className="mb-3">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs font-medium text-gray-500">Main Keyword</span>
                              <span className="text-xs font-medium text-gray-500">
                                {page.single_keywords && page.single_keywords.length > 0 ? page.single_keywords[0].count : 0} occurences
                              </span>
                            </div>
                            <div className="bg-white border border-amber-200 rounded-lg p-2 text-sm font-medium text-gray-800">
                              {page.single_keywords && page.single_keywords.length > 0 ? page.single_keywords[0].keyword : 'None detected'}
                            </div>
                          </div>
                          
                          <div className="mb-3">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs font-medium text-gray-500">Main Phrase</span>
                              <span className="text-xs font-medium text-gray-500">
                                {page.phrases && page.phrases.length > 0 ? page.phrases[0].count : 0} occurences
                              </span>
                            </div>
                            <div className="bg-white border border-amber-200 rounded-lg p-2 text-sm font-medium text-gray-800">
                              {page.phrases && page.phrases.length > 0 ? page.phrases[0].phrase : 'None detected'}
                            </div>
                          </div>
                          
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs font-medium text-gray-500">Keyword Density</span>
                              <span className="text-xs font-medium text-gray-500">
                                {data.stats.pageMetrics?.find(p => p.pageLink === page.page_link)?.keywordDensity.toFixed(2)}%
                              </span>
                            </div>
                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className={`h-2 ${
                                  (data.stats.pageMetrics?.find(p => p.pageLink === page.page_link)?.keywordDensity || 0) < 1 ? 'bg-red-500' : 
                                  (data.stats.pageMetrics?.find(p => p.pageLink === page.page_link)?.keywordDensity || 0) < 2 ? 'bg-yellow-500' : 
                                  (data.stats.pageMetrics?.find(p => p.pageLink === page.page_link)?.keywordDensity || 0) > 3.5 ? 'bg-yellow-500' : 'bg-emerald-500'
                                }`} 
                                style={{ width: `${Math.min(100, ((data.stats.pageMetrics?.find(p => p.pageLink === page.page_link)?.keywordDensity || 0) / 5) * 100)}%` }}
                              ></div>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              {(data.stats.pageMetrics?.find(p => p.pageLink === page.page_link)?.keywordDensity || 0) < 1 
                                ? 'Too low. Increase keyword usage.' 
                                : (data.stats.pageMetrics?.find(p => p.pageLink === page.page_link)?.keywordDensity || 0) < 2 
                                  ? 'Below optimal. Consider increasing slightly.' 
                                  : (data.stats.pageMetrics?.find(p => p.pageLink === page.page_link)?.keywordDensity || 0) > 3.5 
                                    ? 'Risk of keyword stuffing. Reduce usage.' 
                                    : 'Optimal keyword density.'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Keywords table with enhanced design */}
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
                
                {/* Top Keyword Phrases */}
                <div className="bg-white shadow-md rounded-xl overflow-hidden">
                  <div className="p-5 border-b border-gray-200">
                    <h4 className="text-lg font-medium text-gray-800 flex items-center">
                      <svg className="h-5 w-5 mr-2 text-amber-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path d="M7 9a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H9a2 2 0 01-2-2V9z"></path>
                        <path d="M5 3a2 2 0 00-2 2v6a2 2 0 002 2V5h8a2 2 0 00-2-2H5z"></path>
                      </svg>
                      Top Keyword Phrases
                    </h4>
                    <p className="text-sm text-gray-500">Most important multi-word phrases found across the site</p>
                  </div>
                  <div className="p-5">
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={data.stats.common_phrases?.slice(0, 8).map(phrase => ({
                            name: phrase.name,
                            count: phrase.value,
                            relevance: phrase.relevance ? Math.round(phrase.relevance * 10) / 10 : 0
                          })) || []}
                          margin={{ top: 20, right: 30, left: 30, bottom: 40 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis 
                            dataKey="name" 
                            angle={-45} 
                            textAnchor="end" 
                            height={80}
                            stroke="#6b7280"
                            tick={{ fontSize: 12 }}
                          />
                          <YAxis stroke="#6b7280" />
                          <Tooltip content={<CustomTooltip />} />
                          <Legend content={<CustomLegend />} />
                          <Bar 
                            dataKey="count" 
                            name="Occurrences" 
                            fill="url(#phraseGradient)" 
                            radius={[4, 4, 0, 0]} 
                            barSize={30}
                          />
                          <Bar 
                            dataKey="relevance" 
                            name="Relevance Score" 
                            fill="url(#phraseRelevanceGradient)" 
                            radius={[4, 4, 0, 0]} 
                            barSize={30}
                          />
                          <defs>
                            <linearGradient id="phraseGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={CHART_COLORS.accent[0]} stopOpacity={0.8}/>
                              <stop offset="95%" stopColor={CHART_COLORS.accent[0]} stopOpacity={0.4}/>
                            </linearGradient>
                            <linearGradient id="phraseRelevanceGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={CHART_COLORS.primary[0]} stopOpacity={0.8}/>
                              <stop offset="95%" stopColor={CHART_COLORS.primary[0]} stopOpacity={0.4}/>
                            </linearGradient>
                          </defs>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Recommendations tab with improved design */}
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
                          className={`p-4 rounded-lg ${
                            rec.type === 'warning' ? 'bg-amber-50 border-l-4 border-amber-500' : 
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
                    <p className="text-sm text-gray-600">Prioritized actions to improve your website's SEO</p>
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
            
            {/* Sitemap tab with improved design */}
            {activeTab === 'sitemap' && (
              <div className="space-y-6">
                <div className="bg-white shadow-md rounded-xl overflow-hidden">
                  <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50">
                    <div className="flex items-center">
                      <div className="bg-gradient-to-r from-blue-500 to-indigo-500 p-3 rounded-lg mr-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-800">Sitemap Analysis</h3>
                        <p className="mt-1 text-gray-600">
                          Overview of your website's sitemap structure and URLs.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {data.sitemap_urls && data.sitemap_urls.length > 0 ? (
                    <>
                      <div className="p-6 border-b border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-lg font-semibold text-gray-800 flex items-center">
                            <svg className="h-5 w-5 mr-2 text-blue-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                              <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z"></path>
                            </svg>
                            Sitemap Overview
                          </h4>
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                            {data.sitemap_urls.length} URLs found
                          </span>
                        </div>
                        
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                              <div className="flex items-center mb-3">
                                <div className="p-2 bg-blue-100 rounded-full mr-3">
                                  <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z"></path>
                                    <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z"></path>
                                  </svg>
                                </div>
                                <h5 className="text-sm font-medium text-gray-700">URL Distribution</h5>
                              </div>
                              <div className="text-2xl font-bold text-gray-800 mb-1">{data.sitemap_urls.length}</div>
                              <p className="text-xs text-gray-500">
                                Total URLs found in your sitemap
                              </p>
                            </div>
                            
                            <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                              <div className="flex items-center mb-3">
                                <div className="p-2 bg-green-100 rounded-full mr-3">
                                  <svg className="h-5 w-5 text-green-600" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                                  </svg>
                                </div>
                                <h5 className="text-sm font-medium text-gray-700">Coverage</h5>
                              </div>
                              <div className="text-2xl font-bold text-gray-800 mb-1">
                                {Math.round((data.pages?.length || 0) / (data.sitemap_urls.length || 1) * 100)}%
                              </div>
                              <p className="text-xs text-gray-500">
                                Percentage of analyzed pages in sitemap
                              </p>
                            </div>
                            
                            <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                              <div className="flex items-center mb-3">
                                <div className="p-2 bg-purple-100 rounded-full mr-3">
                                  <svg className="h-5 w-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"></path>
                                  </svg>
                                </div>
                                <h5 className="text-sm font-medium text-gray-700">Structure Quality</h5>
                              </div>
                              <div className="text-2xl font-bold text-gray-800 mb-1">
                                {data.sitemap_urls.length > 0 ? 'Good' : 'Missing'}
                              </div>
                              <p className="text-xs text-gray-500">
                                {data.sitemap_urls.length > 0 
                                  ? 'Sitemap is properly structured'
                                  : 'No sitemap detected'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-6">
                        <h4 className="text-lg font-semibold mb-4 text-gray-800 flex items-center">
                          <svg className="h-5 w-5 mr-2 text-blue-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd"></path>
                          </svg>
                          Sitemap URLs
                        </h4>
                        <p className="text-sm text-gray-500 mb-4">
                          Click on any URL to analyze it individually. The list shows all URLs found in your sitemap.
                        </p>
                        
                        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                          <div className="p-3 bg-gray-50 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                              <div className="text-sm font-medium text-gray-500">URL</div>
                              <div className="text-sm font-medium text-gray-500">Action</div>
                            </div>
                          </div>
                          <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                            {data.sitemap_urls.map((url: string, index: number) => (
                              <div key={index} className="p-3 hover:bg-gray-50 transition-colors">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                                  <div className="mb-2 sm:mb-0 flex-1">
                                    <div className="text-sm text-gray-800 truncate max-w-lg">{url}</div>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <a 
                                      href={url} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                    >
                                      <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z"></path>
                                        <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z"></path>
                                      </svg>
                                      Visit
                                    </a>
                                    <button 
                                      onClick={() => analyzeSitemapUrl(url)}
                                      className="inline-flex items-center px-2.5 py-1.5 border border-transparent shadow-sm text-xs font-medium rounded text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                    >
                                      <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                        <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"></path>
                                      </svg>
                                      Analyze
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="p-6">
                      <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-md">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path>
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
                      
                      <div className="mt-6">
                        <h4 className="text-lg font-semibold mb-3 text-gray-800">Recommendation</h4>
                        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                          <div className="flex items-start">
                            <div className="flex-shrink-0 pt-1">
                              <svg className="h-5 w-5 text-indigo-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                              </svg>
                            </div>
                            <div className="ml-3">
                              <h5 className="text-md font-semibold text-gray-800">Create a Sitemap</h5>
                              <p className="mt-1 text-sm text-gray-600">
                                Consider creating a sitemap.xml file for your website. This will help search engines index your content more effectively, potentially improving your search rankings.
                              </p>
                              
                              <div className="mt-3 space-y-2">
                                <div className="bg-gray-50 p-3 rounded-md">
                                  <h6 className="text-sm font-medium text-gray-700">How to create a sitemap:</h6>
                                  <ol className="ml-5 mt-1 text-sm text-gray-600 list-decimal">
                                    <li className="mt-1">Use a sitemap generator tool like XML-Sitemaps.com</li>
                                    <li className="mt-1">If using WordPress, install a sitemap plugin like Yoast SEO or Google XML Sitemaps</li>
                                    <li className="mt-1">For custom websites, manually create an XML file following the sitemap protocol</li>
                                    <li className="mt-1">Upload the sitemap to your website's root directory</li>
                                    <li className="mt-1">Submit your sitemap to search engines via their webmaster tools</li>
                                  </ol>
                                </div>
                                
                                <div className="bg-blue-50 p-3 rounded-md">
                                  <h6 className="text-sm font-medium text-blue-700">Benefits of having a sitemap:</h6>
                                  <ul className="ml-5 mt-1 text-sm text-blue-600 list-disc">
                                    <li className="mt-1">Improved crawling efficiency for search engines</li>
                                    <li className="mt-1">Better indexing of your content</li>
                                    <li className="mt-1">Faster discovery of new or updated content</li>
                                    <li className="mt-1">Can help with SEO by ensuring all important pages are found</li>
                                  </ul>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-6">
                        <h4 className="text-lg font-semibold mb-3 text-gray-800">Example Sitemap Structure</h4>
                        <div className="bg-gray-800 text-gray-100 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                          <pre>{`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://example.com/</loc>
    <lastmod>2025-05-01</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://example.com/about</loc>
    <lastmod>2025-04-15</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://example.com/products</loc>
    <lastmod>2025-05-10</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
</urlset>`}</pre>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* URL Structure Analysis - New Section */}
                {data.pages && data.pages.length > 0 && (
                  <div className="bg-white shadow-md rounded-xl overflow-hidden">
                    <div className="p-5 border-b border-gray-200">
                      <h4 className="text-lg font-medium text-gray-800 flex items-center">
                        <svg className="h-5 w-5 mr-2 text-blue-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                          <path fillRule="evenodd" d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm3.293 1.293a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L7.586 10 5.293 7.707a1 1 0 010-1.414zM11 12a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd"></path>
                        </svg>
                        URL Structure Analysis
                      </h4>
                      <p className="text-sm text-gray-500">Analysis of your website's URL structure and patterns</p>
                    </div>
                    
                    <div className="p-5">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                          <h5 className="text-md font-semibold text-gray-800 mb-3">URL Structure Health</h5>
                          
                          {/* URL Length Check */}
                          <div className="mb-4">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-sm text-gray-700">URL Length</span>
                              <span className="text-xs font-medium text-gray-500">
                                {Math.round(data.pages.reduce((sum, page) => sum + (page.url?.length || 0), 0) / data.pages.length)} characters avg.
                              </span>
                            </div>
                            <div className="h-2 bg-gray-200 rounded-full">
                              <div 
                                className={`h-2 rounded-full ${
                                  Math.round(data.pages.reduce((sum, page) => sum + (page.url?.length || 0), 0) / data.pages.length) > 100 
                                    ? 'bg-red-500' 
                                    : Math.round(data.pages.reduce((sum, page) => sum + (page.url?.length || 0), 0) / data.pages.length) > 70
                                      ? 'bg-amber-500'
                                      : 'bg-emerald-500'
                                }`} 
                                style={{ width: `${Math.min(100, (Math.round(data.pages.reduce((sum, page) => sum + (page.url?.length || 0), 0) / data.pages.length) / 120) * 100)}%` }}
                              ></div>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              {Math.round(data.pages.reduce((sum, page) => sum + (page.url?.length || 0), 0) / data.pages.length) > 100 
                                ? 'URLs are too long on average. Consider shortening them.' 
                                : Math.round(data.pages.reduce((sum, page) => sum + (page.url?.length || 0), 0) / data.pages.length) > 70
                                  ? 'URL length is acceptable, but could be improved.'
                                  : 'Good URL length.'}
                            </p>
                          </div>
                          
                          {/* URL Keywords Check */}
                          <div className="mb-4">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-sm text-gray-700">URL Keywords</span>
                              <span className="text-xs font-medium text-gray-500">
                                {Math.round(data.pages.filter(page => {
                                  const url = page.url || '';
                                  return data.stats.common_keywords?.some(kw => 
                                    url.toLowerCase().includes(kw.name.toLowerCase())
                                  );
                                }).length / data.pages.length * 100)}% contain keywords
                              </span>
                            </div>
                            <div className="h-2 bg-gray-200 rounded-full">
                              <div 
                                className={`h-2 rounded-full ${
                                  Math.round(data.pages.filter(page => {
                                    const url = page.url || '';
                                    return data.stats.common_keywords?.some(kw => 
                                      url.toLowerCase().includes(kw.name.toLowerCase())
                                    );
                                  }).length / data.pages.length * 100) < 30
                                    ? 'bg-red-500' 
                                    : Math.round(data.pages.filter(page => {
                                        const url = page.url || '';
                                        return data.stats.common_keywords?.some(kw => 
                                          url.toLowerCase().includes(kw.name.toLowerCase())
                                        );
                                      }).length / data.pages.length * 100) < 60
                                      ? 'bg-amber-500'
                                      : 'bg-emerald-500'
                                }`} 
                                style={{ width: `${Math.round(data.pages.filter(page => {
                                  const url = page.url || '';
                                  return data.stats.common_keywords?.some(kw => 
                                    url.toLowerCase().includes(kw.name.toLowerCase())
                                  );
                                }).length / data.pages.length * 100)}%` }}
                              ></div>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              {Math.round(data.pages.filter(page => {
                                const url = page.url || '';
                                return data.stats.common_keywords?.some(kw => 
                                  url.toLowerCase().includes(kw.name.toLowerCase())
                                );
                              }).length / data.pages.length * 100) < 30
                                ? 'Few URLs contain relevant keywords. Consider optimizing URL structure.' 
                                : Math.round(data.pages.filter(page => {
                                    const url = page.url || '';
                                    return data.stats.common_keywords?.some(kw => 
                                      url.toLowerCase().includes(kw.name.toLowerCase())
                                    );
                                  }).length / data.pages.length * 100) < 60
                                  ? 'Some URLs contain keywords, but there is room for improvement.'
                                  : 'Good keyword usage in URLs.'}
                            </p>
                          </div>
                          
                          {/* Special Character Check */}
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-sm text-gray-700">URL Special Characters</span>
                              <span className="text-xs font-medium text-gray-500">
                                {data.pages.filter(page => 
                                  (page.url || '').match(/[^a-zA-Z0-9\-_\/\.]/)
                                ).length} issues found
                              </span>
                            </div>
                            <div className="h-2 bg-gray-200 rounded-full">
                              <div 
                                className={`h-2 rounded-full ${
                                  data.pages.filter(page => 
                                    (page.url || '').match(/[^a-zA-Z0-9\-_\/\.]/)
                                  ).length > 0
                                    ? 'bg-amber-500' 
                                    : 'bg-emerald-500'
                                }`} 
                                style={{ width: `${Math.max(0, 100 - (data.pages.filter(page => 
                                  (page.url || '').match(/[^a-zA-Z0-9\-_\/\.]/)
                                ).length / data.pages.length * 100))}%` }}
                              ></div>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              {data.pages.filter(page => 
                                (page.url || '').match(/[^a-zA-Z0-9\-_\/\.]/)
                              ).length > 0
                                ? `Found ${data.pages.filter(page => 
                                    (page.url || '').match(/[^a-zA-Z0-9\-_\/\.]/)
                                  ).length} URLs with special characters. Replace with hyphens.` 
                                : 'No special characters found in URLs. Good practice!'}
                            </p>
                          </div>
                        </div>
                        
                        {/* URL Pattern Analysis */}
                        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                          <h5 className="text-md font-semibold text-gray-800 mb-3">URL Pattern Analysis</h5>
                          
                          <div className="space-y-3">
                            {/* Directory Structure */}
                            <div className="p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center">
                                <svg className="h-5 w-5 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"></path>
                                </svg>
                                <h6 className="text-sm font-medium text-gray-700">Directory Structure</h6>
                              </div>
                              <div className="mt-2 text-xs text-gray-600">
                                <p>
                                  {(() => {
                                    const avgDepth = data.pages.reduce((sum, page) => {
                                      const url = page.url || '';
                                      const path = url.split('//')[1]?.split('/') || [];
                                      return sum + (path.length - 1);
                                    }, 0) / data.pages.length;
                                    
                                    return avgDepth < 2
                                      ? 'Your site has a flat URL structure with few subdirectories. This is generally good for SEO.'
                                      : avgDepth < 4
                                        ? 'Your site has a moderate directory depth, which is good for organization and SEO.'
                                        : 'Your site has a deep directory structure. Consider flattening for better SEO.';
                                  })()}
                                </p>
                              </div>
                            </div>
                            
                            {/* URL Parameters */}
                            <div className="p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center">
                                <svg className="h-5 w-5 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                  <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd"></path>
                                </svg>
                                <h6 className="text-sm font-medium text-gray-700">URL Parameters</h6>
                              </div>
                              <div className="mt-2 text-xs text-gray-600">
                                <p>
                                  {(() => {
                                    const paramCount = data.pages.filter(page => 
                                      (page.url || '').includes('?')
                                    ).length;
                                    
                                    return paramCount === 0
                                      ? 'No URL parameters detected. Clean URLs are better for SEO.'
                                      : `${paramCount} pages contain URL parameters. Consider using cleaner URLs for better SEO.`;
                                  })()}
                                </p>
                              </div>
                            </div>
                            
                            {/* URL Length Distribution */}
                            <div className="p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center">
                                <svg className="h-5 w-5 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"></path>
                                </svg>
                                <h6 className="text-sm font-medium text-gray-700">URL Length Distribution</h6>
                              </div>
                              <div className="mt-2 text-xs text-gray-600">
                                <div className="flex items-center justify-between mb-1">
                                  <span>Short URLs (< 50 chars)</span>
                                  <span className="font-medium">
                                    {data.pages.filter(page => 
                                      (page.url || '').length < 50
                                    ).length} pages
                                  </span>
                                </div>
                                <div className="flex items-center justify-between mb-1">
                                  <span>Medium URLs (50-100 chars)</span>
                                  <span className="font-medium">
                                    {data.pages.filter(page => 
                                      (page.url || '').length >= 50 && (page.url || '').length <= 100
                                    ).length} pages
                                  </span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span>Long URLs (> 100 chars)</span>
                                  <span className="font-medium">
                                    {data.pages.filter(page => 
                                      (page.url || '').length > 100
                                    ).length} pages
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* URL Improvement Recommendations */}
                      <div className="mt-6 bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                        <h5 className="text-md font-semibold text-gray-800 mb-3">URL Improvement Recommendations</h5>
                        
                        <ul className="space-y-3">
                          <li className="flex">
                            <svg className="h-5 w-5 text-emerald-500 flex-shrink-0 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                            </svg>
                            <div>
                              <p className="text-sm text-gray-800 font-medium">Use hyphens to separate words</p>
                              <p className="text-xs text-gray-600 mt-1">
                                Hyphens (-) are preferred over underscores (_) in URLs. They're treated as spaces by search engines.
                              </p>
                            </div>
                          </li>
                          
                          <li className="flex">
                            <svg className="h-5 w-5 text-emerald-500 flex-shrink-0 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                            </svg>
                            <div>
                              <p className="text-sm text-gray-800 font-medium">Include keywords in URLs</p>
                              <p className="text-xs text-gray-600 mt-1">
                                Add relevant keywords to your URLs, but keep them concise and natural. Avoid keyword stuffing.
                              </p>
                            </div>
                          </li>
                          
                          <li className="flex">
                            <svg className="h-5 w-5 text-emerald-500 flex-shrink-0 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                            </svg>
                            <div>
                              <p className="text-sm text-gray-800 font-medium">Keep URLs short and descriptive</p>
                              <p className="text-xs text-gray-600 mt-1">
                                Aim for URLs under 60 characters when possible. Remove unnecessary words and parameters.
                              </p>
                            </div>
                          </li>
                          
                          <li className="flex">
                            <svg className="h-5 w-5 text-emerald-500 flex-shrink-0 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                            </svg>
                            <div>
                              <p className="text-sm text-gray-800 font-medium">Use lowercase letters only</p>
                              <p className="text-xs text-gray-600 mt-1">
                                Keep all URLs lowercase to avoid duplicate content issues and improve consistency.
                              </p>
                            </div>
                          </li>
                          
                          <li className="flex">
                            <svg className="h-5 w-5 text-emerald-500 flex-shrink-0 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                            </svg>
                            <div>
                              <p className="text-sm text-gray-800 font-medium">Avoid URL parameters when possible</p>
                              <p className="text-xs text-gray-600 mt-1">
                                Use clean, static URLs instead of dynamic parameters. If parameters are necessary, use URL rewriting.
                              </p>
                            </div>
                          </li>
                        </ul>
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
                An advanced SEO analysis tool by Kleris Delilaj.
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
              
              <div>
                <h3 className="text-sm font-medium text-gray-700">Resources</h3>
                <ul className="mt-2 space-y-1">
                  <li>
                    <a href="#" className="text-xs text-indigo-600 hover:text-indigo-900">Documentation</a>
                  </li>
                  <li>
                    <a href="#" className="text-xs text-indigo-600 hover:text-indigo-900">SEO Best Practices</a>
                  </li>
                  <li>
                    <a href="#" className="text-xs text-indigo-600 hover:text-indigo-900">Support</a>
                  </li>
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
