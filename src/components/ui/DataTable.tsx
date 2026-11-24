'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Filter,
  X,
  Inbox,
} from 'lucide-react';
import Papa from 'papaparse';

export interface Column<T> {
  header: string;
  accessorKey?: keyof T;
  sortable?: boolean;
  className?: string;
  cell?: (item: T) => React.ReactNode;
}

export interface FilterOption {
  label: string;
  value: string;
}

export interface TableFilter<T> {
  id: string;
  label: string;
  key: keyof T;
  options: FilterOption[];
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  searchPlaceholder?: string;
  searchKey?: keyof T | ((item: T) => string);
  filters?: TableFilter<T>[];
  pageSize?: number;
  exportFileName?: string;
  emptyState?: {
    title: string;
    description: string;
    actionLabel?: string;
    onAction?: () => void;
  };
  bulkActions?: {
    label: string;
    icon?: React.ReactNode;
    variant?: 'primary' | 'danger' | 'secondary';
    onClick: (selected: T[]) => void;
  }[];
  onRowClick?: (item: T) => void;
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  searchPlaceholder = 'Search...',
  searchKey,
  filters = [],
  pageSize = 10,
  exportFileName = 'export-data',
  emptyState,
  bulkActions = [],
  onRowClick,
}: DataTableProps<T>) {
  const [search, setSearch] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string>>({});
  const [sortConfig, setSortConfig] = useState<{
    key: keyof T | null;
    direction: 'asc' | 'desc';
  }>({ key: null, direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<any>>(new Set());

  // Handle Filter Change
  const handleFilterChange = (filterId: string, value: string) => {
    setSelectedFilters((prev) => {
      const next = { ...prev };
      if (value === 'ALL' || !value) {
        delete next[filterId];
      } else {
        next[filterId] = value;
      }
      return next;
    });
    setCurrentPage(1);
  };

  // Filter & Search Logic
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      // 1. Search Query
      if (search.trim()) {
        const query = search.toLowerCase();
        if (typeof searchKey === 'function') {
          if (!searchKey(item).toLowerCase().includes(query)) return false;
        } else if (searchKey) {
          const val = String(item[searchKey] || '').toLowerCase();
          if (!val.includes(query)) return false;
        } else {
          // Default search all string fields
          const matched = Object.values(item).some((v) =>
            String(v).toLowerCase().includes(query)
          );
          if (!matched) return false;
        }
      }

      // 2. Dropdown Filters
      for (const [filterId, selectedVal] of Object.entries(selectedFilters)) {
        const filterDef = filters.find((f) => f.id === filterId);
        if (filterDef) {
          const itemVal = String(item[filterDef.key]);
          if (itemVal !== selectedVal) return false;
        }
      }

      return true;
    });
  }, [data, search, searchKey, selectedFilters, filters]);

  // Sorting Logic
  const sortedData = useMemo(() => {
    if (!sortConfig.key) return filteredData;
    return [...filteredData].sort((a, b) => {
      const aVal = a[sortConfig.key!];
      const bVal = b[sortConfig.key!];
      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
      }
      const strA = String(aVal).toLowerCase();
      const strB = String(bVal).toLowerCase();
      return sortConfig.direction === 'asc'
        ? strA.localeCompare(strB)
        : strB.localeCompare(strA);
    });
  }, [filteredData, sortConfig]);

  // Pagination
  const totalPages = Math.ceil(sortedData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const handleSort = (key?: keyof T) => {
    if (!key) return;
    setSortConfig((prev) => {
      if (prev.key === key) {
        return {
          key,
          direction: prev.direction === 'asc' ? 'desc' : 'asc',
        };
      }
      return { key, direction: 'asc' };
    });
  };

  // Bulk Selection Logic
  const allCurrentSelected =
    paginatedData.length > 0 &&
    paginatedData.every((item) => selectedIds.has(item.id || item));

  const toggleSelectAll = () => {
    const next = new Set(selectedIds);
    if (allCurrentSelected) {
      paginatedData.forEach((item) => next.delete(item.id || item));
    } else {
      paginatedData.forEach((item) => next.add(item.id || item));
    }
    setSelectedIds(next);
  };

  const toggleSelectItem = (item: T, e: React.MouseEvent) => {
    e.stopPropagation();
    const id = item.id || item;
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  // Export CSV
  const handleExportCsv = () => {
    const exportRows = sortedData.map((item) => {
      const row: Record<string, any> = {};
      columns.forEach((col) => {
        if (col.accessorKey) {
          row[col.header] = item[col.accessorKey];
        }
      });
      return row;
    });
    const csv = Papa.unparse(exportRows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${exportFileName}-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const selectedList = useMemo(() => {
    return data.filter((item) => selectedIds.has(item.id || item));
  }, [data, selectedIds]);

  return (
    <div className="space-y-4">
      {/* Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder={searchPlaceholder}
            className="w-full pl-9 pr-8 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition placeholder:text-slate-400 shadow-sm"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filters and Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {filters.map((f) => (
            <div key={f.id} className="relative">
              <select
                value={selectedFilters[f.id] || 'ALL'}
                onChange={(e) => handleFilterChange(f.id, e.target.value)}
                className="text-xs font-semibold bg-white border border-slate-200 text-slate-700 rounded-xl px-3 py-2 pr-7 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm appearance-none cursor-pointer"
              >
                <option value="ALL">All {f.label}</option>
                {f.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          ))}

          {/* Export CSV Button */}
          <button
            onClick={handleExportCsv}
            title="Export CSV"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl shadow-sm transition"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Bulk Action Bar (when rows are selected) */}
      {selectedIds.size > 0 && bulkActions.length > 0 && (
        <div className="flex items-center justify-between px-4 py-2.5 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-xs">
          <span className="font-semibold">
            {selectedIds.size} {selectedIds.size === 1 ? 'item' : 'items'} selected
          </span>
          <div className="flex items-center gap-2">
            {bulkActions.map((action, i) => (
              <button
                key={i}
                onClick={() => action.onClick(selectedList)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-semibold transition ${
                  action.variant === 'danger'
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : action.variant === 'primary'
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-white border border-blue-300 text-blue-800 hover:bg-blue-100'
                }`}
              >
                {action.icon}
                <span>{action.label}</span>
              </button>
            ))}
            <button
              onClick={() => setSelectedIds(new Set())}
              className="text-slate-500 hover:text-slate-800 px-2 py-1"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Main Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50/75 border-b border-slate-200 text-xs uppercase font-bold text-slate-500 tracking-wider">
              <tr>
                {bulkActions.length > 0 && (
                  <th className="p-4 w-10">
                    <input
                      type="checkbox"
                      checked={allCurrentSelected}
                      onChange={toggleSelectAll}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  </th>
                )}
                {columns.map((col, idx) => (
                  <th
                    key={idx}
                    className={`p-4 font-semibold text-slate-600 select-none ${col.className || ''}`}
                    onClick={() => col.sortable && handleSort(col.accessorKey)}
                  >
                    <div
                      className={`flex items-center gap-1.5 ${
                        col.sortable ? 'cursor-pointer hover:text-slate-900' : ''
                      }`}
                    >
                      <span>{col.header}</span>
                      {col.sortable && (
                        <span className="text-slate-400">
                          {sortConfig.key === col.accessorKey ? (
                            sortConfig.direction === 'asc' ? (
                              <ChevronUp className="w-3.5 h-3.5 text-blue-600" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5 text-blue-600" />
                            )
                          ) : (
                            <ChevronsUpDown className="w-3.5 h-3.5" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedData.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length + (bulkActions.length > 0 ? 1 : 0)}
                    className="p-12 text-center"
                  >
                    <div className="flex flex-col items-center justify-center max-w-sm mx-auto text-slate-500">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
                        <Inbox className="w-6 h-6" />
                      </div>
                      <div className="font-semibold text-slate-800 text-base">
                        {emptyState?.title || 'No data found'}
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        {emptyState?.description || 'Try adjusting your search or filters.'}
                      </p>
                      {emptyState?.actionLabel && emptyState.onAction && (
                        <button
                          onClick={emptyState.onAction}
                          className="mt-4 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-700 transition shadow-sm"
                        >
                          {emptyState.actionLabel}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedData.map((item, rowIdx) => {
                  const id = item.id || item;
                  const isSelected = selectedIds.has(id);
                  return (
                    <tr
                      key={rowIdx}
                      onClick={() => onRowClick && onRowClick(item)}
                      className={`hover:bg-slate-50/75 transition ${
                        onRowClick ? 'cursor-pointer' : ''
                      } ${isSelected ? 'bg-blue-50/40' : ''}`}
                    >
                      {bulkActions.length > 0 && (
                        <td className="p-4 w-10">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onClick={(e) => toggleSelectItem(item, e)}
                            onChange={() => {}}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                        </td>
                      )}
                      {columns.map((col, colIdx) => (
                        <td key={colIdx} className={`p-4 ${col.className || ''}`}>
                          {col.cell
                            ? col.cell(item)
                            : col.accessorKey
                            ? String(item[col.accessorKey] ?? '—')
                            : '—'}
                        </td>
                      ))}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {sortedData.length > 0 && (
          <div className="px-4 py-3 bg-slate-50/50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
            <div>
              Showing{' '}
              <span className="font-semibold text-slate-800">
                {(currentPage - 1) * pageSize + 1}
              </span>{' '}
              to{' '}
              <span className="font-semibold text-slate-800">
                {Math.min(currentPage * pageSize, sortedData.length)}
              </span>{' '}
              of <span className="font-semibold text-slate-800">{sortedData.length}</span>{' '}
              entries
            </div>

            <div className="flex items-center gap-1.5 self-end sm:self-auto">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="px-2 font-medium text-slate-700">
                Page {currentPage} of {totalPages}
              </div>

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
