// ============================================================
// CONTEXTS INDEX
// ============================================================
// Re-export all context providers and hooks

// AppContext
export { AppContext, useAppContext } from './AppContext.js';

// GameDataContext
import GameDataContext, { GameDataProvider, useGameData } from './GameDataContext.jsx';
export { GameDataContext, GameDataProvider, useGameData };

// UIContext
import UIContext, { UIProvider, useUI } from './UIContext.jsx';
export { UIContext, UIProvider, useUI };

// TrainerContext
import TrainerContext, { TrainerProvider, useTrainerContext } from './TrainerContext.jsx';
export { TrainerContext, TrainerProvider, useTrainerContext };

// PokemonContext
import PokemonContext, { PokemonProvider, usePokemonContext } from './PokemonContext.jsx';
export { PokemonContext, PokemonProvider, usePokemonContext };

// DataContext
import DataContext, { DataProvider, useData } from './DataContext.jsx';
export { DataContext, DataProvider, useData };
