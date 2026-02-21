import React from 'react';
import styles from './Pagination.module.css';

const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  siblingCount = 1,
  showFirstLast = true,
  showPrevNext = true,
  size = 'medium'
}) => {
  const range = (start, end) => {
    let length = end - start + 1;
    return Array.from({ length }, (_, i) => start + i);
  };

  const getPageNumbers = () => {
    const totalNumbers = siblingCount * 2 + 3;
    const totalBlocks = totalNumbers + 2;

    if (totalPages > totalBlocks) {
      const startPage = Math.max(2, currentPage - siblingCount);
      const endPage = Math.min(totalPages - 1, currentPage + siblingCount);

      let pages = range(startPage, endPage);

      const hasLeftSpill = startPage > 2;
      const hasRightSpill = totalPages - endPage > 1;
      const spillOffset = totalNumbers - (pages.length + 1);

      switch (true) {
        case hasLeftSpill && !hasRightSpill: {
          const extraPages = range(startPage - spillOffset, startPage - 1);
          pages = ['...', ...extraPages, ...pages];
          break;
        }
        case !hasLeftSpill && hasRightSpill: {
          const extraPages = range(endPage + 1, endPage + spillOffset);
          pages = [...pages, ...extraPages, '...'];
          break;
        }
        case hasLeftSpill && hasRightSpill:
        default: {
          pages = ['...', ...pages, '...'];
          break;
        }
      }

      return [1, ...pages, totalPages];
    }

    return range(1, totalPages);
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className={`${styles.pagination} ${styles[size]}`}>
      {showFirstLast && (
        <button
          className={styles.pageButton}
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
        >
          «
        </button>
      )}
      
      {showPrevNext && (
        <button
          className={styles.pageButton}
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          ‹
        </button>
      )}
      
      {pageNumbers.map((pageNumber, index) => (
        <button
          key={index}
          className={`${styles.pageButton} ${
            pageNumber === currentPage ? styles.active : ''
          } ${pageNumber === '...' ? styles.dots : ''}`}
          onClick={() => pageNumber !== '...' && onPageChange(pageNumber)}
          disabled={pageNumber === '...'}
        >
          {pageNumber}
        </button>
      ))}
      
      {showPrevNext && (
        <button
          className={styles.pageButton}
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          ›
        </button>
      )}
      
      {showFirstLast && (
        <button
          className={styles.pageButton}
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
        >
          »
        </button>
      )}
    </div>
  );
};

export default Pagination;