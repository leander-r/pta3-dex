const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'pta-game-data.min.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

data.pokemonSkills = {
  // Canonical skills
  "Alluring": { "description": "Attracts others with their aroma.", "type": "canonical" },
  "Amorphous": { "description": "Can change their body into a liquid-like state.", "type": "canonical" },
  "Beached": { "description": "Needs to be in water; suffers on dry land.", "type": "canonical" },
  "Burrow": { "description": "Can move through earth easily.", "type": "canonical" },
  "Chilled": { "description": "Always cold; unaffected by freezing temperatures.", "type": "canonical" },
  "Climber": { "description": "Treats walls and ceilings as normal terrain.", "type": "canonical" },
  "Firestarter": { "description": "Can create fire.", "type": "canonical" },
  "Flight": { "description": "Can fly; ignores ground-level obstacles.", "type": "canonical" },
  "Flopper": { "description": "Treats dry land as special terrain; moves awkwardly out of water.", "type": "canonical" },
  "Fountain": { "description": "Can create water.", "type": "canonical" },
  "Freezer": { "description": "Can create ice.", "type": "canonical" },
  "Gilled": { "description": "Can breathe underwater.", "type": "canonical" },
  "Glow": { "description": "Can produce light.", "type": "canonical" },
  "Groundshaper": { "description": "Can manipulate the ground.", "type": "canonical" },
  "Guster": { "description": "Can produce wind.", "type": "canonical" },
  "Heater": { "description": "Always warm; unaffected by extreme heat.", "type": "canonical" },
  "Hover": { "description": "Can hover just above the ground; ignores ground-level hazards.", "type": "canonical" },
  "Inflatable": { "description": "Can expand their body to a larger size.", "type": "canonical" },
  "Intelligence": { "description": "Very smart; capable of complex reasoning.", "type": "canonical" },
  "Invisibility": { "description": "Can turn invisible.", "type": "canonical" },
  "Magnetic": { "description": "Controls magnetic fields.", "type": "canonical" },
  "Mind Lock": { "description": "Mind cannot be read by psychic means.", "type": "canonical" },
  "Modular": { "description": "Body consists of multiple separable parts.", "type": "canonical" },
  "Phasing": { "description": "Can move through solid objects.", "type": "canonical" },
  "Reach": { "description": "Melee range is 15 ft. instead of the standard 5 ft.", "type": "canonical" },
  "Repulsive": { "description": "Repels others with a foul smell.", "type": "canonical" },
  "Shrinkable": { "description": "Can shrink their body to a smaller size.", "type": "canonical" },
  "Sinker": { "description": "Cannot swim; sinks in water.", "type": "canonical" },
  "Sprouter": { "description": "Can manipulate plant life.", "type": "canonical" },
  "Stealth": { "description": "Can make Stealth skill checks to hide; naturally adept at moving quietly.", "type": "canonical" },
  "Strength": { "description": "Very strong; can move heavy objects and obstacles.", "type": "canonical" },
  "Swimmer": { "description": "Can swim.", "type": "canonical" },
  "Telekinetic": { "description": "Can move things with their mind.", "type": "canonical" },
  "Telepath": { "description": "Can read the emotions of others.", "type": "canonical" },
  "Threaded": { "description": "Can move around on spun threads or vines.", "type": "canonical" },
  "Tough Cookie": { "description": "Lowers the chance of suffering a mortal wound.", "type": "canonical" },
  "Tracker": { "description": "Can follow scents to track targets.", "type": "canonical" },
  "Wired": { "description": "Can enter and travel through electronics.", "type": "canonical" },
  "Zapper": { "description": "Can produce electricity.", "type": "canonical" },
  // Species-specific skills
  "Cloak": {
    "description": "Burmy's appearance changes depending on where it spends time. After ~10 minutes in a forest/jungle, desert/mountain, or city, it changes to Plant, Sandy, or Trash cloak respectively.",
    "type": "species-specific",
    "species": ["Burmy", "Wormadam (Plant Cloak)", "Wormadam (Sandy Cloak)", "Wormadam (Trash Cloak)"]
  },
  "Collector": {
    "description": "Gimmighoul can change into its Roaming form by abandoning its chest of gold pieces. With at least 50 gold pieces, it can revert to Chest form.",
    "type": "species-specific",
    "species": ["Gimmighoul (Chest)", "Gimmighoul (Roaming)"]
  },
  "Dancer": {
    "description": "Oricorio's appearance and type change with nectars it drinks. Four forms: Baile (Fire), Pom-Pom (Electric), Pa'u (Psychic), Sensu (Ghost).",
    "type": "species-specific",
    "species": ["Oricorio"]
  },
  "Flower Bond": {
    "description": "Bonded to a chosen flower from birth. The Pokemon draws energy from and cares for its flower throughout its life.",
    "type": "species-specific",
    "species": ["Flabebe", "Floette", "Florges"]
  },
  "Gang Down": {
    "description": "Squawkabilly can have Green, Blue, Yellow, or White plumage. These colors are determined at birth and never change.",
    "type": "species-specific",
    "species": ["Squawkabilly"]
  },
  "Genetic Relation": {
    "description": "Volbeat and Illumise are closely related; Volbeat can breed to produce Illumise.",
    "type": "species-specific",
    "species": ["Volbeat", "Illumise"]
  },
  "Mausfam": {
    "description": "Maushold can have one to four tiny maus accompanying it. Those with 3 or 4 tiny maus are Small (Size).",
    "type": "species-specific",
    "species": ["Maushold"]
  },
  "Pumpkin Sized": {
    "description": "Comes in different sizes. The Pokemon's stats vary depending on its size.",
    "type": "species-specific",
    "species": ["Pumpkaboo", "Gourgeist"]
  },
  "Seasonal": {
    "description": "Appearance changes depending on the current season of the year.",
    "type": "species-specific",
    "species": ["Deerling", "Sawsbuck"]
  },
  "Segmented": {
    "description": "Dudunsparce can have two to five middle segments. Those with 4 or 5 middle segments are Huge (Size).",
    "type": "species-specific",
    "species": ["Dudunsparce"]
  },
  "Sushimorph": {
    "description": "Tatsugiri has multiple fixed forms: Curly (orange), Droopy (pink/white), or Stretchy (yellow). Forms cannot be changed.",
    "type": "species-specific",
    "species": ["Tatsugiri"]
  },
  "Tall": {
    "description": "Has Reach (15 ft. melee) due to extreme height, but can bend to occupy a Gigantic area. Indoors, must use Gigantic form.",
    "type": "species-specific",
    "species": ["Exeggutor (Island)"]
  },
  "Toppings": {
    "description": "Alcremie's appearance varies based on what treats were mixed during evolution, creating many unique decorative forms.",
    "type": "species-specific",
    "species": ["Alcremie"]
  },
  "Unown Melding": {
    "description": "Up to six Unown can form one capturable entity. For every two in the group, one base stat is randomly raised +1. For every three, it gains an extra Hidden Power use.",
    "type": "species-specific",
    "species": ["Unown"]
  },
  "Unown Symbols": {
    "description": "Unown have hundreds of unique forms resembling letters, petroglyphs, hieroglyphs, and scripts from around the world.",
    "type": "species-specific",
    "species": ["Unown"]
  },
  "Wing Pattern": {
    "description": "Vivillon's wing patterns vary by global location of birth. This indicates origin, not rarity.",
    "type": "species-specific",
    "species": ["Vivillon"]
  }
};

data.lastUpdated = new Date().toISOString().split('T')[0];
fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
console.log('Added pokemonSkills with', Object.keys(data.pokemonSkills).length, 'entries.');
