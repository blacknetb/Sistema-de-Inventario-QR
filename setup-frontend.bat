@echo off
echo ========================================
echo    CONFIGURACION FRONTEND - INVENTARIO QR
echo ========================================

REM Crear estructura de carpetas
echo Creando estructura de carpetas...
mkdir "E:\portafolio de desarrollo web\app web\proyectos basicos\inventarios basicos\frontend\public" 2>nul
mkdir "E:\portafolio de desarrollo web\app web\proyectos basicos\inventarios basicos\frontend\src\assets\styles" 2>nul
mkdir "E:\portafolio de desarrollo web\app web\proyectos basicos\inventarios basicos\frontend\src\components\auth" 2>nul

echo.
echo Estructura creada:
echo   ✓ frontend/
echo   ✓ frontend/public/
echo   ✓ frontend/src/
echo   ✓ frontend/src/assets/styles/
echo   ✓ frontend/src/components/auth/

echo.
echo ========================================
echo        INSTALACION COMPLETADA
echo ========================================
echo.
echo Para ejecutar el proyecto:
echo 1. cd "E:\portafolio de desarrollo web\app web\proyectos basicos\inventarios basicos\frontend"
echo 2. npm install
echo 3. npm start
echo.
echo Credenciales de prueba:
echo Email: admin@inventario.com
echo Contraseña: Admin123
echo.
pause