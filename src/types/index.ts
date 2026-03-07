export interface BaseStats {
  hp: number;
  atk: number;
  def: number;
  satk: number;
  sdef: number;
  spd: number;
}

export interface TrainerStats {
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
  types: string[];
  nature: string;
  ability: string;
  baseStats: BaseStats;
  moves: Move[];
  notes: string;
  loyalty: number;
  teraType?: string;
}

export interface Trainer {
  id: number;
  name: string;
  gender: string;
  age: string;
  avatar: string;
  level: number;
  honors: number;
  maxHp: number;
  hpRolls: number[];
  classes: string[];
  stats: TrainerStats;
  statPoints: number;
  levelStatPoints: number;
  skills: Record<string, number>;
  notes: string;
  badges: string[];
  money: number;
  party: Pokemon[];
  reserve: Pokemon[];
  equippedItems?: string[];
  dailyBonusUsed?: string;
}

export interface DiscordWebhook {
  url: string;
  enabled: boolean;
}

export interface InventoryItem {
  id: number;
  name: string;
  quantity: number;
  effect: string;
  type: string;
  price?: number;
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
