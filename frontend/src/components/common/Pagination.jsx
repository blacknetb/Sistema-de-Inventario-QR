import React, { useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { clsx } from 'clsx';
import "../../assets/styles/global.css";


// ✅ FUNCIÓN AUXILIAR OPTIMIZADA
const generatePageNumbers = (currentPage, totalPages, siblingCount = 1, boundaryCount = 1) => {
  if (totalPages <= 0 || totalPages > 1000) return [];
  if (currentPage < 1 || currentPage > totalPages) return [];

  const totalNumbers = (siblingCount * 2) + 3 + (boundaryCount * 2);

  if (totalPages <= totalNumbers) {
    return Array.from({ length: totalPages }, (_, i) => ({
      page: i + 1,
      type: 'page',
      key: `page-${i + 1}`
    }));
  }

  const startPages = Array.from({ length: Math.min(boundaryCount, totalPages) }, (_, i) => ({
    page: i + 1,
    type: 'page',
    key: `start-${i + 1}`
  }));

  const endPages = Array.from({ length: Math.min(boundaryCount, totalPages) }, (_, i) => ({
    page: totalPages - boundaryCount + i + 1,
    type: 'page',
    key: `end-${i + 1}`
  })).filter(item => item.page > 0);

  const leftSiblingIndex = Math.max(boundaryCount + 1, currentPage - siblingCount);
  const rightSiblingIndex = Math.min(
    totalPages - boundaryCount,
    currentPage + siblingCount
  );

  const middlePages = Array.from(
    { length: Math.max(0, rightSiblingIndex - leftSiblingIndex + 1) },
    (_, i) => ({
      page: leftSiblingIndex + i,
      type: 'page',
      key: `middle-${leftSiblingIndex + i}`
    })
  );

  const items = [...startPages];

  if (leftSiblingIndex > boundaryCount + 1) {
    items.push({
      page: 'ellipsis-start',
      type: 'ellipsis',
      key: 'ellipsis-start'
    });
  }

  items.push(...middlePages);

  if (rightSiblingIndex < totalPages - boundaryCount) {
    items.push({
      page: 'ellipsis-end',
      type: 'ellipsis',
      key: 'ellipsis-end'
    });
  }

  items.push(...endPages);

  const seen = new Set();
  return items
    .filter(item => {
      if (item.type === 'ellipsis') return true;
      const key = item.page;
      if (seen.has(key)) return false;
      seen.add(key);
      return item.page >= 1 && item.page <= totalPages;
    })
    .sort((a, b) => {
      if (a.type === 'ellipsis' && b.type === 'ellipsis') return 0;
      if (a.type === 'ellipsis') return 1;
      if (b.type === 'ellipsis') return -1;
      return a.page - b.page;
    });
};

// ✅ COMPONENTE SIMPLE
const SimplePagination = React.memo(({
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  labels = {},
  disabled = false,
  className = ''
}) => {
  const handlePrevious = useCallback(() => {
    if (!disabled && currentPage > 1 && onPageChange) {
      onPageChange(currentPage - 1);
    }
  }, [currentPage, disabled, onPageChange]);

  const handleNext = useCallback(() => {
    if (!disabled && currentPage < totalPages && onPageChange) {
      onPageChange(currentPage + 1);
    }
  }, [currentPage, totalPages, disabled, onPageChange]);

  if (totalPages < 1) return null;

  return (
    <div className={clsx(
      "pagination-simple",
      disabled && "pagination-disabled",
      className
    )}>
      <button
        onClick={handlePrevious}
        disabled={disabled || currentPage === 1}
        className={clsx(
          "pagination-simple-button",
          "pagination-simple-button-prev",
          (disabled || currentPage === 1) && "pagination-button-disabled"
        )}
        aria-label={labels.previous || 'Página anterior'}
        aria-disabled={disabled || currentPage === 1}
        type="button"
      >
        {labels.previous || '←'}
      </button>

      <span className="pagination-simple-text">
        {labels.page || 'Página'} <strong>{Math.min(currentPage, totalPages)}</strong> {labels.of || 'de'} {totalPages}
      </span>

      <button
        onClick={handleNext}
        disabled={disabled || currentPage === totalPages}
        className={clsx(
          "pagination-simple-button",
          "pagination-simple-button-next",
          (disabled || currentPage === totalPages) && "pagination-button-disabled"
        )}
        aria-label={labels.next || 'Página siguiente'}
        aria-disabled={disabled || currentPage === totalPages}
        type="button"
      >
        {labels.next || '→'}
      </button>
    </div>
  );
});

SimplePagination.propTypes = {
  currentPage: PropTypes.number,
  totalPages: PropTypes.number.isRequired,
  onPageChange: PropTypes.func.isRequired,
  labels: PropTypes.shape({
    previous: PropTypes.string,
    next: PropTypes.string,
    page: PropTypes.string,
    of: PropTypes.string
  }),
  disabled: PropTypes.bool,
  className: PropTypes.string
};

SimplePagination.defaultProps = {
  currentPage: 1,
  disabled: false
};

// ✅ COMPONENTE TABLE PAGINATION
const TablePagination = React.memo(({ className = '', ...props }) => {
  return (
    <SimplePagination
      className={clsx("pagination-table", className)}
      {...props}
    />
  );
});

TablePagination.propTypes = {
  className: PropTypes.string
};

// ✅ COMPONENTE PRINCIPAL
const Pagination = React.memo(({
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  pageSize = 10,
  onPageChange,
  onPageSizeChange,
  showPageSizeOptions = true,
  showTotal = true,
  showPageNumbers = true,
  siblingCount = 1,
  boundaryCount = 1,
  className = '',
  variant = 'default',
  labels = {
    previous: 'Anterior',
    next: 'Siguiente',
    showing: 'Mostrando',
    of: 'de',
    results: 'resultados',
    perPage: 'por página',
    firstPage: 'Primera página',
    lastPage: 'Última página',
    page: 'Página',
    goToPage: 'Ir a la página'
  },
  disabled = false,
  size = 'md',
  color = 'primary',
  ...props
}) => {
  if (totalPages <= 0 || totalPages > 10000) {
    return (
      <div className="pagination-error">
        <p>Error: Configuración de páginas inválida</p>
      </div>
    );
  }

  const normalizedCurrentPage = Math.max(1, Math.min(currentPage, totalPages));
  if (currentPage !== normalizedCurrentPage && onPageChange) {
    setTimeout(() => onPageChange(normalizedCurrentPage), 0);
  }

  const { startIndex, endIndex, hasItems } = useMemo(() => {
    if (totalItems <= 0 || pageSize <= 0) {
      return { startIndex: 0, endIndex: 0, hasItems: false };
    }

    const start = (normalizedCurrentPage - 1) * pageSize + 1;
    const end = Math.min(normalizedCurrentPage * pageSize, totalItems);
    return { 
      startIndex: start, 
      endIndex: end, 
      hasItems: totalItems > 0 
    };
  }, [normalizedCurrentPage, pageSize, totalItems]);

  const pageItems = useMemo(() => {
    return generatePageNumbers(
      normalizedCurrentPage, 
      totalPages, 
      siblingCount, 
      boundaryCount
    );
  }, [normalizedCurrentPage, totalPages, siblingCount, boundaryCount]);

  const handleFirstPage = useCallback(() => {
    if (!disabled && normalizedCurrentPage > 1 && onPageChange) {
      onPageChange(1);
    }
  }, [normalizedCurrentPage, disabled, onPageChange]);

  const handlePreviousPage = useCallback(() => {
    if (!disabled && normalizedCurrentPage > 1 && onPageChange) {
      onPageChange(normalizedCurrentPage - 1);
    }
  }, [normalizedCurrentPage, disabled, onPageChange]);

  const handleNextPage = useCallback(() => {
    if (!disabled && normalizedCurrentPage < totalPages && onPageChange) {
      onPageChange(normalizedCurrentPage + 1);
    }
  }, [normalizedCurrentPage, totalPages, disabled, onPageChange]);

  const handleLastPage = useCallback(() => {
    if (!disabled && normalizedCurrentPage < totalPages && onPageChange) {
      onPageChange(totalPages);
    }
  }, [normalizedCurrentPage, totalPages, disabled, onPageChange]);

  const handlePageClick = useCallback((page) => {
    if (!disabled && page >= 1 && page <= totalPages && onPageChange) {
      onPageChange(page);
    }
  }, [disabled, totalPages, onPageChange]);

  const handlePageSizeChange = useCallback((e) => {
    if (disabled) return;

    const newSize = parseInt(e.target.value, 10);
    if (isNaN(newSize) || newSize <= 0 || newSize > 1000) {
      return;
    }

    if (onPageSizeChange) {
      onPageSizeChange(newSize);
    }

    if (onPageChange && normalizedCurrentPage !== 1) {
      onPageChange(1);
    }
  }, [disabled, normalizedCurrentPage, onPageSizeChange, onPageChange]);

  if (variant === 'minimal') {
    return (
      <SimplePagination
        currentPage={normalizedCurrentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
        labels={labels}
        disabled={disabled}
        className={className}
        {...props}
      />
    );
  }

  if (variant === 'compact') {
    const handleCompactInputChange = useCallback((e) => {
      if (disabled || !onPageChange) return;

      const value = e.target.value.trim();
      if (value === '') return;

      const page = parseInt(value, 10);
      if (!isNaN(page) && page >= 1 && page <= totalPages) {
        onPageChange(page);
      }
    }, [disabled, totalPages, onPageChange]);

    const handleKeyPress = useCallback((e) => {
      if (e.key === 'Enter') {
        const page = parseInt(e.target.value, 10);
        if (!isNaN(page) && page >= 1 && page <= totalPages) {
          onPageChange(page);
        }
      }
    }, [totalPages, onPageChange]);

    return (
      <div
        className={clsx(
          'pagination-compact',
          disabled && 'pagination-disabled',
          className
        )}
        role="navigation"
        aria-label="Paginación compacta"
        {...props}
      >
        <button
          onClick={handlePreviousPage}
          disabled={disabled || normalizedCurrentPage === 1}
          className={clsx(
            'pagination-icon-button',
            'pagination-button-compact',
            (disabled || normalizedCurrentPage === 1) && 'pagination-button-disabled'
          )}
          aria-label={labels.previous}
          title={labels.previous}
          aria-disabled={disabled || normalizedCurrentPage === 1}
          type="button"
        >
          <svg
            className="pagination-icon"
            width="16"
            height="16"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </button>

        <div className="pagination-compact-input-group">
          <input
            type="number"
            min="1"
            max={totalPages}
            value={normalizedCurrentPage}
            onChange={handleCompactInputChange}
            onKeyPress={handleKeyPress}
            disabled={disabled}
            className={clsx(
              'pagination-compact-input',
              disabled && 'pagination-input-disabled'
            )}
            aria-label={labels.goToPage}
          />
          <span className="pagination-compact-total">
            / {totalPages}
          </span>
        </div>

        <button
          onClick={handleNextPage}
          disabled={disabled || normalizedCurrentPage === totalPages}
          className={clsx(
            'pagination-icon-button',
            'pagination-button-compact',
            (disabled || normalizedCurrentPage === totalPages) && 'pagination-button-disabled'
          )}
          aria-label={labels.next}
          title={labels.next}
          aria-disabled={disabled || normalizedCurrentPage === totalPages}
          type="button"
        >
          <svg
            className="pagination-icon"
            width="16"
            height="16"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <nav
      className={clsx(
        'pagination-default',
        `pagination-size-${size}`,
        disabled && 'pagination-disabled',
        className
      )}
      aria-label="Paginación"
      {...props}
    >
      {showTotal && hasItems && (
        <div className="pagination-total-info">
          <p className="pagination-total-text">
            {labels.showing} <span className="pagination-number">{startIndex}</span> {labels.of}{' '}
            <span className="pagination-number">{endIndex}</span> {labels.of}{' '}
            <span className="pagination-number">{totalItems}</span> {labels.results}
          </p>
        </div>
      )}

      <div className="pagination-controls">
        {showPageSizeOptions && (
          <div className="pagination-page-size">
            <label htmlFor="page-size" className="pagination-page-size-label">
              {labels.perPage}:
            </label>
            <select
              id="page-size"
              value={pageSize}
              onChange={handlePageSizeChange}
              disabled={disabled}
              className={clsx(
                'pagination-page-size-select',
                `pagination-select-${size}`,
                disabled && 'pagination-select-disabled'
              )}
              aria-label={`${labels.perPage}`}
            >
              {[5, 10, 25, 50, 100].map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        )}

        <nav className="pagination-nav" aria-label="Pagination navigation">
          <div className="pagination-nav-inner">
            <button
              onClick={handleFirstPage}
              disabled={disabled || normalizedCurrentPage === 1}
              className={clsx(
                'pagination-nav-button',
                'pagination-nav-button-first',
                (disabled || normalizedCurrentPage === 1) && 'pagination-button-disabled'
              )}
              aria-label={labels.firstPage}
              title={labels.firstPage}
              aria-disabled={disabled || normalizedCurrentPage === 1}
              type="button"
            >
              <svg
                className="pagination-nav-icon"
                width="16"
                height="16"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path fillRule="evenodd" d="M15.707 15.707a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 010 1.414zm-6 0a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 011.414 1.414L5.414 10l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
            </button>

            <button
              onClick={handlePreviousPage}
              disabled={disabled || normalizedCurrentPage === 1}
              className={clsx(
                'pagination-nav-button',
                'pagination-nav-button-prev',
                (disabled || normalizedCurrentPage === 1) && 'pagination-button-disabled'
              )}
              aria-label={labels.previous}
              aria-disabled={disabled || normalizedCurrentPage === 1}
              type="button"
            >
              <svg
                className="pagination-nav-icon"
                width="16"
                height="16"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </button>

            {showPageNumbers && (
              <ul className="pagination-numbers">
                {pageItems.map((item) => {
                  if (item.type === 'ellipsis') {
                    return (
                      <li key={item.key} className="pagination-ellipsis">
                        <span aria-hidden="true">…</span>
                      </li>
                    );
                  }

                  const isCurrent = item.page === normalizedCurrentPage;

                  return (
                    <li key={item.key}>
                      <button
                        onClick={() => handlePageClick(item.page)}
                        disabled={disabled}
                        className={clsx(
                          'pagination-page-button',
                          `pagination-page-button-${size}`,
                          isCurrent && 'pagination-page-current',
                          isCurrent && `pagination-page-${color}`,
                          disabled && 'pagination-button-disabled'
                        )}
                        aria-current={isCurrent ? 'page' : undefined}
                        aria-label={`${labels.page} ${item.page}`}
                        aria-disabled={disabled}
                        type="button"
                      >
                        {item.page}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}

            <button
              onClick={handleNextPage}
              disabled={disabled || normalizedCurrentPage === totalPages}
              className={clsx(
                'pagination-nav-button',
                'pagination-nav-button-next',
                (disabled || normalizedCurrentPage === totalPages) && 'pagination-button-disabled'
              )}
              aria-label={labels.next}
              aria-disabled={disabled || normalizedCurrentPage === totalPages}
              type="button"
            >
              <svg
                className="pagination-nav-icon"
                width="16"
                height="16"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </button>

            <button
              onClick={handleLastPage}
              disabled={disabled || normalizedCurrentPage === totalPages}
              className={clsx(
                'pagination-nav-button',
                'pagination-nav-button-last',
                (disabled || normalizedCurrentPage === totalPages) && 'pagination-button-disabled'
              )}
              aria-label={labels.lastPage}
              title={labels.lastPage}
              aria-disabled={disabled || normalizedCurrentPage === totalPages}
              type="button"
            >
              <svg
                className="pagination-nav-icon"
                width="16"
                height="16"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path fillRule="evenodd" d="M10.293 15.707a1 1 0 010-1.414L14.586 10l-4.293-4.293a1 1 0 111.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0z" clipRule="evenodd" />
                <path fillRule="evenodd" d="M4.293 15.707a1 1 0 010-1.414L8.586 10 4.293 5.707a1 1 0 011.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </nav>
      </div>
    </nav>
  );
});

Pagination.propTypes = {
  currentPage: PropTypes.number,
  totalPages: PropTypes.number.isRequired,
  totalItems: PropTypes.number,
  pageSize: PropTypes.number,
  onPageChange: PropTypes.func.isRequired,
  onPageSizeChange: PropTypes.func,
  showPageSizeOptions: PropTypes.bool,
  showTotal: PropTypes.bool,
  showPageNumbers: PropTypes.bool,
  siblingCount: PropTypes.number,
  boundaryCount: PropTypes.number,
  className: PropTypes.string,
  variant: PropTypes.oneOf(['default', 'minimal', 'compact']),
  labels: PropTypes.shape({
    previous: PropTypes.string,
    next: PropTypes.string,
    showing: PropTypes.string,
    of: PropTypes.string,
    results: PropTypes.string,
    perPage: PropTypes.string,
    firstPage: PropTypes.string,
    lastPage: PropTypes.string,
    page: PropTypes.string,
    goToPage: PropTypes.string
  }),
  disabled: PropTypes.bool,
  size: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl']),
  color: PropTypes.oneOf(['primary', 'secondary', 'success', 'warning', 'danger'])
};

Pagination.defaultProps = {
  currentPage: 1,
  totalPages: 1,
  totalItems: 0,
  pageSize: 10,
  showPageSizeOptions: true,
  showTotal: true,
  showPageNumbers: true,
  siblingCount: 1,
  boundaryCount: 1,
  variant: 'default',
  disabled: false,
  size: 'md',
  color: 'primary'
};

Pagination.Simple = SimplePagination;
Pagination.Table = TablePagination;
Pagination.displayName = 'Pagination';

export default Pagination;