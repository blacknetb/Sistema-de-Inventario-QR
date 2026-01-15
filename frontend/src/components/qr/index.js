/**
 * Archivo de exportación principal para componentes QR
 * Permite importaciones limpias desde otros módulos
 */

import QRGenerator from './QRGenerator';
import QRScanner from './QRScanner';
import QRCodeDisplay from './QRCodeDisplay';
import QRPrintSheet from './QRPrintSheet';
import QRBatchGenerator from './QRBatchGenerator';

// Exportación individual de todos los componentes
export {
    QRGenerator,
    QRScanner,
    QRCodeDisplay,
    QRPrintSheet,
    QRBatchGenerator
};

// Exportación por defecto (QRGenerator como principal)
export default QRGenerator;