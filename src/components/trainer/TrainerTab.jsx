// ============================================================
// Trainer Tab Component
// ============================================================
// Main trainer management tab

import React from 'react';
import TrainerProfile from './TrainerProfile.jsx';
import TrainerStats from './TrainerStats.jsx';
import TrainerOrigin from './TrainerOrigin.jsx';
import TrainerClasses from './TrainerClasses.jsx';
import TrainerFeatures from './TrainerFeatures.jsx';
import TrainerSkills from './TrainerSkills.jsx';
import TrainerEquipment from './TrainerEquipment.jsx';

/**
 * TrainerTab - Main trainer management container
 * Sub-components use contexts directly
 */
const TrainerTab = () => {
    return (
        <div className="trainer-layout">
            <h2 className="section-title" style={{ gridColumn: '1 / -1' }}>Trainer</h2>
            <div className="trainer-layout__profile">
                <TrainerProfile />
            </div>
            <div className="trainer-layout__data">
                <TrainerEquipment />
                <TrainerStats />
                <TrainerOrigin />
                <TrainerClasses />
                <TrainerSkills />
                <TrainerFeatures />
            </div>
        </div>
    );
};

export default TrainerTab;
