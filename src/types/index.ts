export interface BaseStats {
  hp: number;
  atk: number;
  def: number;
  satk: number;
  sdef: number;
  spd: number;
}

export interface Move {
  name: string;
  type: string;
  category: string;
  frequency: string;
  damage: string;
  range: string;
  effect: string;
  source: string;
  learnedAtLevel?: number;
}

export interface Pokemon {
  id: number;
  name: string;
  species: string;
  gender: string;
  avatar: string;
  level: number;
  exp: number;
  types: string[];
  nature: string;
  ability: string;
  baseStats: BaseStats;
  addedStats: BaseStats;
  moves: Move[];
  notes: string;
  loyalty: number;
  statPointsAvailable: number;
}

export interface Trainer {
  id: number;
  name: string;
  gender: string;
  age: string;
  avatar: string;
  level: number;
  experience: number;
  classes: string[];
  stats: BaseStats;
  statPoints: number;
  levelStatPoints: number;
  featPoints: number;
  skills: Record<string, number>;
  notes: string;
  badges: string[];
  money: number;
  party: Pokemon[];
  reserve: Pokemon[];
}

export interface DiscordWebhook {
  url: string;
  enabled: boolean;
}

export interface InventoryItem {
  id: number;
  name: string;
  quantity: number;
  description: string;
  category: string;
}

export interface SaveData {
  version: string;
  trainers: Trainer[];
  activeTrainerId: number;
  inventory: InventoryItem[];
  lastSaved: string;
}

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastEvent {
  message: string;
  type: ToastType;
  duration: number;
}
