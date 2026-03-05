const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'pta-game-data.min.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

// Full descriptions from PTA3 Pokedex pages 14-18
data.pokemonSkills = {
  "Alluring": {
    "description": "Pokemon who are alluring smell very pleasant. They may attract wild Pokemon easily. Attention is commonly turned toward fragrant, alluring Pokemon by wilds. If a Pokemon learns the move Aromatherapy or Sweet Scent and does not have the alluring skill, they gain alluring.",
    "shortDescription": "Attracts others with their aroma.",
    "type": "canonical",
    "gainedFrom": ["Aromatherapy", "Sweet Scent"]
  },
  "Amorphous": {
    "description": "Amorphous Pokemon have an inconsistent shape. They can flatten and reform themselves like gel. They can stretch out their body material and condense themselves as well. By doing this, a Pokemon can access places others couldn't, or bypass a door or two, only to let their non-amorphous friends in afterwards.",
    "shortDescription": "Can change their body into a liquid-like state.",
    "type": "canonical"
  },
  "Beached": {
    "description": "When a Pokemon has the beached skill, they need to stay in water. Beached means the Pokemon has a hard time battling when not submerged in water. For every round of an encounter the Pokemon is not at least halfway submerged in water, they lose 10% of their max HP. If the Pokemon is lowered to -100% HP for more than 10 rounds of combat, make a deaths savings roll as usual. Beached Pokemon can calmly remain out of water.",
    "shortDescription": "Needs to be in water.",
    "type": "canonical"
  },
  "Burrow": {
    "description": "Pokemon with burrow can quickly dig through solid earth, rock, clay, or even soft sand. When moving through any earth, burrowing Pokemon treat underground as normal terrain, without penalizing their movement speed. If a Pokemon learns the move Dig and does not have the burrow skill, they gain burrow.",
    "shortDescription": "Moves through earth easily.",
    "type": "canonical",
    "gainedFrom": ["Dig"]
  },
  "Chilled": {
    "description": "Chilled Pokemon are always cold to the touch.",
    "shortDescription": "Always cold.",
    "type": "canonical"
  },
  "Climber": {
    "description": "Pokemon with an aptitude for climbing, or just many sticky legs, treat vertical terrain and even ceiling surfaces as normal terrain that they can navigate without affecting their movement speed.",
    "shortDescription": "Treats walls and ceilings as normal terrain.",
    "type": "canonical"
  },
  "Firestarter": {
    "description": "A Pokemon who has the firestarter skill can produce flames. They can control how lightly or powerfully they produce the fire, creating puffs of fire the size of a lighter or a large burst of fire capable of engulfing a tree. If a Pokemon learns the move Blast Burn, Blaze Kick, Ember, Fiery Dance, Fire Blast, Fire Fang, Fire Lash, Fire Punch, Fire Spin, Flame Burst, Flame Charge, Flame Wheel, Flamethrower, Flare Blitz, Heat Crash, Heat Wave, or Incinerate and does not have the firestarter Skill, they gain firestarter.",
    "shortDescription": "Can create fire.",
    "type": "canonical",
    "gainedFrom": ["Blast Burn", "Blaze Kick", "Ember", "Fiery Dance", "Fire Blast", "Fire Fang", "Fire Lash", "Fire Punch", "Fire Spin", "Flame Burst", "Flame Charge", "Flame Wheel", "Flamethrower", "Flare Blitz", "Heat Crash", "Heat Wave", "Incinerate"]
  },
  "Flight": {
    "description": "Pokemon with flight are not bound to the ground. Through means of wings, or psychic ability, or electromagnetic levitation, these Pokemon can remain in the air for hours at a time, sometimes never needing to return to the ground. These Pokemon can use their movement speeds in the air. If a Pokemon learns the move Fly and does not have the flight Skill, they gain flight.",
    "shortDescription": "Can fly.",
    "type": "canonical",
    "gainedFrom": ["Fly"]
  },
  "Flopper": {
    "description": "A Pokemon with the flopper Skill probably doesn't like being out of water. While it's not dangerous to move around on, a flopper treats all normal terrain as difficult terrain and all difficult terrain as blocking terrain. If anything modifies how a Pokemon moves making movement easier, Pokemon with flopper will still treat difficult terrain as difficult terrain but can then flop around on normal terrain without trouble.",
    "shortDescription": "Treats dry land as special terrain.",
    "type": "canonical"
  },
  "Fountain": {
    "description": "A Pokemon who has the fountain skill can produce freshwater. They can control how lightly or powerfully they produce the water, sprinkling water or forcefully shooting water with the strength of a fire hose. If a Pokemon learns the move Hydro Cannon, Hydro Pump, Liquidation, Scald, Soak, Water Gun, Water Pulse, Waterfall, or Whirlpool and does not have the fountain Skill, they gain fountain.",
    "shortDescription": "Can create water.",
    "type": "canonical",
    "gainedFrom": ["Hydro Cannon", "Hydro Pump", "Liquidation", "Scald", "Soak", "Water Gun", "Water Pulse", "Waterfall", "Whirlpool"]
  },
  "Freezer": {
    "description": "When a Pokemon has the freezer skill, they can produce ice at a controlled rate. They can make puffs of snow, or ice cubes, or spread icicles across surfaces. As their action, a Pokemon with freezer can target an area on the ground and slowly turn it into icy, difficult terrain. They can make one 5x5 ft. area into icy or fluffy snowy difficult terrain per 6 seconds. If a Pokemon learns the move Aurora Beam, Blizzard, Freeze-Dry, Frost Breath, Ice Beam, Ice Fang, Ice Punch, Icy Wind, Powder Snow, or Sheer Cold, and does not have the freezer skill, they gain freezer.",
    "shortDescription": "Can create ice.",
    "type": "canonical",
    "gainedFrom": ["Aurora Beam", "Blizzard", "Freeze-Dry", "Frost Breath", "Ice Beam", "Ice Fang", "Ice Punch", "Icy Wind", "Powder Snow", "Sheer Cold"]
  },
  "Gilled": {
    "description": "A gilled Pokemon can breathe underwater. It never needs to come up for air, remaining underwater for as long as it wants to.",
    "shortDescription": "Can breathe underwater.",
    "type": "canonical"
  },
  "Glow": {
    "description": "A Pokemon with the glow skill can emit light from a part of its body. Depending on the variety of wild Pokemon nearby, it might attract Pokemon or ward them away. If a Pokemon learns the move Flash or stat passive Tail Glow and does not have the glow skill, they gain glow.",
    "shortDescription": "Can produce light.",
    "type": "canonical",
    "gainedFrom": ["Flash", "Tail Glow (passive)"]
  },
  "Groundshaper": {
    "description": "A Pokemon with the groundshaper skill can skillfully and precisely transform the terrain around them to create difficult terrain or flatten out rough terrain to create normal terrain. As their action, a Pokemon with groundshaper can target an area on the ground and slowly turn it into sandy or rock covered difficult terrain, or change difficult terrain into smooth dirt-covered normal terrain. They can make one 5x5 ft. area into difficult terrain or normal terrain per 6 seconds. If a Pokemon learns the move Bulldoze, Earth Power, Earthquake, Sand Tomb, or Stomping Tantrum and does not have the groundshaper Skill, they gain groundshaper.",
    "shortDescription": "Can manipulate the ground.",
    "type": "canonical",
    "gainedFrom": ["Bulldoze", "Earth Power", "Earthquake", "Sand Tomb", "Stomping Tantrum"]
  },
  "Guster": {
    "description": "A Pokemon with the guster skill can create bursts of wind. The power can vary from a light breeze to a powerful burst of air capable of lifting light objects into the air or providing lift for a chute. If a Pokemon learns the move Gust, or Hurricane, or the stat passive Tailwind and does not have the guster Skill, they gain guster.",
    "shortDescription": "Can produce wind.",
    "type": "canonical",
    "gainedFrom": ["Gust", "Hurricane", "Tailwind (passive)"]
  },
  "Heater": {
    "description": "A Pokemon with the heater skill is always warm when touched.",
    "shortDescription": "Always warm.",
    "type": "canonical"
  },
  "Hover": {
    "description": "Hovering Pokemon use some force in order to float above the ground, or even over water, without touching the surface. Whether its magnetic, gravitational, air currents, or some other magical power, it's uncertain what keeps some of these Pokemon in the air, but they can't go higher than 10 ft off the ground while staying airborne indefinitely. If a Pokemon learns the move Magnet Rise and does not have the hover skill, they gain hover.",
    "shortDescription": "Can hover just above the ground.",
    "type": "canonical",
    "gainedFrom": ["Magnet Rise"]
  },
  "Inflatable": {
    "description": "A Pokemon with the skill inflatable can expand its size from tiny to small, small to medium, medium to large, large to huge, or huge to gigantic. They do so by inhaling vast amounts of air or temporarily growing the size of their plant-like bodies. While inflated, a Pokemon does not change its weight. A Pokemon can maintain its larger size for up to 5 mins. If a Pokemon learns the move Stockpile or the stat passive Growth and does not have the inflatable skill, they gain inflatable.",
    "shortDescription": "Can expand their body to a larger size.",
    "type": "canonical",
    "gainedFrom": ["Stockpile", "Growth (passive)"]
  },
  "Intelligence": {
    "description": "Intelligence marks a Pokemon for higher brain function and often these Pokemon can surpass human intellect. While intelligent Pokemon are capable of independent decisions, they still trust your leadership and will usually wait for your instruction. If you are unconscious or otherwise unable to make decisions, an intelligent Pokemon will act of its own accord, once per round if none of your other Pokemon are acting that round. Intelligent Pokemon are problem solvers and can be dangerous foes if encountered in the wild.",
    "shortDescription": "Very smart; capable of independent decisions.",
    "type": "canonical"
  },
  "Invisibility": {
    "description": "Pokemon who have the invisibility skill can turn invisible. Pokemon may not perform moves while invisible. While invisible, foes must roll +4 during accuracy checks to hit you and still need a general idea of where you last were to hit you. When a Pokemon turns invisible, they can only remain invisible for up to 4 minutes. After becoming visible, they must wait two plus the number of minutes they spent invisible before using their invisibility again. You cannot turn invisible in the same turn you've attacked.",
    "shortDescription": "Can turn invisible.",
    "type": "canonical"
  },
  "Magnetic": {
    "description": "Magnetic Pokemon can lightly manipulate magnetic fields. With this, they can repel iron and/or steel or attract iron and/or steel, holding it to their body or pushing it away. Through this magnetic manipulation, they can also feel magnetic fields and discern north. If a Pokemon learns the move Magnet Bomb, Magnet Pull, or Magnet Rise and does not have the magnetic Skill, they gain magnetic.",
    "shortDescription": "Controls magnetic fields.",
    "type": "canonical",
    "gainedFrom": ["Magnet Bomb", "Magnet Pull", "Magnet Rise"]
  },
  "Mind Lock": {
    "description": "Pokemon who have the skill mind lock cannot have their minds read.",
    "shortDescription": "Mind cannot be read.",
    "type": "canonical"
  },
  "Modular": {
    "description": "Modular Pokemon are often made up of separate units that make up their body or consciousness. Modular Pokemon can often take up different spaces simultaneously during combat and reshape themselves to fit in different ways at different sizes. Modular Pokemon stats do not change no matter how they are configured. Modular Pokemon cannot separate a part of themselves further than 50 ft from any other part of their body.",
    "shortDescription": "Body consists of multiple separable parts.",
    "type": "canonical"
  },
  "Phasing": {
    "description": "A Pokemon with phasing may move through hindering or blocking terrain without their movement speed being affected. They can turn intangible and move through solid walls or another Pokemon. A Pokemon can remain intangible with phasing for up to 30 seconds. If a Pokemon remains intangible, they may not perform moves during their turn. Attacks that use the Special Attack stat can still target and hit a phasing Pokemon.",
    "shortDescription": "Can move through solid objects.",
    "type": "canonical"
  },
  "Reach": {
    "description": "A Pokemon with reach may make melee attacks from up to 25 ft. away. Pokemon with reach are either really large or have a stretchy limb with which they can strike foes from a distance.",
    "shortDescription": "Melee range is 25 ft.",
    "type": "canonical"
  },
  "Repulsive": {
    "description": "This Pokemon can emit an unpleasant odor that Wild Pokemon find repulsive. Wild Pokemon may ignore this smell to protect something precious to them. If a Pokemon learns the move Corrosive Gas, Gastro Acid, Gunk Shot, Poison Gas, Sludge, Sludge Bomb, Sludge Wave, Smog, or Venom Drench and does not have the repulsive Skill, they gain repulsive.",
    "shortDescription": "Repels others with a foul smell.",
    "type": "canonical",
    "gainedFrom": ["Corrosive Gas", "Gastro Acid", "Gunk Shot", "Poison Gas", "Sludge", "Sludge Bomb", "Sludge Wave", "Smog", "Venom Drench"]
  },
  "Shrinkable": {
    "description": "A Pokemon with the skill shrinkable can shrink its size from gigantic to huge, huge to large, large to medium, medium to small, or small to tiny. While shrunken, a Pokemon may not perform any moves and it does not change its weight. A Pokemon can maintain its smaller size for up to 5 mins. If a Pokemon learns the move Minimize and does not have the shrinkable skill, they gain shrinkable.",
    "shortDescription": "Can shrink their body to a smaller size.",
    "type": "canonical",
    "gainedFrom": ["Minimize"]
  },
  "Sinker": {
    "description": "Sinker means the Pokemon cannot swim, or move while submerged in water. For every round of an encounter the Pokemon is in water that is deep enough for them to stand submerged in, they lose 10% of their max HP. If the Pokemon is lowered to -100% HP for more than 10 rounds of combat, make a deaths savings roll as usual. If a Pokemon gains the swimmer skill, they lose their sinker skill.",
    "shortDescription": "Cannot swim; sinks in water.",
    "type": "canonical"
  },
  "Sprouter": {
    "description": "A Pokemon with the sprouter skill can rapidly influence the growth of plants and flora around them. Over 6 seconds, a sprouter can grow a plant 5 ft taller or wider than it previously was. Through the use of sprouter, the Pokemon can also make plants grow up to twice of the normal size they would become naturally. If a Pokemon learns the move Frenzy Plant, Grass Knot, Ingrain, Leech Seed, or Synthesis and does not have the sprouter Skill, they gain sprouter.",
    "shortDescription": "Can manipulate plant life.",
    "type": "canonical",
    "gainedFrom": ["Frenzy Plant", "Grass Knot", "Ingrain", "Leech Seed", "Synthesis"]
  },
  "Stealth": {
    "description": "Not all Pokemon are allowed to make a stealth check. With stealth, Pokemon may roll a stealth check like a human trainer, adding their Speed modifier, calculated like a human's, to see if they can silently move during or outside of battle without being detected.",
    "shortDescription": "Can make Stealth skill checks to hide.",
    "type": "canonical"
  },
  "Strength": {
    "description": "A Pokemon with the strength skill is exceptionally strong, physically. With little effort, they can lift and move things vastly heavier than themselves. If they are featherweight, they can easily lift medium weights; if light weight, they can easily lift heavy weights; if medium weight, they can easily lift over 400-600 lbs.; at heavy weight, they can easily lift over 800-1000 lbs.; superweights with strength can lift or push up to 1000-1500 lbs. If a Pokemon learns the move Strength, they gain the strength skill.",
    "shortDescription": "Very strong; can move very heavy objects.",
    "type": "canonical",
    "gainedFrom": ["Strength"]
  },
  "Swimmer": {
    "description": "A swimmer loves the water. They treat knee-deep water as normal terrain as well as anything deeper than that. Swimmers are not always gilled, so make sure they're coming up for air when they need to.",
    "shortDescription": "Can swim.",
    "type": "canonical"
  },
  "Telekinetic": {
    "description": "Telekinetic Pokemon can move objects with their mind. They can lift things that are lighter than themselves. They can move objects up to 25 ft. away. If a Pokemon learns the move Confusion, Extrasensory, Psychic, or Trick and does not have the telekinetic skill, they gain telekinetic.",
    "shortDescription": "Can move things with their mind.",
    "type": "canonical",
    "gainedFrom": ["Confusion", "Extrasensory", "Psychic", "Trick"]
  },
  "Telepath": {
    "description": "A telepathic Pokemon can read the minds of people and other Pokemon. Telepathic Pokemon can project their thoughts to humans and Pokemon. The Pokemon can only read surface thoughts. Some species can only read emotions and will specify if that's the case. If a Pokemon learns the move Mind Reader or the ability Telepathy and does not have the telepath skill, they gain telepath.",
    "shortDescription": "Can read minds or emotions.",
    "type": "canonical",
    "gainedFrom": ["Mind Reader", "Telepathy (ability)"]
  },
  "Threaded": {
    "description": "If a Pokemon has the threaded skill they may move around by shooting out silk webs or strong vines. A threaded movement is when a Pokemon targets an object less than 30 ft. away and shoots a strong, thin line of silk, or extends a vine from themselves, and then quickly retracts that silk or vine, pulling itself towards the object if the Pokemon is lighter than the object or pulling the object towards the Pokemon if the object is lighter than it is. If you target another Pokemon or person with a threaded movement, roll your accuracy check against their Speed stat. You may still use a move on the same turn you perform a threaded movement. If a Pokemon learns the move Electro Web, Power Whip, Spider Web, or Vine Whip or the stat passive String Shot, and does not have the threaded skill, they gain threaded.",
    "shortDescription": "Can move around on spun threads or vines.",
    "type": "canonical",
    "gainedFrom": ["Electro Web", "Power Whip", "Spider Web", "Vine Whip", "String Shot (passive)"]
  },
  "Tough Cookie": {
    "description": "A tough cookie has it rough and is used to being knocked unconscious due to its frail constitution. If a Pokemon with Tough Cookie is knocked unconscious, the attacker must deal enough damage for the Tough Cookie to be at -25 HP or lower with the intention to kill in order to force a death saving throw. This only matters if you are playing with death saving throws.",
    "shortDescription": "Lowers the chance of a death saving throw.",
    "type": "canonical"
  },
  "Tracker": {
    "description": "Pokemon with the skill tracker have a strong sense of smell that they can use to follow other Pokemon or people using an Investigate skill check, adding their Special Attack modifier. If the Pokemon has smelled whom they want to track in the past day, or one of their personal belongings, they can pursue that prey with a skill check of 11 or better. To pick up a random scent from nothing, a skill check of 16 or better will allow the Pokemon to follow that scent. To pick up a specific scent from nothing, a skill check of 20 will allow the Pokemon to follow that scent. A Pokemon may only make these checks once per hour. If a Pokemon learns the move Odor Sleuth and does not have the tracker Skill, they gain tracker.",
    "shortDescription": "Can follow scents to track targets.",
    "type": "canonical",
    "gainedFrom": ["Odor Sleuth"]
  },
  "Wired": {
    "description": "Wired Pokemon have a special relation to electronic devices. They can enter machines and travel through connected electronics through any cords that connect them instantly. While inside machines, they can read data on the machine or they can even take control of the machine on a programming skill check adding their Special Attack modifier.",
    "shortDescription": "Can enter and travel through electronics.",
    "type": "canonical"
  },
  "Zapper": {
    "description": "Pokemon with the zapper skill can produce controlled electricity or send electrical currents through various conductive materials. If an electrical device is capable of being recharged, a Pokemon with zapper can recharge it to full power slowly. If a Pokemon learns the move Charge, Charge Beam, Discharge, Electrify, Electro Ball, Parabolic Charge, Shock Wave, Spark, Thunder, Thunder Fang, Thunder Punch, Thunder Shock, Thunder Wave, Thunderbolt, Volt Tackle, Wild Charge, or Zap Cannon and does not have the zapper skill, they gain zapper.",
    "shortDescription": "Can produce electricity.",
    "type": "canonical",
    "gainedFrom": ["Charge", "Charge Beam", "Discharge", "Electrify", "Electro Ball", "Parabolic Charge", "Shock Wave", "Spark", "Thunder", "Thunder Fang", "Thunder Punch", "Thunder Shock", "Thunder Wave", "Thunderbolt", "Volt Tackle", "Wild Charge", "Zap Cannon"]
  },
  // Species-specific skills
  "Cloak": {
    "description": "Burmy's appearance changes depending on where it spends time. After ~10 minutes in a forest/jungle, desert/mountain, or city, it changes to Plant, Sandy, or Trash cloak respectively.",
    "shortDescription": "Appearance changes based on environment.",
    "type": "species-specific",
    "species": ["Burmy", "Wormadam (Plant Cloak)", "Wormadam (Sandy Cloak)", "Wormadam (Trash Cloak)"]
  },
  "Collector": {
    "description": "Gimmighoul can change into its Roaming form by abandoning its chest of gold pieces. With at least 50 gold pieces, it can revert to Chest form.",
    "shortDescription": "Can switch between Chest and Roaming forms based on gold coins.",
    "type": "species-specific",
    "species": ["Gimmighoul (Chest)", "Gimmighoul (Roaming)"]
  },
  "Dancer": {
    "description": "Oricorio's appearance and type change with nectars it drinks. Four forms: Baile (Fire), Pom-Pom (Electric), Pa'u (Psychic), Sensu (Ghost).",
    "shortDescription": "Form and type change with nectars consumed.",
    "type": "species-specific",
    "species": ["Oricorio"]
  },
  "Flower Bond": {
    "description": "Bonded to a chosen flower from birth. The Pokemon draws energy from and cares for its flower throughout its life.",
    "shortDescription": "Bonded to a flower from birth.",
    "type": "species-specific",
    "species": ["Flabebe", "Floette", "Florges"]
  },
  "Gang Down": {
    "description": "Squawkabilly can have Green, Blue, Yellow, or White plumage. These colors are determined at birth and never change.",
    "shortDescription": "Plumage color determined at birth and permanent.",
    "type": "species-specific",
    "species": ["Squawkabilly"]
  },
  "Genetic Relation": {
    "description": "Volbeat and Illumise are closely related; Volbeat can breed to produce Illumise.",
    "shortDescription": "Volbeat can breed to produce Illumise.",
    "type": "species-specific",
    "species": ["Volbeat", "Illumise"]
  },
  "Mausfam": {
    "description": "Maushold can have one to four tiny maus accompanying it. Those with 3 or 4 tiny maus are Small (Size).",
    "shortDescription": "Accompanied by 1-4 tiny maus; larger groups are Small size.",
    "type": "species-specific",
    "species": ["Maushold"]
  },
  "Pumpkin Sized": {
    "description": "Comes in different sizes. The Pokemon's stats vary depending on its size.",
    "shortDescription": "Stats vary depending on size.",
    "type": "species-specific",
    "species": ["Pumpkaboo", "Gourgeist"]
  },
  "Seasonal": {
    "description": "Appearance changes depending on the current season of the year.",
    "shortDescription": "Appearance changes with the season.",
    "type": "species-specific",
    "species": ["Deerling", "Sawsbuck"]
  },
  "Segmented": {
    "description": "Dudunsparce can have two to five middle segments. Those with 4 or 5 middle segments are Huge (Size).",
    "shortDescription": "Body has 2-5 segments; 4-5 segments means Huge size.",
    "type": "species-specific",
    "species": ["Dudunsparce"]
  },
  "Sushimorph": {
    "description": "Tatsugiri has multiple fixed forms: Curly form is orange with darker orange on its back; Droopy form is pink with a white belly; Stretchy form is entirely yellow. Forms cannot be changed.",
    "shortDescription": "Has three fixed color forms that cannot be changed.",
    "type": "species-specific",
    "species": ["Tatsugiri"]
  },
  "Tall": {
    "description": "Has Reach (melee range up to 25 ft.) due to extreme height, but can bend to occupy a Gigantic area instead. Indoors, must use Gigantic form.",
    "shortDescription": "Reach due to height; can occupy Gigantic area indoors.",
    "type": "species-specific",
    "species": ["Exeggutor (Island)"]
  },
  "Toppings": {
    "description": "Alcremie's appearance varies based on what treats were mixed during evolution, creating many unique decorative forms.",
    "shortDescription": "Appearance varies based on evolution ingredients.",
    "type": "species-specific",
    "species": ["Alcremie"]
  },
  "Unown Melding": {
    "description": "Up to six Unown can form one capturable entity. For every two Unown in the group, one base stat is randomly raised by +1. For every three Unown in the group, it gains an extra Hidden Power use.",
    "shortDescription": "Up to 6 Unown merge into one entity with combined stat bonuses.",
    "type": "species-specific",
    "species": ["Unown"]
  },
  "Unown Symbols": {
    "description": "Unown have hundreds of unique forms resembling letters, petroglyphs, hieroglyphs, and scripts from around the world.",
    "shortDescription": "Hundreds of unique symbol-based forms.",
    "type": "species-specific",
    "species": ["Unown"]
  },
  "Wing Pattern": {
    "description": "Vivillon's wing patterns vary by global location of birth. This indicates origin, not rarity.",
    "shortDescription": "Wing pattern determined by birthplace; not a rarity indicator.",
    "type": "species-specific",
    "species": ["Vivillon"]
  }
};

data.lastUpdated = new Date().toISOString().split('T')[0];
fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
console.log('Updated pokemonSkills with', Object.keys(data.pokemonSkills).length, 'entries (full descriptions from Pokedex pp.14-18).');
