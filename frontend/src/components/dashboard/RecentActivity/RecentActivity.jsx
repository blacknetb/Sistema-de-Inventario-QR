import React from 'react';
import styles from './RecentActivity.module.css';
import Card from '../../common/Card/Card';

const RecentActivity = ({ activities }) => {
  const getActivityIcon = (type) => {
    switch (type) {
      case 'entrada':
        return '📥';
      case 'salida':
        return '📤';
      case 'edicion':
        return '✏️';
      case 'creacion':
        return '➕';
      default:
        return '📋';
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'entrada':
        return 'green';
      case 'salida':
        return 'red';
      case 'edicion':
        return 'yellow';
      case 'creacion':
        return 'blue';
      default:
        return 'gray';
    }
  };

  return (
    <Card title="Actividad Reciente">
      <div className={styles.activityList}>
        {activities.map((activity, index) => (
          <div key={index} className={styles.activityItem}>
            <div className={`${styles.iconWrapper} ${styles[getActivityColor(activity.type)]}`}>
              <span className={styles.icon}>{getActivityIcon(activity.type)}</span>
            </div>
            <div className={styles.content}>
              <p className={styles.description}>{activity.description}</p>
              <p className={styles.meta}>
                <span className={styles.user}>{activity.user}</span>
                <span className={styles.time}>{activity.time}</span>
              </p>
            </div>
          </div>
        ))}
        {activities.length === 0 && (
          <p className={styles.empty}>No hay actividad reciente</p>
        )}
      </div>
    </Card>
  );
};

export default RecentActivity;