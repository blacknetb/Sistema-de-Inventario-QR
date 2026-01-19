/**
 * Utilidades para manejo de fechas
 */
class DateUtils {
  /**
   * Formatea una fecha en diferentes formatos
   * @param {Date|string} date - Fecha a formatear
   * @param {string} format - Formato deseado
   * @returns {string} Fecha formateada
   */
  static format(date, format = 'display') {
    if (!date) return '';
    
    const dateObj = date instanceof Date ? date : new Date(date);
    
    if (isNaN(dateObj.getTime())) {
      return 'Fecha inválida';
    }
    
    const day = dateObj.getDate().toString().padStart(2, '0');
    const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const year = dateObj.getFullYear();
    const hours = dateObj.getHours().toString().padStart(2, '0');
    const minutes = dateObj.getMinutes().toString().padStart(2, '0');
    const seconds = dateObj.getSeconds().toString().padStart(2, '0');
    
    const formats = {
      'dd/mm/yyyy': `${day}/${month}/${year}`,
      'mm/dd/yyyy': `${month}/${day}/${year}`,
      'yyyy-mm-dd': `${year}-${month}-${day}`,
      'dd-mm-yyyy': `${day}-${month}-${year}`,
      'full': `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`,
      'time': `${hours}:${minutes}`,
      'datetime': `${day}/${month}/${year} ${hours}:${minutes}`,
      'iso': dateObj.toISOString(),
      'display': new Intl.DateTimeFormat('es-MX', {
        dateStyle: 'medium',
        timeStyle: dateObj.getHours() + dateObj.getMinutes() + dateObj.getSeconds() > 0 ? 'short' : undefined
      }).format(dateObj)
    };
    
    return formats[format] || formats.display;
  }
  
  /**
   * Obtiene la fecha actual formateada
   * @param {string} format - Formato deseado
   * @returns {string} Fecha actual formateada
   */
  static now(format = 'display') {
    return this.format(new Date(), format);
  }
  
  /**
   * Añade días a una fecha
   * @param {Date} date - Fecha base
   * @param {number} days - Días a añadir (puede ser negativo)
   * @returns {Date} Nueva fecha
   */
  static addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }
  
  /**
   * Añade meses a una fecha
   * @param {Date} date - Fecha base
   * @param {number} months - Meses a añadir (puede ser negativo)
   * @returns {Date} Nueva fecha
   */
  static addMonths(date, months) {
    const result = new Date(date);
    result.setMonth(result.getMonth() + months);
    return result;
  }
  
  /**
   * Añade años a una fecha
   * @param {Date} date - Fecha base
   * @param {number} years - Años a añadir (puede ser negativo)
   * @returns {Date} Nueva fecha
   */
  static addYears(date, years) {
    const result = new Date(date);
    result.setFullYear(result.getFullYear() + years);
    return result;
  }
  
  /**
   * Calcula la diferencia entre dos fechas en días
   * @param {Date} date1 - Fecha inicial
   * @param {Date} date2 - Fecha final
   * @returns {number} Diferencia en días
   */
  static diffInDays(date1, date2) {
    const timeDiff = Math.abs(date2.getTime() - date1.getTime());
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  }
  
  /**
   * Calcula la diferencia entre dos fechas en meses
   * @param {Date} date1 - Fecha inicial
   * @param {Date} date2 - Fecha final
   * @returns {number} Diferencia en meses
   */
  static diffInMonths(date1, date2) {
    const yearDiff = date2.getFullYear() - date1.getFullYear();
    const monthDiff = date2.getMonth() - date1.getMonth();
    return yearDiff * 12 + monthDiff;
  }
  
  /**
   * Verifica si una fecha es hoy
   * @param {Date} date - Fecha a verificar
   * @returns {boolean} True si es hoy
   */
  static isToday(date) {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  }
  
  /**
   * Verifica si una fecha es ayer
   * @param {Date} date - Fecha a verificar
   * @returns {boolean} True si es ayer
   */
  static isYesterday(date) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    return date.getDate() === yesterday.getDate() &&
           date.getMonth() === yesterday.getMonth() &&
           date.getFullYear() === yesterday.getFullYear();
  }
  
  /**
   * Verifica si una fecha es mañana
   * @param {Date} date - Fecha a verificar
   * @returns {boolean} True si es mañana
   */
  static isTomorrow(date) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return date.getDate() === tomorrow.getDate() &&
           date.getMonth() === tomorrow.getMonth() &&
           date.getFullYear() === tomorrow.getFullYear();
  }
  
  /**
   * Verifica si una fecha está en el pasado
   * @param {Date} date - Fecha a verificar
   * @returns {boolean} True si está en el pasado
   */
  static isPast(date) {
    return date < new Date();
  }
  
  /**
   * Verifica si una fecha está en el futuro
   * @param {Date} date - Fecha a verificar
   * @returns {boolean} True si está en el futuro
   */
  static isFuture(date) {
    return date > new Date();
  }
  
  /**
   * Obtiene el primer día del mes
   * @param {Date} date - Fecha de referencia
   * @returns {Date} Primer día del mes
   */
  static getFirstDayOfMonth(date) {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }
  
  /**
   * Obtiene el último día del mes
   * @param {Date} date - Fecha de referencia
   * @returns {Date} Último día del mes
   */
  static getLastDayOfMonth(date) {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0);
  }
  
  /**
   * Obtiene el primer día de la semana (lunes)
   * @param {Date} date - Fecha de referencia
   * @returns {Date} Primer día de la semana
   */
  static getFirstDayOfWeek(date) {
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Ajustar para que la semana empiece en lunes
    return new Date(date.setDate(diff));
  }
  
  /**
   * Obtiene el último día de la semana (domingo)
   * @param {Date} date - Fecha de referencia
   * @returns {Date} Último día de la semana
   */
  static getLastDayOfWeek(date) {
    const firstDay = this.getFirstDayOfWeek(date);
    const lastDay = new Date(firstDay);
    lastDay.setDate(firstDay.getDate() + 6);
    return lastDay;
  }
  
  /**
   * Verifica si dos fechas son el mismo día
   * @param {Date} date1 - Primera fecha
   * @param {Date} date2 - Segunda fecha
   * @returns {boolean} True si son el mismo día
   */
  static isSameDay(date1, date2) {
    return date1.getDate() === date2.getDate() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear();
  }
  
  /**
   * Obtiene el nombre del mes
   * @param {number} month - Número del mes (0-11)
   * @param {string} format - Formato ('long', 'short')
   * @returns {string} Nombre del mes
   */
  static getMonthName(month, format = 'long') {
    const date = new Date();
    date.setMonth(month);
    
    return new Intl.DateTimeFormat('es-MX', { month: format }).format(date);
  }
  
  /**
   * Obtiene el nombre del día de la semana
   * @param {number} day - Número del día (0-6, 0=domingo)
   * @param {string} format - Formato ('long', 'short')
   * @returns {string} Nombre del día
   */
  static getDayName(day, format = 'long') {
    const date = new Date();
    // Ajustar al día específico
    const currentDay = date.getDay();
    const diff = day - currentDay;
    date.setDate(date.getDate() + diff);
    
    return new Intl.DateTimeFormat('es-MX', { weekday: format }).format(date);
  }
  
  /**
   * Convierte una cadena de fecha a objeto Date
   * @param {string} dateString - Cadena de fecha
   * @param {string} format - Formato de la cadena
   * @returns {Date} Objeto Date
   */
  static parse(dateString, format = 'yyyy-mm-dd') {
    if (!dateString) return null;
    
    const formats = {
      'yyyy-mm-dd': (str) => {
        const [year, month, day] = str.split('-');
        return new Date(year, month - 1, day);
      },
      'dd/mm/yyyy': (str) => {
        const [day, month, year] = str.split('/');
        return new Date(year, month - 1, day);
      },
      'mm/dd/yyyy': (str) => {
        const [month, day, year] = str.split('/');
        return new Date(year, month - 1, day);
      }
    };
    
    const parser = formats[format];
    if (parser) {
      return parser(dateString);
    }
    
    // Intento de parseo automático
    const parsed = new Date(dateString);
    return isNaN(parsed.getTime()) ? null : parsed;
  }
  
  /**
   * Genera un rango de fechas
   * @param {Date} startDate - Fecha de inicio
   * @param {Date} endDate - Fecha de fin
   * @param {string} interval - Intervalo ('day', 'week', 'month')
   * @returns {Array} Array de fechas
   */
  static generateDateRange(startDate, endDate, interval = 'day') {
    const dates = [];
    let current = new Date(startDate);
    
    while (current <= endDate) {
      dates.push(new Date(current));
      
      switch (interval) {
        case 'day':
          current.setDate(current.getDate() + 1);
          break;
        case 'week':
          current.setDate(current.getDate() + 7);
          break;
        case 'month':
          current.setMonth(current.getMonth() + 1);
          break;
        default:
          current.setDate(current.getDate() + 1);
      }
    }
    
    return dates;
  }
  
  /**
   * Obtiene la fecha y hora actual en formato ISO sin milisegundos
   * @returns {string} Fecha y hora actual
   */
  static getCurrentDateTimeISO() {
    return new Date().toISOString().split('.')[0] + 'Z';
  }
  
  /**
   * Obtiene la fecha actual en formato YYYY-MM-DD
   * @returns {string} Fecha actual
   */
  static getCurrentDateISO() {
    return new Date().toISOString().split('T')[0];
  }
}

export default DateUtils;