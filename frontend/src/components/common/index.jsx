/**
 * index.js
 * Archivo de exportación principal para componentes comunes
 * Ubicación: E:\portafolio de desarrollo web\app web\proyectos basicos\inventarios basicos\frontend\src\components\common\index.js
 */

// Exportar todos los componentes comunes
export { default as Header } from './Header';
export { default as Footer } from './Footer';
export { default as Sidebar } from './Sidebar';
export { default as Button } from './Button';
export { default as Modal } from './Modal';
export { default as Table } from './Table';

// Exportar variantes y utilidades específicas
export { 
    PrimaryButton, 
    SecondaryButton, 
    SuccessButton, 
    DangerButton, 
    WarningButton, 
    InfoButton, 
    LightButton, 
    DarkButton,
    IconButton,
    ButtonGroup,
    DropdownButton 
} from './Button';

export { 
    ConfirmModal, 
    AlertModal, 
    FormModal 
} from './Modal';

export { 
    ExportableTable, 
    CardTable 
} from './Table';