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
        <div>
            <h2 className="section-title">Trainer</h2>

            {/* Top Section: Profile + Stats side by side */}
            <div className="grid-responsive-2 mb-lg">
                {/* Profile Section */}
                <TrainerProfile />

                {/* Stats Section */}
                <TrainerStats />
            </div>

            {/* Classes Section */}
            <TrainerClasses />

            {/* Skills Section */}
            <TrainerSkills />

            {/* Features Section */}
            <TrainerFeatures />
        </div>
    );
};

export default TrainerTab;
