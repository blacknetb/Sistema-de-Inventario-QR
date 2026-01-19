import React from 'react';
import PropTypes from 'prop-types';
import '../../assets/styles/Common/common.css';

const Pagination = ({
    currentPage,
    totalPages,
    onPageChange,
    showPageNumbers = true,
    showFirstLast = true,
    showPrevNext = true,
    showPageInfo = true,
    showPageSize = true,
    pageSize,
    pageSizeOptions = [10, 25, 50, 100],
    onPageSizeChange,
    className = '',
    disabled = false
}) => {
    // Calcular páginas a mostrar
    const getPageNumbers = () => {
        const delta = 2;
        const range = [];
        const rangeWithDots = [];
        let l;

        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
                range.push(i);
            }
        }

        range.forEach((i) => {
            if (l) {
                if (i - l === 2) {
                    rangeWithDots.push(l + 1);
                } else if (i - l !== 1) {
                    rangeWithDots.push('...');
                }
            }
            rangeWithDots.push(i);
            l = i;
        });

        return rangeWithDots;
    };

    const handlePageChange = (page) => {
        if (page < 1 || page > totalPages || page === currentPage || disabled) return;
        onPageChange(page);
    };

    const pageNumbers = getPageNumbers();

    if (totalPages <= 1) return null;

    return (
        <div className={`pagination ${className} ${disabled ? 'disabled' : ''}`}>
            {/* Información de página */}
            {showPageInfo && (
                <div className="pagination-info">
                    Mostrando página {currentPage} de {totalPages}
                </div>
            )}

            {/* Selector de tamaño de página */}
            {showPageSize && onPageSizeChange && (
                <div className="page-size-selector">
                    <span>Mostrar:</span>
                    <select
                        value={pageSize}
                        onChange={(e) => onPageSizeChange(parseInt(e.target.value))}
                        disabled={disabled}
                    >
                        {pageSizeOptions.map(size => (
                            <option key={size} value={size}>
                                {size} por página
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {/* Controles de paginación */}
            <nav className="pagination-nav" aria-label="Paginación">
                <ul className="pagination-list">
                    {/* Primera página */}
                    {showFirstLast && (
                        <li className="pagination-item">
                            <button
                                className={`pagination-link ${currentPage === 1 || disabled ? 'disabled' : ''}`}
                                onClick={() => handlePageChange(1)}
                                disabled={currentPage === 1 || disabled}
                                aria-label="Ir a la primera página"
                            >
                                <i className="fas fa-angle-double-left"></i>
                            </button>
                        </li>
                    )}

                    {/* Página anterior */}
                    {showPrevNext && (
                        <li className="pagination-item">
                            <button
                                className={`pagination-link ${currentPage === 1 || disabled ? 'disabled' : ''}`}
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1 || disabled}
                                aria-label="Ir a la página anterior"
                            >
                                <i className="fas fa-angle-left"></i>
                            </button>
                        </li>
                    )}

                    {/* Números de página */}
                    {showPageNumbers && pageNumbers.map((page, index) => (
                        <li key={index} className="pagination-item">
                            {page === '...' ? (
                                <span className="pagination-ellipsis">...</span>
                            ) : (
                                <button
                                    className={`pagination-link ${page === currentPage ? 'active' : ''}`}
                                    onClick={() => handlePageChange(page)}
                                    disabled={disabled}
                                    aria-label={`Ir a la página ${page}`}
                                    aria-current={page === currentPage ? 'page' : undefined}
                                >
                                    {page}
                                </button>
                            )}
                        </li>
                    ))}

                    {/* Página siguiente */}
                    {showPrevNext && (
                        <li className="pagination-item">
                            <button
                                className={`pagination-link ${currentPage === totalPages || disabled ? 'disabled' : ''}`}
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages || disabled}
                                aria-label="Ir a la página siguiente"
                            >
                                <i className="fas fa-angle-right"></i>
                            </button>
                        </li>
                    )}

                    {/* Última página */}
                    {showFirstLast && (
                        <li className="pagination-item">
                            <button
                                className={`pagination-link ${currentPage === totalPages || disabled ? 'disabled' : ''}`}
                                onClick={() => handlePageChange(totalPages)}
                                disabled={currentPage === totalPages || disabled}
                                aria-label="Ir a la última página"
                            >
                                <i className="fas fa-angle-double-right"></i>
                            </button>
                        </li>
                    )}
                </ul>
            </nav>

            {/* Input para ir a página específica */}
            <div className="goto-page">
                <span>Ir a:</span>
                <input
                    type="number"
                    min="1"
                    max={totalPages}
                    value={currentPage}
                    onChange={(e) => {
                        const page = parseInt(e.target.value);
                        if (page >= 1 && page <= totalPages) {
                            handlePageChange(page);
                        }
                    }}
                    disabled={disabled}
                    className="goto-input"
                />
            </div>
        </div>
    );
};

Pagination.propTypes = {
    currentPage: PropTypes.number.isRequired,
    totalPages: PropTypes.number.isRequired,
    onPageChange: PropTypes.func.isRequired,
    showPageNumbers: PropTypes.bool,
    showFirstLast: PropTypes.bool,
    showPrevNext: PropTypes.bool,
    showPageInfo: PropTypes.bool,
    showPageSize: PropTypes.bool,
    pageSize: PropTypes.number,
    pageSizeOptions: PropTypes.arrayOf(PropTypes.number),
    onPageSizeChange: PropTypes.func,
    className: PropTypes.string,
    disabled: PropTypes.bool
};

export default Pagination;