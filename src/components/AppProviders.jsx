// ============================================================
// App Providers Component
// ============================================================
// Composes all context providers for the application

import React from 'react';
import { UIProvider } from '../contexts/UIContext.jsx';
import { GameDataProvider } from '../contexts/GameDataContext.jsx';
import { TrainerProvider } from '../contexts/TrainerContext.jsx';
import { PokemonProvider } from '../contexts/PokemonContext.jsx';
import { DataProvider } from '../contexts/DataContext.jsx';

/**
 * AppProviders - Wraps the application with all necessary context providers
 * This component composes the provider hierarchy to reduce nesting in App.jsx
 *
 * Provider order matters - outer providers are available to inner ones:
 * 1. UIProvider - UI state (modals, theme, etc.)
 * 2. GameDataProvider - Pokedex, GAME_DATA, custom species
 * 3. TrainerProvider - Trainer state and actions
 * 4. DataProvider - Save/Load/Export functionality
 * 5. PokemonProvider - Pokemon CRUD and move learning
 */
const AppProviders = ({
    children,
    // Custom species
    customSpecies,
    setCustomSpecies,
    // Trainers
    trainers,
    setTrainers,
    activeTrainerId,
    setActiveTrainerId,
    onLevelUp,
    // Pokemon state (from trainer)
    party,
    reserve,
    setParty,
    setReserve,
    // UI state
    pokemonView,
    setPokemonView,
    editingPokemon,
    setEditingPokemon,
    pendingMoveLearn,
    setPendingMoveLearn,
    showMoveLearnModal,
    setShowMoveLearnModal,
    moveLearnData,
    setMoveLearnData,
    // Inventory
    inventory,
    setInventory,
    // Move helpers
    getMovesForLevelRange,
    // Save callback
    onSaveComplete,
    // Notification callback
    showNotification
}) => {
    return (
        <UIProvider
            showMoveLearnModal={showMoveLearnModal}
            setShowMoveLearnModal={setShowMoveLearnModal}
            moveLearnData={moveLearnData}
            setMoveLearnData={setMoveLearnData}
            pendingMoveLearn={pendingMoveLearn}
            setPendingMoveLearn={setPendingMoveLearn}
        >
            <GameDataProvider
                customSpecies={customSpecies}
                setCustomSpecies={setCustomSpecies}
            >
                <TrainerProvider
                    initialTrainers={trainers}
                    initialActiveId={activeTrainerId}
                    onTrainersChange={setTrainers}
                    onLevelUp={onLevelUp}
                >
                    <DataProvider
                        trainers={trainers}
                        setTrainers={setTrainers}
                        activeTrainerId={activeTrainerId}
                        setActiveTrainerId={setActiveTrainerId}
                        inventory={inventory}
                        setInventory={setInventory}
                        customSpecies={customSpecies}
                        setCustomSpecies={setCustomSpecies}
                        onSaveComplete={onSaveComplete}
                    >
                        <PokemonProvider
                            party={party}
                            reserve={reserve}
                            setParty={setParty}
                            setReserve={setReserve}
                            pokemonView={pokemonView}
                            setPokemonView={setPokemonView}
                            editingPokemon={editingPokemon}
                            setEditingPokemon={setEditingPokemon}
                            customSpecies={customSpecies}
                            pendingMoveLearn={pendingMoveLearn}
                            setPendingMoveLearn={setPendingMoveLearn}
                            showMoveLearnModal={showMoveLearnModal}
                            setShowMoveLearnModal={setShowMoveLearnModal}
                            setMoveLearnData={setMoveLearnData}
                            onLevelUp={onLevelUp}
                            getMovesForLevelRange={getMovesForLevelRange}
                            inventory={inventory}
                            setInventory={setInventory}
                            showNotification={showNotification}
                        >
                            {children}
                        </PokemonProvider>
                    </DataProvider>
                </TrainerProvider>
            </GameDataProvider>
        </UIProvider>
    );
};

export default AppProviders;
