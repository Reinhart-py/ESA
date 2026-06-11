import React, { useState, useMemo } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown, Search, ChevronLeft, ChevronRight } from 'lucide-react';

interface Column<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  render?: (row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  searchPlaceholder?: string;
  searchKey?: keyof T | string;
  pageSize?: number;
}

export default function DataTable<T extends Record<string, any>>({
  columns,
  data,
  searchPlaceholder = 'Search records...',
  searchKey,
  pageSize = 10
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Sorting Handler
  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Process data (Filter -> Sort -> Paginate)
  const processedData = useMemo(() => {
    let result = [...data];

    // 1. Search Filter
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      result = result.filter(row => {
        if (searchKey) {
          const val = row[searchKey as string];
          return val ? String(val).toLowerCase().includes(query) : false;
        }
        // General search across all keys if no searchKey specified
        return Object.values(row).some(val => 
          val ? String(val).toLowerCase().includes(query) : false
        );
      });
    }

    // 2. Sorting
    if (sortConfig) {
      const { key, direction } = sortConfig;
      result.sort((a, b) => {
        const aVal = a[key];
        const bVal = b[key];

        if (aVal === undefined || aVal === null) return 1;
        if (bVal === undefined || bVal === null) return -1;

        if (typeof aVal === 'string' && typeof bVal === 'string') {
          return direction === 'asc' 
            ? aVal.localeCompare(bVal) 
            : bVal.localeCompare(aVal);
        }

        if (aVal < bVal) return direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [data, searchQuery, sortConfig, searchKey]);

  // Pagination calculations
  const totalPages = Math.ceil(processedData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return processedData.slice(start, start + pageSize);
  }, [processedData, currentPage, pageSize]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
      {/* Search Input */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'var(--surface-color)', padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid var(--card-border)', maxWidth: '320px' }}>
        <Search size={16} style={{ color: 'var(--text-muted)' }} />
        <input
          type="text"
          placeholder={searchPlaceholder}
          value={searchQuery}
          onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
          style={{ background: 'none', border: 'none', color: 'var(--text-primary)', fontSize: '0.85rem', outline: 'none', width: '100%' }}
        />
      </div>

      {/* Table Container */}
      <div style={{ overflowX: 'auto', background: 'var(--card-bg)', borderRadius: '12px', border: '1px solid var(--card-border)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--card-border)', color: 'var(--text-muted)', background: 'var(--surface-color)' }}>
              {columns.map(col => (
                <th 
                  key={col.key as string}
                  onClick={() => col.sortable !== false && handleSort(col.key as string)}
                  style={{ 
                    padding: '1rem', 
                    cursor: col.sortable !== false ? 'pointer' : 'default',
                    userSelect: 'none',
                    fontWeight: 'bold'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    {col.label}
                    {col.sortable !== false && (
                      sortConfig?.key === col.key ? (
                        sortConfig.direction === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                      ) : <ArrowUpDown size={14} style={{ opacity: 0.4 }} />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No matching records found.
                </td>
              </tr>
            ) : (
              paginatedData.map((row, idx) => (
                <tr 
                  key={row.id || idx} 
                  style={{ 
                    borderBottom: '1px solid var(--card-border)', 
                    color: 'var(--text-sec)',
                    transition: 'background-color 0.15s ease',
                  }}
                  className="table-row-hover"
                >
                  {columns.map(col => (
                    <td key={col.key as string} style={{ padding: '0.9rem 1rem' }}>
                      {col.render ? col.render(row) : row[col.key as string]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controller */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Showing Page <strong>{currentPage}</strong> of {totalPages} ({processedData.length} records)
          </span>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '32px',
                height: '32px',
                borderRadius: '6px',
                background: 'var(--surface-color)',
                border: '1px solid var(--card-border)',
                color: currentPage === 1 ? 'var(--text-muted)' : 'var(--text-primary)',
                cursor: currentPage === 1 ? 'default' : 'pointer'
              }}
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '32px',
                height: '32px',
                borderRadius: '6px',
                background: 'var(--surface-color)',
                border: '1px solid var(--card-border)',
                color: currentPage === totalPages ? 'var(--text-muted)' : 'var(--text-primary)',
                cursor: currentPage === totalPages ? 'default' : 'pointer'
              }}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
