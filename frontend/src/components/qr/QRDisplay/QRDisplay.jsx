import React from 'react';
import QRCode from 'qrcode.react';
import styles from './QRDisplay.module.css';

const QRDisplay = ({ 
  data, 
  size = 200, 
  foreground = '#000000', 
  background = '#ffffff',
  includeLogo = false,
  logoImage = '/logo.png'
}) => {
  const qrRef = React.useRef(null);

  const downloadQR = () => {
    const canvas = qrRef.current.querySelector('canvas');
    if (canvas) {
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = 'qrcode.png';
      link.href = url;
      link.click();
    }
  };

  return (
    <div className={styles.qrDisplay} ref={qrRef}>
      <QRCode
        value={data}
        size={size}
        fgColor={foreground}
        bgColor={background}
        level="H"
        includeMargin={true}
        imageSettings={includeLogo ? {
          src: logoImage,
          x: undefined,
          y: undefined,
          height: size * 0.2,
          width: size * 0.2,
          excavate: true,
        } : undefined}
      />
      
      <button 
        className={styles.downloadButton}
        onClick={downloadQR}
        title="Descargar QR"
      >
        ⬇️
      </button>
    </div>
  );
};

export default QRDisplay;