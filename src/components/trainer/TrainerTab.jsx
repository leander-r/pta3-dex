// ============================================================
// Trainer Tab Component
// ============================================================
// Main trainer management tab

import React from 'react';
import TrainerProfile from './TrainerProfile.jsx';
import TrainerStats from './TrainerStats.jsx';
import TrainerClasses from './TrainerClasses.jsx';
import TrainerFeatures from './TrainerFeatures.jsx';
import TrainerSkills from './TrainerSkills.jsx';

/**
 * TrainerTab - Main trainer management container
 * Sub-components use contexts directly
 */
const TrainerTab = () => {
    return (
        <div className="trainer-layout">
            <div className="trainer-layout__profile">
                <TrainerProfile />
            </div>
            <div className="trainer-layout__data">
                <TrainerStats />
                <TrainerClasses />
                <TrainerSkills />
                <TrainerFeatures />
            </div>
        </div>
    );
};

export default TrainerTab;
