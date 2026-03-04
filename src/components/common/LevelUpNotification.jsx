// ============================================================
// Level Up Notification Component
// ============================================================

import React from 'react';

/**
 * LevelUpNotification - Shows level up/evolution notifications
 * @param {Object} props
 * @param {Object} props.notification - Notification data
 */
const LevelUpNotification = ({ notification }) => {
    if (!notification) return null;

    // Handle evolution/devolution notifications
    if (notification.type === 'evolution' || notification.type === 'devolution') {
        return (
            <div className="level-up-notification" style={{
                background: notification.type === 'evolution'
                    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                    : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
            }}>
                <h4>{notification.type === 'evolution' ? 'Evolution!' : 'Devolution'}</h4>
                <p>{notification.pokemon} {notification.message}</p>
            </div>
        );
    }

    // Handle trainer level up notifications
    return (
        <div className="level-up-notification">
            <h4>Level Up!</h4>
            <p>{notification.name} reached level {notification.level}!</p>
            {notification.statPoints > 0 && (
                <p>+{notification.statPoints} stat point(s)!</p>
            )}

            {notification.note && (
                <p style={{ fontStyle: 'italic', color: '#ffd700' }}>{notification.note}</p>
            )}
        </div>
    );
};

export default LevelUpNotification;
