'use client';

import { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { FacetGroup } from './FacetGroup';
import { RangeFilter } from './RangeFilter';
import { DataTable, SearchResult } from './DataTable';
import { MultiPeriodDataTable, MultiPeriodSearchResult } from './MultiPeriodDataTable';
import { AdsSlot } from './AdsSlot';
// Remove server actions import
import { MagnifyingGlassIcon, AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline';

interface Facets {
  sehir: string[];
  tip: string[];
  kurumTipi: string[];
  brans: string[];
  donem: string[];
  ranges: {
    tabanPuan: { min: number; max: number };
    kontenjan: { min: number; max: number };
  };
}

interface SearchResponse {
  rows: SearchResult[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface MultiPeriodSearchResponse {
  rows: MultiPeriodSearchResult[];
  periods: string[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface SearchFilters {
  q: string;
  sehir: string[];
  tip: string[];
  kurumTipi: string[];
  brans: string[];
  donem: string[];
  tabanMin?: number;
  tabanMax?: number;
  kontMin?: number;
  kontMax?: number;
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder: 'asc' | 'desc';
}

function TusSearchPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showFilters, setShowFilters] = useState(true);
  const [adsenseSlot, setAdsenseSlot] = useState<string>('demo');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  
  // Set AdSense slot on client side (disabled for deployment)
  useEffect(() => {
    setAdsenseSlot(''); // Disabled for deployment
  }, []);

  // Debounce search term to reduce API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Initialize search term from URL
  useEffect(() => {
    const urlSearchTerm = searchParams.get('q') || '';
    setSearchTerm(urlSearchTerm);
    setDebouncedSearchTerm(urlSearchTerm);
  }, [searchParams]);
  
  // Use local state for filters instead of URL-dependent approach for instant updates
  const [filters, setFilters] = useState<SearchFilters>(() => {
    const params = new URLSearchParams(searchParams.toString());
    return {
      q: params.get('q') || '',
      sehir: params.getAll('sehir'),
      tip: params.getAll('tip'),
      kurumTipi: params.getAll('kurumTipi'),
      brans: params.getAll('brans'),
      donem: params.getAll('donem'),
      tabanMin: params.get('tabanMin') ? Number(params.get('tabanMin')) : undefined,
      tabanMax: params.get('tabanMax') ? Number(params.get('tabanMax')) : undefined,
      kontMin: params.get('kontMin') ? Number(params.get('kontMin')) : undefined,
      kontMax: params.get('kontMax') ? Number(params.get('kontMax')) : undefined,
      page: Number(params.get('page')) || 1,
      pageSize: Number(params.get('pageSize')) || 50,
      sortBy: params.get('sortBy') || undefined,
      sortOrder: (params.get('sortOrder') as 'asc' | 'desc') || 'asc',
    };
  });

  // Sync filters with URL changes and debounced search term
  useEffect(() => {
    setFilters(prev => ({
      ...prev,
      q: debouncedSearchTerm
    }));
  }, [debouncedSearchTerm]);

  // Sync filters with URL params when they change externally (browser back/forward)
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    setFilters({
      q: debouncedSearchTerm,
      sehir: params.getAll('sehir'),
      tip: params.getAll('tip'),
      kurumTipi: params.getAll('kurumTipi'),
      brans: params.getAll('brans'),
      donem: params.getAll('donem'),
      tabanMin: params.get('tabanMin') ? Number(params.get('tabanMin')) : undefined,
      tabanMax: params.get('tabanMax') ? Number(params.get('tabanMax')) : undefined,
      kontMin: params.get('kontMin') ? Number(params.get('kontMin')) : undefined,
      kontMax: params.get('kontMax') ? Number(params.get('kontMax')) : undefined,
      page: Number(params.get('page')) || 1,
      pageSize: Number(params.get('pageSize')) || 50,
      sortBy: params.get('sortBy') || undefined,
      sortOrder: (params.get('sortOrder') as 'asc' | 'desc') || 'asc',
    });
  }, [searchParams, debouncedSearchTerm]);

  // Fetch facets with caching
  const { data: facets, isLoading: facetsLoading } = useQuery<Facets>({
    queryKey: ['facets'],
    queryFn: async () => {
      console.log('🚀 Frontend: Fetching facets...');
      const response = await fetch('/api/facets');
      console.log('📊 Frontend: Facets response status:', response.status);
      if (!response.ok) {
        console.error('❌ Frontend: Facets fetch failed:', response.status, response.statusText);
        throw new Error('Failed to fetch facets');
      }
      const data = await response.json();
      console.log('✅ Frontend: Facets data received:', { 
        sehirCount: data.sehir?.length, 
        bransCount: data.brans?.length 
      });
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (previously cacheTime)
  });

  // Fetch search results using multi-period endpoint with optimizations
  const { data: searchResults, isLoading: searchLoading, isFetching } = useQuery<MultiPeriodSearchResponse>({
    queryKey: ['search-multi-period', filters],
    queryFn: async ({ signal }) => {
      const params = new URLSearchParams();
      
      if (filters.q) params.append('q', filters.q);
      filters.sehir.forEach(s => params.append('sehir', s));
      filters.tip.forEach(t => params.append('tip', t));
      filters.kurumTipi.forEach(k => params.append('kurumTipi', k));
      filters.brans.forEach(b => params.append('brans', b));
      filters.donem.forEach(d => params.append('donem', d));
      if (filters.tabanMin !== undefined) params.append('tabanMin', filters.tabanMin.toString());
      if (filters.tabanMax !== undefined) params.append('tabanMax', filters.tabanMax.toString());
      if (filters.kontMin !== undefined) params.append('kontMin', filters.kontMin.toString());
      if (filters.kontMax !== undefined) params.append('kontMax', filters.kontMax.toString());
      params.append('page', filters.page.toString());
      params.append('pageSize', filters.pageSize.toString());
      if (filters.sortBy) params.append('sortBy', filters.sortBy);
      params.append('sortOrder', filters.sortOrder);

      console.log('🔍 Frontend: Searching with filters:', JSON.stringify(filters, null, 2));
      console.log('🔗 Frontend: Search URL:', `/api/search-multi-period?${params.toString()}`);
      
      const response = await fetch(`/api/search-multi-period?${params.toString()}`, {
        signal, // Request cancellation support
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache',
        },
      });
      
      console.log('📊 Frontend: Search response status:', response.status);
      if (!response.ok) {
        console.error('❌ Frontend: Search fetch failed:', response.status, response.statusText);
        throw new Error('Failed to fetch search results');
      }
      
      const data = await response.json();
      console.log('✅ Frontend: Search data received:', { 
        totalCount: data.total, 
        resultsCount: data.rows?.length,
        periodsCount: data.periods?.length 
      });
      return data;
    },
    enabled: !!facets, // Only run after facets are loaded
    staleTime: 0, // Always consider data stale for immediate filtering
    gcTime: 1 * 60 * 1000, // 1 minute cache (previously cacheTime)
    placeholderData: (previousData) => previousData, // Keep previous data while loading new data
    refetchOnWindowFocus: false, // Don't refetch on window focus
    retry: 1, // Only retry once on failure
  });

  // Update URL when filters change
  const updateURL = useCallback((newFilters: SearchFilters) => {
    const params = new URLSearchParams();
    
    if (newFilters.q) params.append('q', newFilters.q);
    newFilters.sehir.forEach(s => params.append('sehir', s));
    newFilters.tip.forEach(t => params.append('tip', t));
    newFilters.kurumTipi.forEach(k => params.append('kurumTipi', k));
    newFilters.brans.forEach(b => params.append('brans', b));
    newFilters.donem.forEach(d => params.append('donem', d));
    if (newFilters.tabanMin !== undefined) params.append('tabanMin', newFilters.tabanMin.toString());
    if (newFilters.tabanMax !== undefined) params.append('tabanMax', newFilters.tabanMax.toString());
    if (newFilters.kontMin !== undefined) params.append('kontMin', newFilters.kontMin.toString());
    if (newFilters.kontMax !== undefined) params.append('kontMax', newFilters.kontMax.toString());
    if (newFilters.page > 1) params.append('page', newFilters.page.toString());
    if (newFilters.pageSize !== 50) params.append('pageSize', newFilters.pageSize.toString());
    if (newFilters.sortBy) params.append('sortBy', newFilters.sortBy);
    if (newFilters.sortOrder !== 'asc') params.append('sortOrder', newFilters.sortOrder);

    const url = params.toString() ? `/?${params.toString()}` : '/';
    router.replace(url, { scroll: false });
  }, [router]);

  // Update filters with immediate local state change and URL sync
  const updateFilters = useCallback((updates: Partial<SearchFilters>) => {
    console.log('🔧 Frontend: Updating filters:', JSON.stringify(updates, null, 2));
    console.log('🔧 Frontend: Current filters before update:', JSON.stringify(filters, null, 2));
    
    // Handle search term separately for debouncing
    if (updates.q !== undefined) {
      setSearchTerm(updates.q);
      console.log('🔍 Frontend: Search term updated, debouncing...');
      // Don't update URL immediately for search, let debouncing handle it
      return;
    }
    
    const newFilters = { ...filters, ...updates, page: 1 }; // Reset to page 1 when filters change
    console.log('🔧 Frontend: New filters after update:', JSON.stringify(newFilters, null, 2));
    
    // Update local state immediately for instant UI response
    setFilters(newFilters);
    // Also update URL for browser history
    updateURL(newFilters);
  }, [filters, updateURL]);

  // Handle page changes with immediate state and URL update and scroll to top
  const handlePageChange = useCallback((page: number) => {
    const newFilters = { ...filters, page };
    setFilters(newFilters);
    updateURL(newFilters);
    
    // Scroll to top of the page
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }, [filters, updateURL]);

  // Handle sorting with immediate state and URL update
  const handleSort = useCallback((field: string, direction: 'asc' | 'desc') => {
    const newFilters = { ...filters, sortBy: field, sortOrder: direction, page: 1 };
    setFilters(newFilters);
    updateURL(newFilters);
  }, [filters, updateURL]);

  // Reset all filters
  const resetFilters = useCallback(() => {
    const resetFiltersData: SearchFilters = {
      q: '',
      sehir: [],
      tip: [],
      kurumTipi: [],
      brans: [],
      donem: [],
      tabanMin: facets?.ranges.tabanPuan.min,
      tabanMax: facets?.ranges.tabanPuan.max,
      kontMin: facets?.ranges.kontenjan.min,
      kontMax: facets?.ranges.kontenjan.max,
      page: 1,
      pageSize: 50,
      sortBy: undefined,
      sortOrder: 'asc',
    };
    setSearchTerm('');
    setDebouncedSearchTerm('');
    setFilters(resetFiltersData);
    updateURL(resetFiltersData);
  }, [facets, updateURL]);

  // Export current results to CSV
  const exportToCSV = useCallback(() => {
    const typedResults = searchResults as MultiPeriodSearchResponse;
    if (!typedResults?.rows?.length) return;

    const headers = [
      'Hastane/Kurum',
      'Şehir',
      'Tip',
      'Kurum Tipi',
      'Branş',
      'Kademe',
      ...(typedResults.periods || []).flatMap((period: string) => [
        `${period} Kontenjan`,
        `${period} Yerleşen`,
        `${period} Taban Puan`,
        `${period} Sıralama`
      ])
    ];

    const csvContent = [
      headers.join(','),
      ...(typedResults.rows || []).map((row: any) => [
        `"${row.hastaneAdi}"`,
        row.sehir,
        row.tip,
        `"${row.kurumTipi}"`,
        `"${row.brans}"`,
        row.kademe,
        ...(typedResults.periods || []).flatMap((period: string) => {
          const periodData = row.periods?.[period];
          return [
            periodData?.kontenjan || '',
            periodData?.yerlesen || '',
            periodData?.tabanPuan || '',
            periodData?.tabanSiralamasi || ''
          ];
        })
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `tus-tercih-rehberi-cok-donem-sayfa-${filters.page}.csv`;
    link.click();
  }, [searchResults, filters.page]);

  if (facetsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">TUS Tercih Rehberi</h1>
              <p className="mt-2 text-gray-600">
                Tıpta Uzmanlık Sınavı sonuçlarını inceleyin ve tercihlerinizi planlayın
              </p>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              <AdjustmentsHorizontalIcon className="h-4 w-4 mr-2" />
              Filtreler
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Filters Section - Now at the top */}
        <div className={`mb-6 ${showFilters ? 'block' : 'hidden lg:block'}`}>
          <div className="bg-white rounded-lg shadow p-6">
            {/* Search Input */}
            <div className="mb-6">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Hastane veya branş ara..."
                  value={searchTerm}
                  onChange={(e) => updateFilters({ q: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mb-6">
              <div className="flex gap-2">
                <button
                  onClick={resetFilters}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                >
                  Filtreleri Sıfırla
                </button>
              </div>
            </div>

            {facets && (
              <>
                {/* Categorical Filters */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 items-start">
                  <div className="space-y-4 min-w-0 h-96">
                    <FacetGroup
                      title="Şehir"
                      values={facets?.sehir || []}
                      selectedValues={filters.sehir}
                      onChange={(values) => updateFilters({ sehir: values })}
                      searchable
                      collapsible
                    />
                  </div>

                  <div className="space-y-4 min-w-0 h-96">
                    <FacetGroup
                      title="Hastane Tipi"
                      values={facets?.tip || []}
                      selectedValues={filters.tip}
                      onChange={(values) => updateFilters({ tip: values })}
                    />
                  </div>

                  <div className="space-y-4 min-w-0 h-96">
                    <FacetGroup
                      title="Kurum Tipi"
                      values={facets?.kurumTipi || []}
                      selectedValues={filters.kurumTipi}
                      onChange={(values) => updateFilters({ kurumTipi: values })}
                    />
                  </div>

                  <div className="space-y-4 min-w-0 h-96">
                    <FacetGroup
                      title="Branş"
                      values={facets?.brans || []}
                      selectedValues={filters.brans}
                      onChange={(values) => updateFilters({ brans: values })}
                      searchable
                      collapsible
                    />
                  </div>
                </div>

              </>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {/* Ad Slot - Disabled for deployment */}
          {adsenseSlot && (
            <AdsSlot 
              slot={adsenseSlot}
              format="horizontal"
              className="w-full"
            />
          )}

          {/* Results Table */}
            <MultiPeriodDataTable
              data={(searchResults as MultiPeriodSearchResponse)?.rows || []}
              periods={(searchResults as MultiPeriodSearchResponse)?.periods || []}
              total={(searchResults as MultiPeriodSearchResponse)?.total || 0}
              page={(searchResults as MultiPeriodSearchResponse)?.page || 1}
              pageSize={(searchResults as MultiPeriodSearchResponse)?.pageSize || 50}
              totalPages={(searchResults as MultiPeriodSearchResponse)?.totalPages || 1}
              onPageChange={handlePageChange}
              onSort={handleSort}
              isLoading={searchLoading || isFetching}
            />

          {/* Bottom Ad Slots - Disabled for deployment */}
          {adsenseSlot && (
            <div className="space-y-4">
              {/* Large Bottom Ad */}
              <AdsSlot 
                slot={adsenseSlot}
                format="horizontal"
                className="w-full"
              />
              
              {/* Additional Bottom Ads */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AdsSlot 
                  slot={adsenseSlot}
                  className="w-full"
                />
                <AdsSlot 
                  slot={adsenseSlot}
                  className="w-full"
                />
              </div>

              {/* Final Bottom Ad */}
              <AdsSlot 
                slot={adsenseSlot}
                format="horizontal"
                className="w-full"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TusSearchPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen">Loading...</div>}>
      <TusSearchPageContent />
    </Suspense>
  );
}
