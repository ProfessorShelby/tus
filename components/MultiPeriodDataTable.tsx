'use client';

import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  SortingState,
} from '@tanstack/react-table';
import { useState } from 'react';
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

export interface MultiPeriodSearchResult {
  id: string;
  kurumKodu: number;
  hastaneAdi: string;
  sehir: string;
  tip: string;
  kurumTipi: string;
  brans: string;
  kademe: string;
  periods: Record<string, {
    kontenjan: number | null;
    yerlesen: number | null;
    tabanPuan: number | null;
    tabanSiralamasi: number | null;
  }>;
}

interface MultiPeriodDataTableProps {
  data: MultiPeriodSearchResult[];
  periods: string[]; // Array of period strings like ["2025/1", "2024/2", "2024/1", "2023/2"]
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onSort: (field: string, direction: 'asc' | 'desc') => void;
  isLoading?: boolean;
}

const columnHelper = createColumnHelper<MultiPeriodSearchResult>();

export function MultiPeriodDataTable({
  data,
  periods,
  total,
  page,
  pageSize,
  totalPages,
  onPageChange,
  onSort,
  isLoading = false,
}: MultiPeriodDataTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const columns = [
    columnHelper.accessor('hastaneAdi', {
      header: 'Hastane/Kurum',
      cell: (info) => (
        <div className="min-w-[200px]">
          <div className="font-medium text-gray-900">{info.getValue()}</div>
          <div className="text-sm text-gray-500">{info.row.original.kurumTipi}</div>
        </div>
      ),
    }),
    columnHelper.accessor('sehir', {
      header: 'Şehir',
      cell: (info) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 whitespace-nowrap">
          {info.getValue()}
        </span>
      ),
    }),
    columnHelper.accessor('tip', {
      header: 'Tip',
      cell: (info) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${
          info.getValue() === 'DEVLET' 
            ? 'bg-green-100 text-green-800' 
            : 'bg-purple-100 text-purple-800'
        }`}>
          {info.getValue()}
        </span>
      ),
    }),
    columnHelper.accessor('brans', {
      header: 'Branş',
      cell: (info) => (
        <div className="min-w-[150px]">
          <div className="font-medium text-gray-900">{info.getValue()}</div>
          <div className="text-sm text-gray-500">{info.row.original.kademe}</div>
        </div>
      ),
    }),
    // Dynamic columns for each period - Kontenjan
    ...periods.map((period) =>
      columnHelper.accessor(
        (row) => row.periods[period]?.kontenjan,
        {
          id: `kontenjan-${period}`,
          header: () => (
            <div className="text-center">
              <div className="font-medium text-xs">{period}</div>
              <div className="text-xs text-gray-500">Kontenjan</div>
            </div>
          ),
          cell: (info) => {
            const periodData = info.row.original.periods[period];
            
            if (!periodData || periodData.kontenjan === null) {
              return <div className="text-center text-gray-400 min-w-[60px]">--</div>;
            }
            
            return (
              <div className="text-center min-w-[60px]">
                <div className="font-medium text-blue-600 text-sm">
                  {periodData.kontenjan}
                </div>
                {periodData.yerlesen !== null && (
                  <div className="text-xs text-gray-500">
                    Yerleşen: {periodData.yerlesen}
                  </div>
                )}
              </div>
            );
          },
          sortingFn: (rowA, rowB, columnId) => {
            const aValue = rowA.original.periods[period]?.kontenjan;
            const bValue = rowB.original.periods[period]?.kontenjan;
            
            // Always put null values at the end regardless of sort direction
            if (aValue === null && bValue === null) return 0;
            if (aValue === null) return 1;
            if (bValue === null) return -1;
            
            return aValue - bValue;
          },
        }
      )
    ),
    // Dynamic columns for each period - Taban Puan
    ...periods.map((period) =>
      columnHelper.accessor(
        (row) => row.periods[period]?.tabanPuan,
        {
          id: `puan-${period}`,
          header: () => (
            <div className="text-center">
              <div className="font-medium text-xs">{period}</div>
              <div className="text-xs text-gray-500">Taban Puan</div>
            </div>
          ),
          cell: (info) => {
            const periodData = info.row.original.periods[period];
            
            if (!periodData || periodData.tabanPuan === null) {
              return <div className="text-center text-gray-400 min-w-[60px]">--</div>;
            }
            
            return (
              <div className="text-center min-w-[60px]">
                <div className="text-sm font-medium text-red-600">
                  {periodData.tabanPuan.toFixed(2)}
                </div>
              </div>
            );
          },
          sortingFn: (rowA, rowB, columnId) => {
            const aValue = rowA.original.periods[period]?.tabanPuan;
            const bValue = rowB.original.periods[period]?.tabanPuan;
            
            // Always put null values at the end regardless of sort direction
            if (aValue === null && bValue === null) return 0;
            if (aValue === null) return 1;
            if (bValue === null) return -1;
            
            return aValue - bValue;
          },
        }
      )
    ),
    // Dynamic columns for each period - Sıralama
    ...periods.map((period) =>
      columnHelper.accessor(
        (row) => row.periods[period]?.tabanSiralamasi,
        {
          id: `siralama-${period}`,
          header: () => (
            <div className="text-center">
              <div className="font-medium text-xs">{period}</div>
              <div className="text-xs text-gray-500">Sıralama</div>
            </div>
          ),
          cell: (info) => {
            const periodData = info.row.original.periods[period];
            
            if (!periodData || periodData.tabanSiralamasi === null) {
              return <div className="text-center text-gray-400 min-w-[60px]">--</div>;
            }
            
            return (
              <div className="text-center min-w-[60px]">
                <div style={{ fontSize: '0.75rem', fontWeight: '500', color: '#000000', lineHeight: '1rem' }}>
                  {periodData.tabanSiralamasi.toLocaleString()}
                </div>
              </div>
            );
          },
          sortingFn: (rowA, rowB, columnId) => {
            const aValue = rowA.original.periods[period]?.tabanSiralamasi;
            const bValue = rowB.original.periods[period]?.tabanSiralamasi;
            
            // Always put null values at the end regardless of sort direction
            if (aValue === null && bValue === null) return 0;
            if (aValue === null) return 1;
            if (bValue === null) return -1;
            
            return aValue - bValue;
          },
        }
      )
    ),
  ];

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualSorting: true,
  });

  const handleSort = (columnId: string) => {
    const currentSort = sorting.find(s => s.id === columnId);
    const direction = currentSort?.desc ? 'asc' : 'desc';
    onSort(columnId, direction);
    setSorting([{ id: columnId, desc: direction === 'desc' }]);
  };

  const renderPagination = () => {
    const pages = [];
    const showPages = 5;
    const startPage = Math.max(1, page - Math.floor(showPages / 2));
    const endPage = Math.min(totalPages, startPage + showPages - 1);

    // Previous button
    pages.push(
      <button
        key="prev"
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        className="relative inline-flex items-center px-2 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-l-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Önceki
      </button>
    );

    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => onPageChange(i)}
          className={`relative inline-flex items-center px-4 py-2 text-sm font-medium border ${
            i === page
              ? 'bg-blue-50 border-blue-500 text-blue-600 z-10'
              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
          }`}
        >
          {i}
        </button>
      );
    }

    // Next button
    pages.push(
      <button
        key="next"
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        className="relative inline-flex items-center px-2 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-r-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Sonraki
      </button>
    );

    return pages;
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 text-center">
          <p className="text-gray-600">Arama kriterlerinize uygun kayıt bulunamadı.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Results summary */}
      <div className="px-4 sm:px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <p className="text-sm text-gray-700">
            Toplam <span className="font-medium">{total.toLocaleString()}</span> program bulundu
            {total > 0 && (
              <span className="text-gray-500">
                {' '}(Sayfa {page} / {totalPages})
              </span>
            )}
          </p>
          <div className="text-sm text-gray-500">
            Son {periods.length} dönem karşılaştırması • Sayfa başına {pageSize} program
          </div>
        </div>
      </div>

      {/* Table Container with proper scrolling */}
      <div className="overflow-x-auto max-w-full">
        <div className="min-w-full inline-block align-middle">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              {/* Main header row with grouped sections */}
              <tr>
                {/* Static columns */}
                <th rowSpan={2} className="px-2 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider text-left cursor-pointer hover:bg-gray-100 border-r border-gray-300" onClick={() => handleSort('hastaneAdi')}>
                  <div className="flex items-center space-x-1">
                    <span>Hastane/Kurum</span>
                    {sorting.find(s => s.id === 'hastaneAdi') ? (
                      sorting.find(s => s.id === 'hastaneAdi')?.desc ? (
                        <ChevronDownIcon className="h-3 w-3" />
                      ) : (
                        <ChevronUpIcon className="h-3 w-3" />
                      )
                    ) : (
                      <div className="h-3 w-3" />
                    )}
                  </div>
                </th>
                <th rowSpan={2} className="px-2 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider text-left cursor-pointer hover:bg-gray-100 border-r border-gray-300" onClick={() => handleSort('sehir')}>
                  <div className="flex items-center space-x-1">
                    <span>Şehir</span>
                    {sorting.find(s => s.id === 'sehir') ? (
                      sorting.find(s => s.id === 'sehir')?.desc ? (
                        <ChevronDownIcon className="h-3 w-3" />
                      ) : (
                        <ChevronUpIcon className="h-3 w-3" />
                      )
                    ) : (
                      <div className="h-3 w-3" />
                    )}
                  </div>
                </th>
                <th rowSpan={2} className="px-2 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider text-left cursor-pointer hover:bg-gray-100 border-r border-gray-300" onClick={() => handleSort('tip')}>
                  <div className="flex items-center space-x-1">
                    <span>Tip</span>
                    {sorting.find(s => s.id === 'tip') ? (
                      sorting.find(s => s.id === 'tip')?.desc ? (
                        <ChevronDownIcon className="h-3 w-3" />
                      ) : (
                        <ChevronUpIcon className="h-3 w-3" />
                      )
                    ) : (
                      <div className="h-3 w-3" />
                    )}
                  </div>
                </th>
                <th rowSpan={2} className="px-2 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider text-left cursor-pointer hover:bg-gray-100 border-r border-gray-300" onClick={() => handleSort('brans')}>
                  <div className="flex items-center space-x-1">
                    <span>Branş</span>
                    {sorting.find(s => s.id === 'brans') ? (
                      sorting.find(s => s.id === 'brans')?.desc ? (
                        <ChevronDownIcon className="h-3 w-3" />
                      ) : (
                        <ChevronUpIcon className="h-3 w-3" />
                      )
                    ) : (
                      <div className="h-3 w-3" />
                    )}
                  </div>
                </th>
                
                {/* Grouped period columns */}
                <th colSpan={periods.length} className="px-1 py-1 text-sm font-bold text-gray-900 bg-blue-100 text-center border-l border-r border-gray-400">
                  KONTENJAN
                </th>
                <th colSpan={periods.length} className="px-1 py-1 text-sm font-bold text-gray-900 bg-red-100 text-center border-l border-r border-gray-400">
                  TABAN PUAN
                </th>
                <th colSpan={periods.length} className="px-1 py-1 text-sm font-bold text-gray-900 bg-gray-100 text-center border-l border-r border-gray-400">
                  SIRALAMA
                </th>
              </tr>
              
              {/* Sub-header row with periods */}
              <tr>
                {/* Kontenjan periods */}
                {periods.map((period) => (
                  <th 
                    key={`kontenjan-${period}`} 
                    className="px-1 py-1 text-xs font-medium text-gray-700 bg-blue-50 text-center border-r border-gray-200 min-w-[60px] cursor-pointer hover:bg-blue-100"
                    onClick={() => handleSort(`kontenjan-${period}`)}
                  >
                    <div className="flex items-center justify-center space-x-1">
                      <span>{period}</span>
                      {sorting.find(s => s.id === `kontenjan-${period}`) ? (
                        sorting.find(s => s.id === `kontenjan-${period}`)?.desc ? (
                          <ChevronDownIcon className="h-3 w-3" />
                        ) : (
                          <ChevronUpIcon className="h-3 w-3" />
                        )
                      ) : (
                        <div className="h-3 w-3" />
                      )}
                    </div>
                  </th>
                ))}
                {/* Taban Puan periods */}
                {periods.map((period) => (
                  <th 
                    key={`puan-${period}`} 
                    className="px-1 py-1 text-xs font-medium text-gray-700 bg-red-50 text-center border-r border-gray-200 min-w-[60px] cursor-pointer hover:bg-red-100"
                    onClick={() => handleSort(`puan-${period}`)}
                  >
                    <div className="flex items-center justify-center space-x-1">
                      <span>{period}</span>
                      {sorting.find(s => s.id === `puan-${period}`) ? (
                        sorting.find(s => s.id === `puan-${period}`)?.desc ? (
                          <ChevronDownIcon className="h-3 w-3" />
                        ) : (
                          <ChevronUpIcon className="h-3 w-3" />
                        )
                      ) : (
                        <div className="h-3 w-3" />
                      )}
                    </div>
                  </th>
                ))}
                {/* Sıralama periods */}
                {periods.map((period) => (
                  <th 
                    key={`siralama-${period}`} 
                    className="px-1 py-1 text-xs font-medium text-gray-700 bg-gray-50 text-center border-r border-gray-200 min-w-[60px] cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort(`siralama-${period}`)}
                  >
                    <div className="flex items-center justify-center space-x-1">
                      <span>{period}</span>
                      {sorting.find(s => s.id === `siralama-${period}`) ? (
                        sorting.find(s => s.id === `siralama-${period}`)?.desc ? (
                          <ChevronDownIcon className="h-3 w-3" />
                        ) : (
                          <ChevronUpIcon className="h-3 w-3" />
                        )
                      ) : (
                        <div className="h-3 w-3" />
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50">
                  {row.getVisibleCells().map((cell) => {
                    const isPeriodColumn = cell.column.id.startsWith('kontenjan-') || cell.column.id.startsWith('puan-') || cell.column.id.startsWith('siralama-');
                    return (
                      <td 
                        key={cell.id} 
                        className={`px-1 py-2 whitespace-nowrap text-sm ${
                          isPeriodColumn ? 'bg-blue-25' : ''
                        }`}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-4 sm:px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-center">
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
              {renderPagination()}
            </nav>
          </div>
        </div>
      )}
    </div>
  );
}
