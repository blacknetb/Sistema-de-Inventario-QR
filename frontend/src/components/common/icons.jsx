import React from 'react';
import PropTypes from 'prop-types';

/**
 * ✅ PROPIEDADES COMUNES PARA TODOS LOS ICONOS
 * Sistema consistente de props para todos los componentes
 */
const iconCommonProps = {
  size: 24,
  color: 'currentColor',
  strokeWidth: 2,
  className: '',
  style: {},
  onClick: undefined,
  title: '',
  ariaLabel: '',
};

/**
 * ✅ COMPONENTE BASE PARA ICONOS
 * Wrapper optimizado con memoización
 */
const IconWrapper = React.memo(({
  children,
  size = iconCommonProps.size,
  color = iconCommonProps.color,
  strokeWidth = iconCommonProps.strokeWidth,
  className = iconCommonProps.className,
  style = iconCommonProps.style,
  onClick = iconCommonProps.onClick,
  title = iconCommonProps.title,
  ariaLabel = iconCommonProps.ariaLabel,
  viewBox = '0 0 24 24',
  fill = 'none',
  stroke = 'currentColor',
  ...props
}) => {
  const iconStyles = {
    width: size,
    height: size,
    color: color,
    verticalAlign: 'middle',
    flexShrink: 0,
    ...style,
  };

  const ariaProps = {
    'aria-label': ariaLabel || title,
    'aria-hidden': !ariaLabel && !title,
    role: ariaLabel || title ? 'img' : 'presentation',
  };

  const handleClick = React.useCallback((event) => {
    if (onClick && typeof onClick === 'function') {
      onClick(event);
    }
  }, [onClick]);

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={viewBox}
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`icon ${className}`}
      style={iconStyles}
      onClick={handleClick}
      title={title}
      {...ariaProps}
      {...props}
    >
      {children}
    </svg>
  );
});

IconWrapper.propTypes = {
  children: PropTypes.node,
  size: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  color: PropTypes.string,
  strokeWidth: PropTypes.number,
  className: PropTypes.string,
  style: PropTypes.object,
  onClick: PropTypes.func,
  title: PropTypes.string,
  ariaLabel: PropTypes.string,
  viewBox: PropTypes.string,
  fill: PropTypes.string,
  stroke: PropTypes.string,
};

IconWrapper.displayName = 'IconWrapper';

/**
 * ✅ ICONOS DE NAVEGACIÓN Y ACCIONES PRINCIPALES
 */

export const HomeIcon = React.memo((props) => (
  <IconWrapper {...props}>
    <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </IconWrapper>
));
HomeIcon.displayName = 'HomeIcon';

export const InventoryIcon = React.memo((props) => (
  <IconWrapper {...props}>
    <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
  </IconWrapper>
));
InventoryIcon.displayName = 'InventoryIcon';

export const QRScannerIcon = React.memo((props) => (
  <IconWrapper {...props} viewBox="0 0 28 28">
    <rect x="4" y="4" width="8" height="8" rx="2" />
    <rect x="16" y="4" width="8" height="8" rx="2" />
    <rect x="4" y="16" width="8" height="8" rx="2" />
    <rect x="16" y="16" width="8" height="8" rx="2" />
    <line x1="12" y1="8" x2="12" y2="16" />
    <line x1="16" y1="12" x2="8" y2="12" />
  </IconWrapper>
));
QRScannerIcon.displayName = 'QRScannerIcon';

export const ReportIcon = React.memo((props) => (
  <IconWrapper {...props}>
    <path d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </IconWrapper>
));
ReportIcon.displayName = 'ReportIcon';

export const SettingsIcon = React.memo((props) => (
  <IconWrapper {...props}>
    <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </IconWrapper>
));
SettingsIcon.displayName = 'SettingsIcon';

/**
 * ✅ ICONOS DE ACCIONES CRUD (CREATE, READ, UPDATE, DELETE)
 */

export const AddIcon = React.memo((props) => (
  <IconWrapper {...props}>
    <path d="M12 4v16m8-8H4" />
  </IconWrapper>
));
AddIcon.displayName = 'AddIcon';

export const EditIcon = React.memo((props) => (
  <IconWrapper {...props}>
    <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </IconWrapper>
));
EditIcon.displayName = 'EditIcon';

export const DeleteIcon = React.memo((props) => (
  <IconWrapper {...props}>
    <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </IconWrapper>
));
DeleteIcon.displayName = 'DeleteIcon';

export const ViewIcon = React.memo((props) => (
  <IconWrapper {...props}>
    <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </IconWrapper>
));
ViewIcon.displayName = 'ViewIcon';

export const SearchIcon = React.memo((props) => (
  <IconWrapper {...props}>
    <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </IconWrapper>
));
SearchIcon.displayName = 'SearchIcon';

export const FilterIcon = React.memo((props) => (
  <IconWrapper {...props}>
    <path d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
  </IconWrapper>
));
FilterIcon.displayName = 'FilterIcon';

export const DownloadIcon = React.memo((props) => (
  <IconWrapper {...props}>
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
    <path d="M7 10l5 5 5-5" />
    <path d="M12 15V3" />
  </IconWrapper>
));
DownloadIcon.displayName = 'DownloadIcon';

export const UploadIcon = React.memo((props) => (
  <IconWrapper {...props}>
    <path d="M4 16v4a2 2 0 002 2h12a2 2 0 002-2v-4" />
    <path d="M7 10l5-5 5 5" />
    <path d="M12 15V4" />
  </IconWrapper>
));
UploadIcon.displayName = 'UploadIcon';

export const PrintIcon = React.memo((props) => (
  <IconWrapper {...props}>
    <path d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2z" />
  </IconWrapper>
));
PrintIcon.displayName = 'PrintIcon';

/**
 * ✅ ICONOS DE ESTADO Y NOTIFICACIONES
 */

export const CheckCircleIcon = React.memo((props) => (
  <IconWrapper {...props} fill="currentColor">
    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </IconWrapper>
));
CheckCircleIcon.displayName = 'CheckCircleIcon';

export const WarningIcon = React.memo((props) => (
  <IconWrapper {...props} fill="currentColor">
    <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.998-.833-2.732 0L4.346 16.5c-.77.833.192 2.5 1.732 2.5z" />
  </IconWrapper>
));
WarningIcon.displayName = 'WarningIcon';

export const ErrorIcon = React.memo((props) => (
  <IconWrapper {...props} fill="currentColor">
    <path d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </IconWrapper>
));
ErrorIcon.displayName = 'ErrorIcon';

export const InfoIcon = React.memo((props) => (
  <IconWrapper {...props} fill="currentColor">
    <path d="M13 16h-1v-4h1m0-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </IconWrapper>
));
InfoIcon.displayName = 'InfoIcon';

export const SuccessIcon = React.memo((props) => (
  <IconWrapper {...props} fill="currentColor">
    <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </IconWrapper>
));
SuccessIcon.displayName = 'SuccessIcon';

/**
 * ✅ ICONOS DE USUARIO Y AUTENTICACIÓN
 */

export const UserIcon = React.memo((props) => (
  <IconWrapper {...props}>
    <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </IconWrapper>
));
UserIcon.displayName = 'UserIcon';

export const LoginIcon = React.memo((props) => (
  <IconWrapper {...props}>
    <path d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
  </IconWrapper>
));
LoginIcon.displayName = 'LoginIcon';

export const LogoutIcon = React.memo((props) => (
  <IconWrapper {...props}>
    <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </IconWrapper>
));
LogoutIcon.displayName = 'LogoutIcon';

export const LockIcon = React.memo((props) => (
  <IconWrapper {...props}>
    <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </IconWrapper>
));
LockIcon.displayName = 'LockIcon';

export const KeyIcon = React.memo((props) => (
  <IconWrapper {...props}>
    <path d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
  </IconWrapper>
));
KeyIcon.displayName = 'KeyIcon';

/**
 * ✅ ICONOS DE NAVEGACIÓN Y UI
 */

export const ChevronLeftIcon = React.memo((props) => (
  <IconWrapper {...props}>
    <path d="M15 19l-7-7 7-7" />
  </IconWrapper>
));
ChevronLeftIcon.displayName = 'ChevronLeftIcon';

export const ChevronRightIcon = React.memo((props) => (
  <IconWrapper {...props}>
    <path d="M9 5l7 7-7 7" />
  </IconWrapper>
));
ChevronRightIcon.displayName = 'ChevronRightIcon';

export const ChevronUpIcon = React.memo((props) => (
  <IconWrapper {...props}>
    <path d="M5 15l7-7 7 7" />
  </IconWrapper>
));
ChevronUpIcon.displayName = 'ChevronUpIcon';

export const ChevronDownIcon = React.memo((props) => (
  <IconWrapper {...props}>
    <path d="M19 9l-7 7-7-7" />
  </IconWrapper>
));
ChevronDownIcon.displayName = 'ChevronDownIcon';

export const MenuIcon = React.memo((props) => (
  <IconWrapper {...props}>
    <path d="M4 6h16M4 12h16M4 18h16" />
  </IconWrapper>
));
MenuIcon.displayName = 'MenuIcon';

export const CloseIcon = React.memo((props) => (
  <IconWrapper {...props}>
    <path d="M6 18L18 6M6 6l12 12" />
  </IconWrapper>
));
CloseIcon.displayName = 'CloseIcon';

export const ArrowLeftIcon = React.memo((props) => (
  <IconWrapper {...props}>
    <path d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </IconWrapper>
));
ArrowLeftIcon.displayName = 'ArrowLeftIcon';

export const ArrowRightIcon = React.memo((props) => (
  <IconWrapper {...props}>
    <path d="M14 5l7 7m0 0l-7 7m7-7H3" />
  </IconWrapper>
));
ArrowRightIcon.displayName = 'ArrowRightIcon';

export const RefreshIcon = React.memo((props) => (
  <IconWrapper {...props}>
    <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </IconWrapper>
));
RefreshIcon.displayName = 'RefreshIcon';

export const ExternalLinkIcon = React.memo((props) => (
  <IconWrapper {...props}>
    <path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
  </IconWrapper>
));
ExternalLinkIcon.displayName = 'ExternalLinkIcon';

/**
 * ✅ ICONOS ESPECÍFICOS PARA INVENTARIO
 */

export const BarcodeIcon = React.memo((props) => (
  <IconWrapper {...props}>
    <path d="M12 4v16m2-16v16m6-16v16m-10-16v16" />
    <rect x="4" y="4" width="16" height="16" rx="2" />
  </IconWrapper>
));
BarcodeIcon.displayName = 'BarcodeIcon';

export const QRCodeIcon = React.memo((props) => (
  <IconWrapper {...props}>
    <rect x="4" y="4" width="6" height="6" rx="1" />
    <rect x="14" y="4" width="6" height="6" rx="1" />
    <rect x="4" y="14" width="6" height="6" rx="1" />
    <rect x="14" y="14" width="6" height="6" rx="1" />
    <line x1="10" y1="8" x2="10" y2="16" />
    <line x1="14" y1="10" x2="8" y2="10" />
  </IconWrapper>
));
QRCodeIcon.displayName = 'QRCodeIcon';

export const PackageIcon = React.memo((props) => (
  <IconWrapper {...props}>
    <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
  </IconWrapper>
));
PackageIcon.displayName = 'PackageIcon';

export const BoxIcon = React.memo((props) => (
  <IconWrapper {...props}>
    <path d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
  </IconWrapper>
));
BoxIcon.displayName = 'BoxIcon';

export const StockIcon = React.memo((props) => (
  <IconWrapper {...props}>
    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    <path d="M12 12h.01" />
    <path d="M12 16h.01" />
    <path d="M8 12h.01" />
    <path d="M16 12h.01" />
  </IconWrapper>
));
StockIcon.displayName = 'StockIcon';

export const CategoryIcon = React.memo((props) => (
  <IconWrapper {...props}>
    <path d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
  </IconWrapper>
));
CategoryIcon.displayName = 'CategoryIcon';

export const LocationIcon = React.memo((props) => (
  <IconWrapper {...props}>
    <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </IconWrapper>
));
LocationIcon.displayName = 'LocationIcon';

export const CalendarIcon = React.memo((props) => (
  <IconWrapper {...props}>
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </IconWrapper>
));
CalendarIcon.displayName = 'CalendarIcon';

export const ClockIcon = React.memo((props) => (
  <IconWrapper {...props}>
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </IconWrapper>
));
ClockIcon.displayName = 'ClockIcon';

export const DollarIcon = React.memo((props) => (
  <IconWrapper {...props}>
    <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </IconWrapper>
));
DollarIcon.displayName = 'DollarIcon';

export const TagIcon = React.memo((props) => (
  <IconWrapper {...props}>
    <path d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
  </IconWrapper>
));
TagIcon.displayName = 'TagIcon';

/**
 * ✅ ICONOS DE COMUNICACIÓN Y ESTADO DEL SISTEMA
 */

export const BellIcon = React.memo((props) => (
  <IconWrapper {...props}>
    <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </IconWrapper>
));
BellIcon.displayName = 'BellIcon';

export const MailIcon = React.memo((props) => (
  <IconWrapper {...props}>
    <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </IconWrapper>
));
MailIcon.displayName = 'MailIcon';

export const MessageIcon = React.memo((props) => (
  <IconWrapper {...props}>
    <path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
  </IconWrapper>
));
MessageIcon.displayName = 'MessageIcon';

export const NotificationIcon = React.memo((props) => (
  <IconWrapper {...props}>
    <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </IconWrapper>
));
NotificationIcon.displayName = 'NotificationIcon';

/**
 * ✅ COMPONENTES DE UTILIDAD Y HELPERS
 */

/**
 * IconSpinner - Ícono de carga animado
 */
export const IconSpinner = React.memo((props) => {
  const {
    size = 24,
    color = 'currentColor',
    className = '',
    strokeWidth = 4,
    style = {},
    ...rest
  } = props;

  const spinnerStyle = {
    animation: 'spin 1s linear infinite',
    width: size,
    height: size,
    color: color,
    ...style,
  };

  const circleStyle = {
    opacity: 0.25,
  };

  const pathStyle = {
    opacity: 0.75,
  };

  return (
    <svg
      className={className}
      style={spinnerStyle}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      color={color}
      {...rest}
    >
      <circle
        style={circleStyle}
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth={strokeWidth}
      />
      <path
        style={pathStyle}
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
});

IconSpinner.propTypes = {
  size: PropTypes.number,
  color: PropTypes.string,
  className: PropTypes.string,
  strokeWidth: PropTypes.number,
  style: PropTypes.object,
};

IconSpinner.displayName = 'IconSpinner';

/**
 * IconLoader - Componente para carga con skeleton
 */
export const IconLoader = React.memo(({ size = 24, className = '' }) => {
  const loaderStyle = {
    width: size,
    height: size,
    borderRadius: '50%',
    background: 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)',
    backgroundSize: '200% 100%',
    animation: 'skeleton-shimmer 1.5s cubic-bezier(0.4, 0, 0.2, 1) infinite',
  };

  return (
    <div
      className={className}
      style={loaderStyle}
      role="status"
      aria-label="Loading"
    />
  );
});

IconLoader.propTypes = {
  size: PropTypes.number,
  className: PropTypes.string,
};

IconLoader.displayName = 'IconLoader';

/**
 * IconBadge - Ícono con badge de notificación
 */
export const IconBadge = React.memo(({
  icon: Icon,
  badgeCount = 0,
  badgeColor = 'danger',
  badgeMax = 99,
  showZero = false,
  ...props
}) => {
  const badgeColors = {
    primary: { backgroundColor: '#3b82f6', color: '#ffffff' },
    success: { backgroundColor: '#22c55e', color: '#ffffff' },
    warning: { backgroundColor: '#f59e0b', color: '#ffffff' },
    danger: { backgroundColor: '#ef4444', color: '#ffffff' },
    secondary: { backgroundColor: '#64748b', color: '#ffffff' },
  };

  const badgeStyle = badgeColors[badgeColor] || badgeColors.danger;

  const shouldShowBadge = badgeCount > 0 || (showZero && badgeCount === 0);

  if (!shouldShowBadge) {
    return <Icon {...props} />;
  }

  const displayCount = badgeCount > badgeMax ? `${badgeMax}+` : badgeCount.toString();

  const containerStyle = {
    position: 'relative',
    display: 'inline-block',
    lineHeight: 0,
  };

  const badgeElementStyle = {
    position: 'absolute',
    top: '-6px',
    right: '-6px',
    minWidth: '18px',
    height: '18px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 4px',
    borderRadius: '9px',
    fontSize: '10px',
    fontWeight: 'bold',
    ...badgeStyle,
  };

  return (
    <div style={containerStyle}>
      <Icon {...props} />
      {shouldShowBadge && (
        <output
          style={badgeElementStyle}
          aria-label={`${badgeCount} notifications`}
        >
          {displayCount}
        </output>
      )}
    </div>
  );
});

IconBadge.propTypes = {
  icon: PropTypes.elementType.isRequired,
  badgeCount: PropTypes.number,
  badgeColor: PropTypes.oneOf(['primary', 'success', 'warning', 'danger', 'secondary']),
  badgeMax: PropTypes.number,
  showZero: PropTypes.bool,
};

IconBadge.displayName = 'IconBadge';

/**
 * IconButton - Botón con ícono
 */
export const IconButton = React.memo(({
  icon: Icon,
  onClick,
  size = 'md',
  variant = 'primary',
  disabled = false,
  loading = false,
  className = '',
  children,
  style = {},
  ...props
}) => {
  const buttonRef = React.useRef(null);

  // Definir estilos basados en tamaño
  const sizeStyles = {
    xs: {
      padding: '4px',
      fontSize: '12px',
      minWidth: '24px',
      minHeight: '24px',
    },
    sm: {
      padding: '6px',
      fontSize: '14px',
      minWidth: '32px',
      minHeight: '32px',
    },
    md: {
      padding: '8px',
      fontSize: '16px',
      minWidth: '40px',
      minHeight: '40px',
    },
    lg: {
      padding: '12px',
      fontSize: '18px',
      minWidth: '48px',
      minHeight: '48px',
    },
    xl: {
      padding: '16px',
      fontSize: '20px',
      minWidth: '56px',
      minHeight: '56px',
    },
  };

  // Definir estilos basados en variante
  const variantStyles = {
    primary: {
      backgroundColor: '#3b82f6',
      color: '#ffffff',
      border: 'none',
    },
    secondary: {
      backgroundColor: '#64748b',
      color: '#ffffff',
      border: 'none',
    },
    success: {
      backgroundColor: '#22c55e',
      color: '#ffffff',
      border: 'none',
    },
    warning: {
      backgroundColor: '#f59e0b',
      color: '#ffffff',
      border: 'none',
    },
    danger: {
      backgroundColor: '#ef4444',
      color: '#ffffff',
      border: 'none',
    },
    ghost: {
      backgroundColor: 'transparent',
      color: '#374151',
      border: 'none',
    },
    outline: {
      backgroundColor: 'transparent',
      color: '#374151',
      border: '1px solid #d1d5db',
    },
  };

  const hoverStyles = {
    primary: { backgroundColor: '#2563eb' },
    secondary: { backgroundColor: '#475569' },
    success: { backgroundColor: '#16a34a' },
    warning: { backgroundColor: '#d97706' },
    danger: { backgroundColor: '#dc2626' },
    ghost: { backgroundColor: '#f3f4f6' },
    outline: { backgroundColor: '#f9fafb' },
  };

  const activeStyles = {
    primary: { backgroundColor: '#1d4ed8' },
    secondary: { backgroundColor: '#334155' },
    success: { backgroundColor: '#15803d' },
    warning: { backgroundColor: '#b45309' },
    danger: { backgroundColor: '#b91c1c' },
    ghost: { backgroundColor: '#e5e7eb' },
    outline: { backgroundColor: '#f3f4f6' },
  };

  const sizeConfig = sizeStyles[size] || sizeStyles.md;
  const variantConfig = variantStyles[variant] || variantStyles.primary;
  const hoverConfig = hoverStyles[variant] || hoverStyles.primary;
  const activeConfig = activeStyles[variant] || activeStyles.primary;

  const baseButtonStyle = {
    borderRadius: '6px',
    transition: 'all 0.2s ease',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    outline: 'none',
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    userSelect: 'none',
    fontFamily: 'inherit',
    ...sizeConfig,
    ...variantConfig,
    ...style,
  };

  // Tamaños de ícono basados en tamaño del botón
  const iconSizeMap = {
    xs: 12,
    sm: 16,
    md: 20,
    lg: 24,
    xl: 28,
  };

  const iconSize = iconSizeMap[size] || 20;

  const handleClick = React.useCallback((event) => {
    if (disabled || loading || !onClick) return;
    onClick(event);
  }, [onClick, disabled, loading]);

  const handleMouseEnter = React.useCallback(() => {
    if (disabled || loading || !buttonRef.current) return;
    buttonRef.current.style.backgroundColor = hoverConfig.backgroundColor;
  }, [disabled, loading, hoverConfig]);

  const handleMouseLeave = React.useCallback(() => {
    if (disabled || loading || !buttonRef.current) return;
    buttonRef.current.style.backgroundColor = variantConfig.backgroundColor;
  }, [disabled, loading, variantConfig]);

  const handleMouseDown = React.useCallback(() => {
    if (disabled || loading || !buttonRef.current) return;
    buttonRef.current.style.backgroundColor = activeConfig.backgroundColor;
  }, [disabled, loading, activeConfig]);

  const handleMouseUp = React.useCallback(() => {
    if (disabled || loading || !buttonRef.current) return;
    buttonRef.current.style.backgroundColor = hoverConfig.backgroundColor;
  }, [disabled, loading, hoverConfig]);

  const handleFocus = React.useCallback(() => {
    if (disabled || loading || !buttonRef.current) return;
    buttonRef.current.style.boxShadow = '0 0 0 2px rgba(59, 130, 246, 0.5)';
  }, [disabled, loading]);

  const handleBlur = React.useCallback(() => {
    if (!buttonRef.current) return;
    buttonRef.current.style.boxShadow = 'none';
    buttonRef.current.style.backgroundColor = variantConfig.backgroundColor;
  }, [variantConfig]);

  return (
    <button
      ref={buttonRef}
      style={baseButtonStyle}
      className={className}
      onClick={handleClick}
      disabled={disabled || loading}
      aria-label={props['aria-label'] || props.title || 'Icon button'}
      aria-disabled={disabled || loading}
      aria-busy={loading}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onFocus={handleFocus}
      onBlur={handleBlur}
      {...props}
    >
      {loading ? (
        <IconSpinner size={iconSize} />
      ) : (
        <>
          <Icon size={iconSize} />
          {children && <span style={{ marginLeft: '8px' }}>{children}</span>}
        </>
      )}
    </button>
  );
});

IconButton.propTypes = {
  icon: PropTypes.elementType.isRequired,
  onClick: PropTypes.func,
  size: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl']),
  variant: PropTypes.oneOf(['primary', 'secondary', 'success', 'warning', 'danger', 'ghost', 'outline']),
  disabled: PropTypes.bool,
  loading: PropTypes.bool,
  className: PropTypes.string,
  children: PropTypes.node,
  style: PropTypes.object,
  'aria-label': PropTypes.string,
  title: PropTypes.string,
};

IconButton.displayName = 'IconButton';

/**
 * ✅ HOOK PARA USO DE ICONOS
 */
export const useIcon = () => {
  const getIcon = React.useCallback((name, props = {}) => {
    const iconMap = {
      home: HomeIcon,
      inventory: InventoryIcon,
      qrScanner: QRScannerIcon,
      report: ReportIcon,
      settings: SettingsIcon,
      add: AddIcon,
      edit: EditIcon,
      delete: DeleteIcon,
      view: ViewIcon,
      search: SearchIcon,
      filter: FilterIcon,
      download: DownloadIcon,
      upload: UploadIcon,
      print: PrintIcon,
      check: CheckCircleIcon,
      warning: WarningIcon,
      error: ErrorIcon,
      info: InfoIcon,
      success: SuccessIcon,
      user: UserIcon,
      login: LoginIcon,
      logout: LogoutIcon,
      lock: LockIcon,
      key: KeyIcon,
      chevronLeft: ChevronLeftIcon,
      chevronRight: ChevronRightIcon,
      chevronUp: ChevronUpIcon,
      chevronDown: ChevronDownIcon,
      menu: MenuIcon,
      close: CloseIcon,
      arrowLeft: ArrowLeftIcon,
      arrowRight: ArrowRightIcon,
      refresh: RefreshIcon,
      externalLink: ExternalLinkIcon,
      barcode: BarcodeIcon,
      qrcode: QRCodeIcon,
      package: PackageIcon,
      box: BoxIcon,
      stock: StockIcon,
      category: CategoryIcon,
      location: LocationIcon,
      calendar: CalendarIcon,
      clock: ClockIcon,
      dollar: DollarIcon,
      tag: TagIcon,
      bell: BellIcon,
      mail: MailIcon,
      message: MessageIcon,
      notification: NotificationIcon,
      spinner: IconSpinner,
    };

    const IconComponent = iconMap[name];

    if (!IconComponent) {
      console.warn(`Icon "${name}" not found. Using default icon.`);
      return <InfoIcon {...props} />;
    }

    return <IconComponent {...props} />;
  }, []);

  return { getIcon };
};

/**
 * ✅ COMPONENTE DE PREVIEW PARA DESARROLLO
 */
export const IconPreview = React.memo(({ icons = [], columns = 4 }) => {
  const containerStyle = {
    display: 'grid',
    gridTemplateColumns: `repeat(${columns}, 1fr)`,
    gap: '16px',
    padding: '16px',
  };

  const itemStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '12px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
  };

  const labelStyle = {
    marginTop: '8px',
    fontSize: '12px',
    textAlign: 'center',
    color: '#4b5563',
    fontWeight: '500',
  };

  if (icons.length === 0) {
    const allIcons = [
      { name: 'Home', Icon: HomeIcon },
      { name: 'Inventory', Icon: InventoryIcon },
      { name: 'Settings', Icon: SettingsIcon },
      { name: 'Add', Icon: AddIcon },
      { name: 'Edit', Icon: EditIcon },
      { name: 'Delete', Icon: DeleteIcon },
      { name: 'Search', Icon: SearchIcon },
      { name: 'User', Icon: UserIcon },
      { name: 'Check', Icon: CheckCircleIcon },
      { name: 'Warning', Icon: WarningIcon },
      { name: 'Bell', Icon: BellIcon },
      { name: 'Calendar', Icon: CalendarIcon },
    ];

    return (
      <div style={containerStyle}>
        {allIcons.map(({ name, Icon }) => (
          <div key={name} style={itemStyle}>
            <Icon size={32} />
            <span style={labelStyle}>{name}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      {icons.map(({ name, Icon, ...props }) => (
        <div key={name} style={itemStyle}>
          <Icon size={32} {...props} />
          <span style={labelStyle}>{name}</span>
        </div>
      ))}
    </div>
  );
});

IconPreview.propTypes = {
  icons: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      Icon: PropTypes.elementType.isRequired,
    })
  ),
  columns: PropTypes.number,
};

IconPreview.displayName = 'IconPreview';

/**
 * ✅ EXPORTACIÓN PRINCIPAL
 * Todos los iconos disponibles para importar
 */
const IconLibrary = {
  // Navegación
  HomeIcon,
  InventoryIcon,
  QRScannerIcon,
  ReportIcon,
  SettingsIcon,

  // Acciones CRUD
  AddIcon,
  EditIcon,
  DeleteIcon,
  ViewIcon,
  SearchIcon,
  FilterIcon,
  DownloadIcon,
  UploadIcon,
  PrintIcon,

  // Estado y notificaciones
  CheckCircleIcon,
  WarningIcon,
  ErrorIcon,
  InfoIcon,
  SuccessIcon,

  // Usuario y autenticación
  UserIcon,
  LoginIcon,
  LogoutIcon,
  LockIcon,
  KeyIcon,

  // Navegación y UI
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  MenuIcon,
  CloseIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  RefreshIcon,
  ExternalLinkIcon,

  // Inventario específico
  BarcodeIcon,
  QRCodeIcon,
  PackageIcon,
  BoxIcon,
  StockIcon,
  CategoryIcon,
  LocationIcon,
  CalendarIcon,
  ClockIcon,
  DollarIcon,
  TagIcon,

  // Comunicación
  BellIcon,
  MailIcon,
  MessageIcon,
  NotificationIcon,

  // Utilidades
  IconSpinner,
  IconLoader,
  IconBadge,
  IconButton,
  useIcon,
  IconPreview,
};

export default IconLibrary;