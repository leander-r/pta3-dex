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
 */
const TrainerTab = ({
    trainer,
    setTrainer,
    levelUpTrainer,
    levelDownTrainer,
    respecTrainer,
    updateTrainerStat,
    calculateMaxHP,
    calculateModifier,
    GAME_DATA,
    showDetail
}) => {
    return (
        <div>
            <h2 className="section-title">Trainer</h2>

            {/* Top Section: Profile + Stats side by side */}
            <div className="grid-responsive-2 mb-lg">
                {/* Profile Section */}
                <TrainerProfile
                    trainer={trainer}
                    setTrainer={setTrainer}
                    levelUpTrainer={levelUpTrainer}
                    levelDownTrainer={levelDownTrainer}
                    respecTrainer={respecTrainer}
                    calculateMaxHP={calculateMaxHP}
                />

                {/* Stats Section */}
                <TrainerStats
                    trainer={trainer}
                    updateTrainerStat={updateTrainerStat}
                    calculateModifier={calculateModifier}
                />
            </div>

            {/* Classes Section */}
            <TrainerClasses
                trainer={trainer}
                setTrainer={setTrainer}
                GAME_DATA={GAME_DATA}
            />

            {/* Features Section */}
            <TrainerFeatures
                trainer={trainer}
                setTrainer={setTrainer}
                GAME_DATA={GAME_DATA}
                showDetail={showDetail}
            />

            {/* Skills Section */}
            <TrainerSkills
                trainer={trainer}
                setTrainer={setTrainer}
                GAME_DATA={GAME_DATA}
            />
        </div>
    );
};

export default TrainerTab;
