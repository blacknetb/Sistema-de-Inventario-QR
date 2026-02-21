import React, { useRef } from 'react';
import styles from './QRPrintPreview.module.css';
import Button from '../../common/Button/Button';

const QRPrintPreview = ({ products, onClose }) => {
  const printRef = useRef();

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Códigos QR - Inventarios</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              .container { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 20px; }
              .item { text-align: center; border: 1px solid #e5e7eb; padding: 20px; border-radius: 8px; }
              .item img { width: 150px; height: 150px; margin-bottom: 10px; }
              .item h4 { margin: 0 0 5px; color: #111827; }
              .item p { margin: 0; color: #6b7280; font-size: 14px; }
              @media print {
                body { padding: 0; }
                .item { border: none; break-inside: avoid; }
              }
            </style>
          </head>
          <body>
            <div class="container">
              ${products.map(product => `
                <div class="item">
                  <img src="${product.qrCode || 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'150\' height=\'150\' viewBox=\'0 0 150 150\'%3E%3Crect width=\'150\' height=\'150\' fill=\'%23f3f4f6\'/%3E%3Ctext x=\'75\' y=\'75\' font-family=\'Arial\' font-size=\'14\' fill=\'%239ca3af\' text-anchor=\'middle\'%3EQR Code%3C/text%3E%3C/svg%3E'}" 
                       alt="QR Code for ${product.name}">
                  <h4>${product.name}</h4>
                  <p>SKU: ${product.sku}</p>
                </div>
              `).join('')}
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <div className={styles.preview}>
      <div className={styles.header}>
        <h3 className={styles.title}>Vista Previa de Impresión</h3>
        <button className={styles.closeButton} onClick={onClose}>
          ×
        </button>
      </div>

      <div className={styles.content} ref={printRef}>
        <div className={styles.grid}>
          {products.map(product => (
            <div key={product.id} className={styles.item}>
              <img 
                src={product.qrCode || 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'150\' height=\'150\' viewBox=\'0 0 150 150\'%3E%3Crect width=\'150\' height=\'150\' fill=\'%23f3f4f6\'/%3E%3Ctext x=\'75\' y=\'75\' font-family=\'Arial\' font-size=\'14\' fill=\'%239ca3af\' text-anchor=\'middle\'%3EQR Code%3C/text%3E%3C/svg%3E'} 
                alt={`QR Code for ${product.name}`}
                className={styles.qrImage}
              />
              <h4 className={styles.productName}>{product.name}</h4>
              <p className={styles.productSku}>SKU: {product.sku}</p>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.footer}>
        <Button variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button variant="primary" onClick={handlePrint}>
          Imprimir QR
        </Button>
      </div>
    </div>
  );
};

export default QRPrintPreview;