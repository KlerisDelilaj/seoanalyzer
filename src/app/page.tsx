"use client";
import { useState } from 'react';
import { analyzeSite, analyzeSpecificUrl } from '../api';
import { 
  BarChart, Bar, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

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
      return <p className="text-black">No structured content available</p>;
    }

    const { headings, sections } = page.structured_content;

    return (
      <div className="text-black">
        <h3 className="text-xl font-bold mb-4">Page Structure</h3>
        
        {/* Display all headings at the top as a table of contents */}
        {headings && headings.length > 0 && (
          <div className="mb-6 bg-gray-50 p-4 rounded">
            <h4 className="font-semibold mb-2">Page Headings:</h4>
            <ul className="list-disc pl-5">
              {headings.map((heading, idx) => (
                <li key={idx} className={`${
                  heading.level === 1 ? 'font-bold' : 
                  heading.level === 2 ? 'font-semibold' : ''
                } mb-1`}>
                  {heading.text} <span className="text-gray-500 text-sm">(H{heading.level})</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Display page content by sections */}
        {sections && sections.length > 0 ? (
          <div className="space-y-6">
            {sections.map((section, idx) => (
              <div key={idx} className="border-b pb-4">
                {/* Display section heading */}
                {section.heading && (
                  <div 
                    className={`font-bold ${
                      section.heading.level === 1 ? 'text-2xl' : 
                      section.heading.level === 2 ? 'text-xl' : 
                      section.heading.level === 3 ? 'text-lg' : 'text-base'
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
                            level === 1 ? 'text-2xl' : 
                            level === 2 ? 'text-xl' : 
                            level === 3 ? 'text-lg' : 'text-base'
                          } mb-2`}
                        >
                          {content.text}
                        </div>
                      );
                    }
                    
                    if (content.type === 'p' || !content.html) {
                      return (
                        <div key={contentIdx} className="text-black">
                          {content.text}
                        </div>
                      );
                    }
                    
                    if (content.type === 'ul' || content.type === 'ol' || content.type === 'table') {
                      return (
                        <div 
                          key={contentIdx} 
                          className="text-black" 
                          dangerouslySetInnerHTML={{ __html: content.html }}
                        />
                      );
                    }
                    
                    return (
                      <div key={contentIdx} className="text-black">
                        {content.text}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-black">No structured sections found on this page.</p>
        )}
        
        {/* If no sections but we have headings, display raw headings */}
        {(!sections || sections.length === 0) && headings && headings.length > 0 && (
          <div className="space-y-4">
            <p className="text-black">No structured sections found, but headings were detected:</p>
            <div className="space-y-2">
              {headings.map((heading, idx) => (
                <div 
                  key={idx} 
                  className={`font-bold ${
                    heading.level === 1 ? 'text-2xl' : 
                    heading.level === 2 ? 'text-xl' : 
                    heading.level === 3 ? 'text-lg' : 'text-base'
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
      return <p className="text-black">No HTML content available</p>;
    }

    const htmlSnippet = page.raw_html.slice(0, 2000) + '...';

    return (
      <div>
        <h3 className="text-xl font-bold mb-4 text-black">Raw HTML</h3>
        <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto text-sm text-black font-mono">
          {htmlSnippet}
        </pre>
      </div>
    );
  };
  
  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-indigo-700 shadow-md p-6 text-white">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between">
          <h1 className="text-2xl font-bold">Website SEO Analyzer</h1>
          
          {!data ? (
            <div className="mt-4 md:mt-0 w-full md:w-1/2">
              <div className="flex flex-col md:flex-row gap-2">
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="Enter website URL (e.g., https://example.com)"
                  className="flex-1 p-2 rounded border-0"
                />
                <button
                  onClick={startAnalysis}
                  disabled={isAnalyzing || !url}
                  className={`p-2 rounded ${isAnalyzing || !url ? 'bg-gray-400' : 'bg-blue-700 hover:bg-blue-800'} text-white`}
                >
                  {isAnalyzing ? 'Analyzing...' : 'Analyze Single Page'}
                </button>
              </div>
              
              {error && (
                <div className="mt-2 text-red-200 text-sm">
                  {error}
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="font-bold text-white">Analyzing:</span> 
              <span className="text-white">{data.analyzed_url || url}</span>
              <button 
                onClick={() => setData(null)} 
                className="px-2 py-1 bg-white bg-opacity-20 rounded text-sm"
              >
                New Analysis
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main content */}
      {!data ? (
        <div className="max-w-7xl mx-auto p-6">
          {isAnalyzing ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <div className="animate-pulse flex justify-center">
                <div className="h-12 w-12 bg-blue-400 rounded-full"></div>
              </div>
              <h2 className="mt-4 text-xl font-medium text-black">Analyzing website...</h2>
              <p className="mt-2 text-black">This may take a few moments.</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-medium mb-4 text-black">Website SEO Analysis Tool</h2>
              <p className="text-black mb-4">
                Enter a URL above to analyze the website&apos;s SEO metrics. The tool will analyze the page
                you enter, extract sitemap information, and provide detailed SEO recommendations.
              </p>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Tabs */}
          <div className="border-b border-gray-200 bg-white">
            <div className="max-w-7xl mx-auto">
              <nav className="flex overflow-x-auto">
                {['dashboard', 'content', 'links', 'keywords', 'recommendations', 'sitemap'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`py-4 px-6 border-b-2 whitespace-nowrap ${
                      activeTab === tab
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Dashboard content */}
          <div className="max-w-7xl mx-auto p-6">
            {activeTab === 'dashboard' && (
              <div>
                {/* Summary cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  {Object.entries({
                    'Pages Analyzed': getOverviewStats().total_pages,
                    'Avg. Word Count': Math.round(getOverviewStats().avg_word_count),
                    'Avg. Images': getOverviewStats().avg_image_count.toFixed(1),
                    'Total Links': getOverviewStats().total_links
                  }).map(([label, value]) => (
                    <div key={label} className="bg-white shadow rounded-lg p-6">
                      <div className="text-sm text-gray-500">{label}</div>
                      <div className="text-3xl font-bold mt-1 text-black">{value}</div>
                    </div>
                  ))}
                </div>
                
                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  {/* Page Metrics */}
                  <div className="bg-white shadow rounded-lg p-4">
                    <h3 className="text-lg font-medium mb-4 text-black">Page Metrics</h3>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={data.stats.pageMetrics?.slice(0, 5) || []}
                          margin={{ top: 5, right: 30, left: 20, bottom: 30 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="url" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="wordCount" name="Word Count" fill="#8884d8" />
                          <Bar dataKey="imageCount" name="Image Count" fill="#82ca9d" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  
                  {/* Link Distribution */}
                  <div className="bg-white shadow rounded-lg p-4">
                    <h3 className="text-lg font-medium mb-4 text-black">Link Distribution</h3>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={data.stats.linkDistribution || []}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label={({name, value}) => `${name}: ${value}`}
                          >
                            {(data.stats.linkDistribution || []).map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
                
                {/* Keywords */}
                <div className="bg-white shadow rounded-lg p-4">
                  <h3 className="text-lg font-medium mb-4 text-black">Top Keywords</h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        layout="vertical"
                        data={data.stats.common_keywords?.slice(0, 7) || []}
                        margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" />
                        <Tooltip />
                        <Bar dataKey="value" name="Frequency" fill="#8884d8">
                          {(data.stats.common_keywords || []).slice(0, 7).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'recommendations' && (
              <div className="bg-white shadow rounded-lg divide-y divide-gray-200">
                <div className="p-6">
                  <h3 className="text-lg font-medium text-black">SEO Recommendations</h3>
                  <p className="mt-1 text-black">Based on the analysis of your website, here are some recommendations to improve your SEO.</p>
                </div>
                
                {/* General recommendations */}
                <div className="p-6">
                  <h4 className="text-md font-medium mb-3 text-black">General Recommendations</h4>
                  
                  {data.recommendations.general.map((rec, index) => (
                    <div key={index} className={`mb-4 p-4 ${rec.type === 'warning' ? 'bg-yellow-50 border-l-4 border-yellow-500' : rec.type === 'success' ? 'bg-green-50 border-l-4 border-green-500' : 'bg-blue-50 border-l-4 border-blue-500'} rounded-r-md`}>
                      <h5 className="font-medium text-black">{rec.text}</h5>
                      <p className="mt-1 text-black">{rec.recommendation}</p>
                    </div>
                  ))}
                </div>
                
                {/* Content recommendations */}
                {data.recommendations.content.length > 0 && (
                  <div className="p-6">
                    <h4 className="text-md font-medium mb-3 text-black">Content Recommendations</h4>
                    
                    {data.recommendations.content.map((rec, index) => (
                      <div key={index} className={`mb-4 p-4 ${rec.type === 'warning' ? 'bg-yellow-50 border-l-4 border-yellow-500' : 'bg-green-50 border-l-4 border-green-500'} rounded-r-md`}>
                        <h5 className="font-medium text-black">{rec.text}</h5>
                        <p className="mt-1 text-black">{rec.recommendation}</p>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Pages to improve */}
                {data.recommendations.pages_to_improve.length > 0 && (
                  <div className="p-6">
                    <h4 className="text-md font-medium mb-3 text-black">Pages to Improve</h4>
                    
                    {data.recommendations.pages_to_improve.map((issue, index) => (
                      <div key={index} className="mb-4">
                        <h5 className="font-medium mb-2 text-black">{issue.description}</h5>
                        <div className="bg-gray-50 rounded p-3">
                          <ul className="space-y-1">
                            {issue.pages.map((page, pageIndex) => (
                              <li key={pageIndex} className="flex justify-between">
                                <a 
                                  href={page.page_link} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="truncate text-blue-600 hover:underline"
                                >
                                  {page.title || page.url}
                                </a>
                                {page.word_count && <span className="text-black">{page.word_count} words</span>}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {activeTab === 'content' && (
              <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-black">Content Analysis</h3>
                  <p className="mt-1 text-black">Overview of content metrics for the analyzed page.</p>
                </div>
                
                {showPageContent && selectedPage && (
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <h3 className="text-lg font-medium text-black">
                          {selectedPage.title || "Page Content"}
                        </h3>
                        <p className="text-sm text-blue-600">
                          <a 
                            href={selectedPage.page_link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                          >
                            {selectedPage.page_link}
                          </a>
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => setViewContentType('structured')}
                          className={`px-3 py-1 ${viewContentType === 'structured' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'} rounded`}
                        >
                          Structured
                        </button>
                        <button 
                          onClick={() => setViewContentType('raw')}
                          className={`px-3 py-1 ${viewContentType === 'raw' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'} rounded`}
                        >
                          HTML
                        </button>
                        <button 
                          onClick={() => setShowPageContent(false)}
                          className="px-3 py-1 bg-gray-200 text-gray-700 rounded ml-2"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded max-h-96 overflow-y-auto">
                      {viewContentType === 'structured' 
                        ? renderStructuredContent(selectedPage)
                        : renderRawHtml(selectedPage)
                      }
                    </div>
                  </div>
                )}
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Page</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Words</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">H1</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Images</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {(data.pages || []).map((page, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 truncate max-w-xs">
                            <a 
                              href={page.page_link} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              {page.title || page.url}
                            </a>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-black">{page.word_count}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-black">{page.h1_count}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-black">{page.image_count}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                            <button 
                              onClick={() => {
                                setSelectedPage(page);
                                setShowPageContent(true);
                                setViewContentType('structured');
                              }}
                              className="text-blue-600 hover:underline"
                            >
                              View Content
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            {/* Links tab */}
            {activeTab === 'links' && (
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium mb-4 text-black">Link Analysis</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="h-80 border rounded p-4">
                    <h4 className="text-md font-medium mb-2 text-black">Internal vs External Links</h4>
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
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div>
                    <h4 className="text-md font-medium mb-2 text-black">Top Pages by Links</h4>
                    <ul className="divide-y divide-gray-200">
                      {(data.stats.top_link_pages || []).map((page, index) => (
                        <li key={index} className="py-3">
                          <a 
                            href={page.page_link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="truncate font-medium text-blue-600 hover:underline block"
                          >
                            {page.title || page.url}
                          </a>
                          <div className="text-sm text-black">
                            Internal: {page.internal_links} | External: {page.external_links} | Total: {page.total_links}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
            
            {/* Keywords tab - SIMPLIFIED VERSION */}
            {activeTab === 'keywords' && (
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium mb-4 text-black">Keyword Analysis</h3>
                
                {/* Top Keywords Chart - Keeping this section */}
                <div className="bg-white shadow rounded-lg p-4 mb-6">
                  <h4 className="text-md font-medium mb-2 text-black">Top Keywords by Relevance</h4>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        layout="vertical"
                        data={data.stats.common_keywords?.slice(0, 10).map(kw => ({
                          name: kw.name,
                          value: kw.value,
                          relevance: kw.relevance ? Math.round(kw.relevance * 10) / 10 : 0
                        })) || []}
                        margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" width={120} />
                        <Tooltip 
                          formatter={(value, name) => {
                            if (name === 'Frequency') return [value, 'Occurrences'];
                            if (name === 'Relevance') return [value, 'Relevance Score'];
                            return [value, name];
                          }}
                        />
                        <Legend />
                        <Bar dataKey="value" name="Frequency" fill="#8884d8" />
                        <Bar dataKey="relevance" name="Relevance" fill="#82ca9d" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                {/* Keywords by Page - Keeping this section */}
                <div className="bg-white shadow rounded-lg p-4">
                  <h4 className="text-md font-medium mb-4 text-black">Keywords by Page</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Page</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Main Keyword</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Top Phrase</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Keyword Density</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {data.stats.keywords_by_page?.map((page, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <a 
                                href={page.page_link} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                              >
                                {page.title || page.url}
                              </a>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                              {page.single_keywords && page.single_keywords.length > 0 ? (
                                <div>
                                  <span className="font-medium">{page.single_keywords[0].keyword}</span>
                                  <span className="text-gray-500 ml-2">
                                    ({page.single_keywords[0].count} times)
                                  </span>
                                </div>
                              ) : (
                                <span className="text-gray-500">None detected</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                              {page.phrases && page.phrases.length > 0 ? (
                                <div>
                                  <span className="font-medium">{page.phrases[0].phrase}</span>
                                  <span className="text-gray-500 ml-2">
                                    ({page.phrases[0].count} times)
                                  </span>
                                </div>
                              ) : (
                                <span className="text-gray-500">None detected</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                              {data.stats.pageMetrics?.find(p => p.pageLink === page.page_link)?.keywordDensity.toFixed(2)}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
            
            {/* Sitemap tab - New */}
            {activeTab === 'sitemap' && (
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium mb-4 text-black">Sitemap URLs</h3>
                {data.sitemap_urls && data.sitemap_urls.length > 0 ? (
                  <div>
                    <p className="mb-4 text-black">
                      This website has {data.sitemap_urls.length} URLs in its sitemap. Click on any URL to analyze it.
                    </p>
                    <div className="bg-gray-50 rounded p-4 max-h-96 overflow-y-auto">
                      <ul className="divide-y divide-gray-200">
                        {data.sitemap_urls.map((url: string, index: number) => (
                          <li key={index} className="py-2">
                            <div className="flex items-center justify-between">
                              <span className="text-black truncate max-w-lg">{url}</span>
                              <button
                                onClick={() => analyzeSitemapUrl(url)}
                                className="ml-2 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                              >
                                Analyze
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4">
                    <p className="text-black">
                      No sitemap was found for this website. A sitemap helps search engines discover and crawl your pages efficiently.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </main>
  );
}