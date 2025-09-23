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

export interface SearchResult {
  id: number;
  kurumKodu: number;
  hastaneAdi: string;
  sehir: string;
  tip: string;
  kurumTipi: string;
  brans: string;
  donem: string;
  kademe: string;
  kontenjan: number;
  yerlesen: number | null; // can be null for 2025/2
  tabanPuan: number | null;
  tavanPuan: number | null;
  tabanSiralamasi: number | null;
}

interface DataTableProps {
  data: SearchResult[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onSort: (field: string, direction: 'asc' | 'desc') => void;
  isLoading?: boolean;
}

const columnHelper = createColumnHelper<SearchResult>();

export function DataTable({
  data,
  total,
  page,
  pageSize,
  totalPages,
  onPageChange,
  onSort,
  isLoading = false,
}: DataTableProps) {
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
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          {info.getValue()}
        </span>
      ),
    }),
    columnHelper.accessor('tip', {
      header: 'Tip',
      cell: (info) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
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
        <div className="min-w-[120px]">
          <div className="font-medium text-gray-900">{info.getValue()}</div>
          <div className="text-sm text-gray-500">{info.row.original.kademe}</div>
        </div>
      ),
    }),
    columnHelper.accessor('donem', {
      header: 'Dönem',
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor('kontenjan', {
      header: 'Kontenjan',
      cell: (info) => (
        <div className="text-center">
          <div className="font-medium">{info.getValue()}</div>
          <div className="text-xs text-gray-500">
            Yerleşen: {info.row.original.yerlesen !== null ? info.row.original.yerlesen : '--'}
          </div>
        </div>
      ),
    }),
    columnHelper.accessor('tabanPuan', {
      header: 'Taban Puan',
      cell: (info) => {
        const value = info.getValue();
        return value ? (
          <div className="text-center">
            <div className="font-medium text-red-600">{value.toFixed(2)}</div>
            {info.row.original.tabanSiralamasi && (
              <div className="text-xs text-gray-500">
                Sıra: {info.row.original.tabanSiralamasi.toLocaleString()}
              </div>
            )}
          </div>
        ) : (
          <span className="text-gray-400">--</span>
        );
      },
    }),
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
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-700">
            Toplam <span className="font-medium">{total.toLocaleString()}</span> kayıt bulundu
            {total > 0 && (
              <span className="text-gray-500">
                {' '}(Sayfa {page} / {totalPages})
              </span>
            )}
          </p>
          <div className="text-sm text-gray-500">
            Sayfa başına {pageSize} kayıt gösteriliyor
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort(header.id)}
                  >
                    <div className="flex items-center space-x-1">
                      <span>
                        {flexRender(header.column.columnDef.header, header.getContext())}
                      </span>
                      {sorting.find(s => s.id === header.id) ? (
                        sorting.find(s => s.id === header.id)?.desc ? (
                          <ChevronDownIcon className="h-4 w-4" />
                        ) : (
                          <ChevronUpIcon className="h-4 w-4" />
                        )
                      ) : (
                        <div className="h-4 w-4" />
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-6 py-4 whitespace-nowrap">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
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
