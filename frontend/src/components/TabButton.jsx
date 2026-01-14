import React from "react";
import PropTypes from "prop-types";
import "../assets/styles/index.css";
// ✅ Configuración de colores para tabs
const tabColorClasses = {
  blue: "border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20",
  green: "border-green-600 text-green-600 dark:text-green-400 dark:border-green-400 bg-green-50 dark:bg-green-900/20",
  red: "border-red-600 text-red-600 dark:text-red-400 dark:border-red-400 bg-red-50 dark:bg-red-900/20",
  purple: "border-purple-600 text-purple-600 dark:text-purple-400 dark:border-purple-400 bg-purple-50 dark:bg-purple-900/20",
  yellow: "border-yellow-600 text-yellow-600 dark:text-yellow-400 dark:border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20",
  gray: "border-gray-600 text-gray-600 dark:text-gray-400 dark:border-gray-400 bg-gray-50 dark:bg-gray-800",
};

const TabButton = ({
  tab,
  isActive,
  onClick,
  color = "blue",
  icon: Icon,
  disabled = false,
}) => {
  const handleClick = () => {
    if (!disabled && onClick) {
      onClick(tab.id);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`shrink-0 px-6 py-4 text-sm font-medium flex items-center whitespace-nowrap transition-all duration-200 ${
        isActive
          ? tabColorClasses[color] || tabColorClasses.blue
          : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
      } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
      role="tab"
      aria-selected={isActive}
      aria-controls={`tabpanel-${tab.id}`}
      tabIndex={isActive ? 0 : -1}
    >
      {Icon && <Icon className="w-4 h-4 mr-2" aria-hidden="true" />}
      {tab.label}
    </button>
  );
};

// ✅ PropTypes para eliminar warnings
TabButton.propTypes = {
  tab: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    label: PropTypes.string.isRequired,
  }).isRequired,
  isActive: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,
  color: PropTypes.oneOf([
    "blue",
    "green",
    "red",
    "purple",
    "yellow",
    "gray",
  ]),
  icon: PropTypes.elementType,
  disabled: PropTypes.bool,
};

export default TabButton;