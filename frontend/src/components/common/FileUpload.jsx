import React, { useState, useRef, forwardRef } from 'react';
import PropTypes from 'prop-types';
import '../../assets/styles/Common/common.css';

const FileUpload = forwardRef(({
    onChange,
    multiple = false,
    accept,
    maxSize = 5 * 1024 * 1024, // 5MB por defecto
    maxFiles = 10,
    label = 'Subir archivos',
    helperText,
    error,
    disabled = false,
    required = false,
    size = 'medium',
    variant = 'default',
    fullWidth = false,
    showPreview = true,
    previewType = 'list', // 'list', 'grid', 'cards'
    className = '',
    wrapperClassName = '',
    labelClassName = '',
    inputClassName = '',
    helperClassName = '',
    name,
    id,
    value,
    defaultValue,
    ...props
}, ref) => {
    const [files, setFiles] = useState(defaultValue || []);
    const [dragOver, setDragOver] = useState(false);
    const [uploadProgress, setUploadProgress] = useState({});
    const [errors, setErrors] = useState([]);
    
    const fileInputRef = useRef(null);
    const dropZoneRef = useRef(null);

    const isControlled = value !== undefined;
    const currentFiles = isControlled ? value : files;

    const validateFile = (file) => {
        const newErrors = [];
        
        // Validar tamaño
        if (file.size > maxSize) {
            newErrors.push({
                fileName: file.name,
                error: `El archivo excede el tamaño máximo de ${formatFileSize(maxSize)}`
            });
        }
        
        // Validar tipo
        if (accept) {
            const acceptedTypes = accept.split(',').map(type => type.trim());
            const fileType = file.type || getFileType(file.name);
            const fileExtension = getFileExtension(file.name);
            
            const isAccepted = acceptedTypes.some(type => {
                if (type.startsWith('.')) {
                    return `.${fileExtension}` === type;
                }
                return fileType.match(new RegExp(type.replace('*', '.*')));
            });
            
            if (!isAccepted) {
                newErrors.push({
                    fileName: file.name,
                    error: 'Tipo de archivo no permitido'
                });
            }
        }
        
        return newErrors;
    };

    const getFileType = (fileName) => {
        const extension = getFileExtension(fileName).toLowerCase();
        
        const typeMap = {
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'gif': 'image/gif',
            'pdf': 'application/pdf',
            'doc': 'application/msword',
            'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'xls': 'application/vnd.ms-excel',
            'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'txt': 'text/plain',
            'csv': 'text/csv'
        };
        
        return typeMap[extension] || 'application/octet-stream';
    };

    const getFileExtension = (fileName) => {
        return fileName.split('.').pop();
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const handleFileSelect = (selectedFiles) => {
        if (disabled) return;
        
        const fileArray = Array.from(selectedFiles);
        let validFiles = [];
        let newErrors = [];
        
        // Validar cantidad máxima
        if (!multiple && fileArray.length > 1) {
            newErrors.push({
                fileName: 'Múltiples archivos',
                error: 'Solo se permite un archivo'
            });
        } else if (multiple && currentFiles.length + fileArray.length > maxFiles) {
            newErrors.push({
                fileName: 'Múltiples archivos',
                error: `Máximo ${maxFiles} archivos permitidos`
            });
        } else {
            // Validar cada archivo
            fileArray.forEach(file => {
                const fileErrors = validateFile(file);
                if (fileErrors.length === 0) {
                    validFiles.push(file);
                } else {
                    newErrors.push(...fileErrors);
                }
            });
        }
        
        // Actualizar errores
        setErrors(newErrors);
        
        if (validFiles.length === 0) return;
        
        // Simular progreso de carga
        validFiles.forEach(file => {
            const progress = { loaded: 0, total: file.size, percentage: 0 };
            setUploadProgress(prev => ({ ...prev, [file.name]: progress }));
            
            // Simular progreso
            const interval = setInterval(() => {
                setUploadProgress(prev => {
                    const current = prev[file.name];
                    if (!current) return prev;
                    
                    const newLoaded = Math.min(
                        current.loaded + (file.size / 10),
                        file.size
                    );
                    const newPercentage = Math.round((newLoaded / file.size) * 100);
                    
                    if (newPercentage === 100) {
                        clearInterval(interval);
                        setTimeout(() => {
                            setUploadProgress(prev => {
                                const { [file.name]: _, ...rest } = prev;
                                return rest;
                            });
                        }, 1000);
                    }
                    
                    return {
                        ...prev,
                        [file.name]: {
                            ...current,
                            loaded: newLoaded,
                            percentage: newPercentage
                        }
                    };
                });
            }, 100);
        });
        
        // Actualizar archivos
        const updatedFiles = multiple 
            ? [...currentFiles, ...validFiles]
            : [validFiles[0]];
        
        if (!isControlled) {
            setFiles(updatedFiles);
        }
        
        if (onChange) {
            const event = {
                target: {
                    value: updatedFiles,
                    name,
                    type: 'file'
                },
                files: updatedFiles
            };
            onChange(event);
        }
    };

    const handleInputChange = (e) => {
        handleFileSelect(e.target.files);
        // Resetear input para permitir subir el mismo archivo otra vez
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFileSelect(e.dataTransfer.files);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setDragOver(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setDragOver(false);
    };

    const removeFile = (index) => {
        const updatedFiles = currentFiles.filter((_, i) => i !== index);
        
        if (!isControlled) {
            setFiles(updatedFiles);
        }
        
        if (onChange) {
            const event = {
                target: {
                    value: updatedFiles,
                    name,
                    type: 'file'
                },
                files: updatedFiles
            };
            onChange(event);
        }
    };

    const getFileIcon = (file) => {
        const extension = getFileExtension(file.name).toLowerCase();
        
        const iconMap = {
            'jpg': 'fas fa-file-image',
            'jpeg': 'fas fa-file-image',
            'png': 'fas fa-file-image',
            'gif': 'fas fa-file-image',
            'pdf': 'fas fa-file-pdf',
            'doc': 'fas fa-file-word',
            'docx': 'fas fa-file-word',
            'xls': 'fas fa-file-excel',
            'xlsx': 'fas fa-file-excel',
            'txt': 'fas fa-file-alt',
            'csv': 'fas fa-file-csv',
            'zip': 'fas fa-file-archive',
            'rar': 'fas fa-file-archive',
            'mp3': 'fas fa-file-audio',
            'mp4': 'fas fa-file-video'
        };
        
        return iconMap[extension] || 'fas fa-file';
    };

    const sizeClasses = {
        small: 'fileupload-sm',
        medium: 'fileupload-md',
        large: 'fileupload-lg'
    };

    const variantClasses = {
        default: 'fileupload-default',
        filled: 'fileupload-filled',
        outline: 'fileupload-outline'
    };

    const wrapperClasses = [
        'fileupload-wrapper',
        sizeClasses[size],
        variantClasses[variant],
        fullWidth ? 'fileupload-full-width' : '',
        disabled ? 'fileupload-disabled' : '',
        error ? 'fileupload-error' : '',
        dragOver ? 'fileupload-drag-over' : '',
        wrapperClassName
    ].filter(Boolean).join(' ');

    const inputClasses = [
        'fileupload-input',
        inputClassName
    ].filter(Boolean).join(' ');

    return (
        <div className={`fileupload-container ${className}`}>
            {/* Label */}
            {label && (
                <label 
                    className={`fileupload-label ${labelClassName} ${required ? 'required' : ''}`}
                >
                    {label}
                </label>
            )}

            {/* Drop zone */}
            <div
                ref={dropZoneRef}
                className={wrapperClasses}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => !disabled && fileInputRef.current?.click()}
            >
                {/* Input oculto */}
                <input
                    ref={fileInputRef}
                    type="file"
                    id={id}
                    name={name}
                    onChange={handleInputChange}
                    disabled={disabled}
                    required={required}
                    multiple={multiple}
                    accept={accept}
                    className={inputClasses}
                    {...props}
                />

                {/* Contenido del drop zone */}
                <div className="fileupload-content">
                    <i className="fas fa-cloud-upload-alt fileupload-icon"></i>
                    
                    <div className="fileupload-text">
                        <p className="fileupload-title">
                            {dragOver ? 'Suelta los archivos aquí' : 'Arrastra y suelta archivos aquí'}
                        </p>
                        <p className="fileupload-subtitle">
                            o haz clic para seleccionar archivos
                        </p>
                    </div>
                    
                    <div className="fileupload-info">
                        <div className="fileupload-info-item">
                            <i className="fas fa-file"></i>
                            <span>
                                {multiple ? `Máximo ${maxFiles} archivos` : '1 archivo'}
                            </span>
                        </div>
                        <div className="fileupload-info-item">
                            <i className="fas fa-weight-hanging"></i>
                            <span>Máximo {formatFileSize(maxSize)}</span>
                        </div>
                        {accept && (
                            <div className="fileupload-info-item">
                                <i className="fas fa-filter"></i>
                                <span>Formatos: {accept}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Errores de validación */}
            {errors.length > 0 && (
                <div className="fileupload-errors">
                    {errors.map((error, index) => (
                        <div key={index} className="fileupload-error-item">
                            <i className="fas fa-exclamation-circle"></i>
                            <span>
                                <strong>{error.fileName}:</strong> {error.error}
                            </span>
                        </div>
                    ))}
                </div>
            )}

            {/* Vista previa de archivos */}
            {showPreview && currentFiles.length > 0 && (
                <div className={`fileupload-preview ${previewType}`}>
                    <div className="fileupload-preview-header">
                        <h4>Archivos seleccionados ({currentFiles.length})</h4>
                        {multiple && currentFiles.length > 0 && (
                            <button
                                className="fileupload-clear-all"
                                onClick={() => {
                                    if (!isControlled) setFiles([]);
                                    if (onChange) {
                                        const event = {
                                            target: {
                                                value: [],
                                                name,
                                                type: 'file'
                                            },
                                            files: []
                                        };
                                        onChange(event);
                                    }
                                }}
                                disabled={disabled}
                            >
                                <i className="fas fa-trash"></i>
                                Eliminar todos
                            </button>
                        )}
                    </div>
                    
                    <div className="fileupload-preview-content">
                        {currentFiles.map((file, index) => {
                            const progress = uploadProgress[file.name];
                            const isUploading = progress && progress.percentage < 100;
                            
                            return (
                                <div key={index} className="fileupload-file">
                                    <div className="fileupload-file-icon">
                                        <i className={getFileIcon(file)}></i>
                                    </div>
                                    
                                    <div className="fileupload-file-info">
                                        <div className="fileupload-file-name">
                                            {file.name}
                                        </div>
                                        <div className="fileupload-file-details">
                                            <span className="fileupload-file-size">
                                                {formatFileSize(file.size)}
                                            </span>
                                            <span className="fileupload-file-type">
                                                {getFileExtension(file.name).toUpperCase()}
                                            </span>
                                            <span className="fileupload-file-date">
                                                Última modificación: {new Date(file.lastModified).toLocaleDateString()}
                                            </span>
                                        </div>
                                        
                                        {/* Barra de progreso */}
                                        {isUploading && (
                                            <div className="fileupload-file-progress">
                                                <div className="fileupload-progress-bar">
                                                    <div 
                                                        className="fileupload-progress-fill"
                                                        style={{ width: `${progress.percentage}%` }}
                                                    ></div>
                                                </div>
                                                <span className="fileupload-progress-text">
                                                    {progress.percentage}%
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="fileupload-file-actions">
                                        {!isUploading && (
                                            <>
                                                <button
                                                    className="fileupload-file-action"
                                                    onClick={() => {
                                                        // Descargar vista previa (simulado)
                                                        const url = URL.createObjectURL(file);
                                                        const a = document.createElement('a');
                                                        a.href = url;
                                                        a.download = file.name;
                                                        a.click();
                                                        URL.revokeObjectURL(url);
                                                    }}
                                                    title="Descargar"
                                                >
                                                    <i className="fas fa-download"></i>
                                                </button>
                                                
                                                <button
                                                    className="fileupload-file-action delete"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        removeFile(index);
                                                    }}
                                                    title="Eliminar"
                                                    disabled={disabled}
                                                >
                                                    <i className="fas fa-trash"></i>
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Helper text and error */}
            {(helperText || error) && (
                <div className={`fileupload-helper ${helperClassName} ${error ? 'fileupload-error-text' : ''}`}>
                    {error || helperText}
                </div>
            )}
        </div>
    );
});

FileUpload.displayName = 'FileUpload';

FileUpload.propTypes = {
    onChange: PropTypes.func.isRequired,
    multiple: PropTypes.bool,
    accept: PropTypes.string,
    maxSize: PropTypes.number,
    maxFiles: PropTypes.number,
    label: PropTypes.string,
    helperText: PropTypes.string,
    error: PropTypes.string,
    disabled: PropTypes.bool,
    required: PropTypes.bool,
    size: PropTypes.oneOf(['small', 'medium', 'large']),
    variant: PropTypes.oneOf(['default', 'filled', 'outline']),
    fullWidth: PropTypes.bool,
    showPreview: PropTypes.bool,
    previewType: PropTypes.oneOf(['list', 'grid', 'cards']),
    className: PropTypes.string,
    wrapperClassName: PropTypes.string,
    labelClassName: PropTypes.string,
    inputClassName: PropTypes.string,
    helperClassName: PropTypes.string,
    name: PropTypes.string,
    id: PropTypes.string,
    value: PropTypes.array,
    defaultValue: PropTypes.array
};

export default FileUpload;