import React from 'react';
import PropTypes from 'prop-types';
import '../../assets/styles/AUTH/auth.css';

const PasswordStrength = ({ password }) => {
    // Calcular fortaleza de la contraseña
    const calculateStrength = (pass) => {
        if (!pass) return { score: 0, label: '', color: '' };
        
        let score = 0;
        const requirements = {
            length: pass.length >= 6,
            lowercase: /[a-z]/.test(pass),
            uppercase: /[A-Z]/.test(pass),
            numbers: /\d/.test(pass),
            special: /[^A-Za-z0-9]/.test(pass)
        };

        // Puntos por cada requisito cumplido
        if (requirements.length) score += 20;
        if (requirements.lowercase) score += 20;
        if (requirements.uppercase) score += 20;
        if (requirements.numbers) score += 20;
        if (requirements.special) score += 20;

        // Determinar etiqueta y color
        let label, color;
        if (score >= 80) {
            label = 'Muy fuerte';
            color = '#10b981'; // Verde
        } else if (score >= 60) {
            label = 'Fuerte';
            color = '#22c55e'; // Verde claro
        } else if (score >= 40) {
            label = 'Moderada';
            color = '#f59e0b'; // Amarillo
        } else if (score >= 20) {
            label = 'Débil';
            color = '#f97316'; // Naranja
        } else {
            label = 'Muy débil';
            color = '#ef4444'; // Rojo
        }

        return { score, label, color };
    };

    const strength = calculateStrength(password);

    // Verificar requisitos individuales
    const checkRequirements = (pass) => {
        return {
            length: pass.length >= 6,
            lowercase: /[a-z]/.test(pass),
            uppercase: /[A-Z]/.test(pass),
            numbers: /\d/.test(pass),
            special: /[^A-Za-z0-9]/.test(pass)
        };
    };

    const requirements = checkRequirements(password);

    return (
        <div className="password-strength">
            <div className="strength-meter">
                <div 
                    className="strength-bar" 
                    style={{ 
                        width: `${strength.score}%`,
                        backgroundColor: strength.color
                    }}
                ></div>
            </div>
            
            <div className="strength-info">
                <span className="strength-label" style={{ color: strength.color }}>
                    {strength.label}
                </span>
                <span className="strength-score">
                    {strength.score}%
                </span>
            </div>
            
            <div className="password-requirements">
                <h4>Requisitos de la contraseña:</h4>
                <ul className="requirements-list">
                    <li className={requirements.length ? 'met' : 'unmet'}>
                        <i className={`fas ${requirements.length ? 'fa-check-circle' : 'fa-times-circle'}`}></i>
                        Mínimo 6 caracteres
                    </li>
                    <li className={requirements.lowercase ? 'met' : 'unmet'}>
                        <i className={`fas ${requirements.lowercase ? 'fa-check-circle' : 'fa-times-circle'}`}></i>
                        Al menos una minúscula
                    </li>
                    <li className={requirements.uppercase ? 'met' : 'unmet'}>
                        <i className={`fas ${requirements.uppercase ? 'fa-check-circle' : 'fa-times-circle'}`}></i>
                        Al menos una mayúscula
                    </li>
                    <li className={requirements.numbers ? 'met' : 'unmet'}>
                        <i className={`fas ${requirements.numbers ? 'fa-check-circle' : 'fa-times-circle'}`}></i>
                        Al menos un número
                    </li>
                    <li className={requirements.special ? 'met' : 'unmet'}>
                        <i className={`fas ${requirements.special ? 'fa-check-circle' : 'fa-times-circle'}`}></i>
                        Al menos un carácter especial
                    </li>
                </ul>
            </div>
            
            <div className="password-tips">
                <h4>Consejos para una contraseña segura:</h4>
                <ul className="tips-list">
                    <li><i className="fas fa-lightbulb"></i> Usa una combinación de letras, números y símbolos</li>
                    <li><i className="fas fa-lightbulb"></i> Evita información personal fácil de adivinar</li>
                    <li><i className="fas fa-lightbulb"></i> No uses la misma contraseña en múltiples sitios</li>
                    <li><i className="fas fa-lightbulb"></i> Considera usar una frase en lugar de una palabra</li>
                </ul>
            </div>
        </div>
    );
};

PasswordStrength.propTypes = {
    password: PropTypes.string.isRequired
};

export default PasswordStrength;