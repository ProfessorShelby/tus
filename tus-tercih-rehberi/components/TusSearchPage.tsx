'use client';

import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { FacetGroup } from './FacetGroup';
import { RangeFilter } from './RangeFilter';
import { DataTable, SearchResult } from './DataTable';
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

export default function TusSearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showFilters, setShowFilters] = useState(true);
  const [adsenseSlot, setAdsenseSlot] = useState<string>('demo');
  
  // Set AdSense slot on client side
  useEffect(() => {
    setAdsenseSlot(process.env.NEXT_PUBLIC_ADSENSE_SLOT || 'demo');
  }, []);
  
  // Initialize filters from URL params
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
      pageSize: Number(params.get('pageSize')) || 20,
      sortBy: params.get('sortBy') || undefined,
      sortOrder: (params.get('sortOrder') as 'asc' | 'desc') || 'asc',
    };
  });

  // Fetch facets
  const { data: facets, isLoading: facetsLoading } = useQuery<Facets>({
    queryKey: ['facets'],
    queryFn: async () => {
      const response = await fetch('/api/facets');
      if (!response.ok) throw new Error('Failed to fetch facets');
      return response.json();
    },
  });

  // Fetch search results
  const { data: searchResults, isLoading: searchLoading } = useQuery<SearchResponse>({
    queryKey: ['search', filters],
    queryFn: async () => {
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

      const response = await fetch(`/api/search?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch search results');
      return response.json();
    },
    enabled: !!facets, // Only run after facets are loaded
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
    if (newFilters.pageSize !== 20) params.append('pageSize', newFilters.pageSize.toString());
    if (newFilters.sortBy) params.append('sortBy', newFilters.sortBy);
    if (newFilters.sortOrder !== 'asc') params.append('sortOrder', newFilters.sortOrder);

    const url = params.toString() ? `/?${params.toString()}` : '/';
    router.replace(url, { scroll: false });
  }, [router]);

  // Update filters and URL
  const updateFilters = useCallback((updates: Partial<SearchFilters>) => {
    const newFilters = { ...filters, ...updates, page: 1 }; // Reset to page 1 when filters change
    setFilters(newFilters);
    updateURL(newFilters);
  }, [filters, updateURL]);

  // Handle page changes
  const handlePageChange = useCallback((page: number) => {
    const newFilters = { ...filters, page };
    setFilters(newFilters);
    updateURL(newFilters);
  }, [filters, updateURL]);

  // Handle sorting
  const handleSort = useCallback((field: string, direction: 'asc' | 'desc') => {
    const newFilters = { ...filters, sortBy: field, sortOrder: direction, page: 1 };
    setFilters(newFilters);
    updateURL(newFilters);
  }, [filters, updateURL]);

  // Reset all filters
  const resetFilters = useCallback(() => {
    const resetFilters: SearchFilters = {
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
      pageSize: 20,
      sortBy: undefined,
      sortOrder: 'asc',
    };
    setFilters(resetFilters);
    updateURL(resetFilters);
  }, [facets, updateURL]);

  // Export current results to CSV
  const exportToCSV = useCallback(() => {
    if (!searchResults?.rows.length) return;

    const headers = [
      'Hastane/Kurum',
      'Şehir',
      'Tip',
      'Kurum Tipi',
      'Branş',
      'Dönem',
      'Kademe',
      'Kontenjan',
      'Yerleşen',
      'Taban Puan',
      'Tavan Puan',
      'Taban Sıralaması'
    ];

    const csvContent = [
      headers.join(','),
      ...searchResults.rows.map(row => [
        `"${row.hastaneAdi}"`,
        row.sehir,
        row.tip,
        `"${row.kurumTipi}"`,
        `"${row.brans}"`,
        row.donem,
        row.kademe,
        row.kontenjan,
        row.yerlesen,
        row.tabanPuan || '',
        row.tavanPuan || '',
        row.tabanSiralamasi || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `tus-tercih-rehberi-sayfa-${filters.page}.csv`;
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filters Sidebar */}
          <aside className={`w-full lg:w-80 space-y-6 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            {/* Search Input */}
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Hastane veya branş ara..."
                  value={filters.q}
                  onChange={(e) => updateFilters({ q: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="flex gap-2">
                <button
                  onClick={resetFilters}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                >
                  Filtreleri Sıfırla
                </button>
                <button
                  onClick={exportToCSV}
                  disabled={!searchResults?.rows.length}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  CSV İndir
                </button>
              </div>
            </div>

            {/* Ad Slot */}
            <AdsSlot 
              slot={adsenseSlot}
              className="w-full"
            />

            {facets && (
              <>
                {/* Categorical Filters */}
                <FacetGroup
                  title="Şehir"
                  values={facets.sehir}
                  selectedValues={filters.sehir}
                  onChange={(values) => updateFilters({ sehir: values })}
                  searchable
                  collapsible
                />

                <FacetGroup
                  title="Hastane Tipi"
                  values={facets.tip}
                  selectedValues={filters.tip}
                  onChange={(values) => updateFilters({ tip: values })}
                />

                <FacetGroup
                  title="Kurum Tipi"
                  values={facets.kurumTipi}
                  selectedValues={filters.kurumTipi}
                  onChange={(values) => updateFilters({ kurumTipi: values })}
                />

                <FacetGroup
                  title="Branş"
                  values={facets.brans}
                  selectedValues={filters.brans}
                  onChange={(values) => updateFilters({ brans: values })}
                  searchable
                  collapsible
                />

                <FacetGroup
                  title="Dönem"
                  values={facets.donem}
                  selectedValues={filters.donem}
                  onChange={(values) => updateFilters({ donem: values })}
                  collapsible
                />

                {/* Range Filters */}
                <RangeFilter
                  title="Taban Puan"
                  min={facets.ranges.tabanPuan.min}
                  max={facets.ranges.tabanPuan.max}
                  value={[
                    filters.tabanMin ?? facets.ranges.tabanPuan.min,
                    filters.tabanMax ?? facets.ranges.tabanPuan.max,
                  ]}
                  onChange={([min, max]) => updateFilters({ tabanMin: min, tabanMax: max })}
                  step={0.1}
                />

                <RangeFilter
                  title="Kontenjan"
                  min={facets.ranges.kontenjan.min}
                  max={facets.ranges.kontenjan.max}
                  value={[
                    filters.kontMin ?? facets.ranges.kontenjan.min,
                    filters.kontMax ?? facets.ranges.kontenjan.max,
                  ]}
                  onChange={([min, max]) => updateFilters({ kontMin: min, kontMax: max })}
                />
              </>
            )}
          </aside>

          {/* Main Content */}
          <main className="flex-1 space-y-6">
            {/* Ad Slot */}
            <AdsSlot 
              slot={adsenseSlot}
              format="horizontal"
              className="w-full"
            />

            {/* Results Table */}
            <DataTable
              data={searchResults?.rows || []}
              total={searchResults?.total || 0}
              page={searchResults?.page || 1}
              pageSize={searchResults?.pageSize || 20}
              totalPages={searchResults?.totalPages || 1}
              onPageChange={handlePageChange}
              onSort={handleSort}
              isLoading={searchLoading}
            />
          </main>
        </div>
      </div>
    </div>
  );
}
