import React from 'react';
import styles from './StatCard.module.css';
import Card from '../../common/Card/Card';

const StatCard = ({ title, value, icon, trend, trendValue, color = 'blue' }) => {
  return (
    <Card className={styles.statCard}>
      <div className={styles.content}>
        <div className={styles.info}>
          <p className={styles.title}>{title}</p>
          <h3 className={styles.value}>{value}</h3>
          {trend && (
            <div className={`${styles.trend} ${styles[trend]}`}>
              <span>{trend === 'up' ? '↑' : '↓'}</span>
              <span>{trendValue}</span>
            </div>
          )}
        </div>
        <div className={`${styles.iconWrapper} ${styles[color]}`}>
          {icon}
        </div>
      </div>
    </Card>
  );
};

export default StatCard;