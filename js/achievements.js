// Contains achievement system code

/**
 * Achievement class definition
 */
export class Achievement {
  constructor(id, name, description, condition, rarity = 'common', category = 'general', icon = '🍪') {
    this.id = id;
    this.name = name;
    this.description = description;
    this.condition = condition; // Function that returns true if achievement is earned
    this.earned = false;
    this.rarity = rarity; // common, uncommon, rare, epic, legendary
    this.category = category; // clicking, production, collection, special
    this.icon = icon;
  }
}

/**
 * Setup all achievements for the game
 */
export function setupAchievements(game) {
  // Cookie production achievements
  game.registerAchievement(new Achievement(
    'cookies_100',
    'Cookie Novice',
    'Bake 100 cookies in total.',
    (game) => game.state.cookies >= 100,
    'common',
    'production',
    '🍪'
  ));
  
  game.registerAchievement(new Achievement(
    'cookies_1000',
    'Cookie Apprentice',
    'Bake 1,000 cookies in total.',
    (game) => game.state.cookies >= 1000,
    'common',
    'production',
    '🍪'
  ));
  
  game.registerAchievement(new Achievement(
    'cookies_10000',
    'Cookie Professional',
    'Bake 10,000 cookies in total.',
    (game) => game.state.cookies >= 10000,
    'uncommon',
    'production',
    '🍪'
  ));
  
  game.registerAchievement(new Achievement(
    'cookies_100000',
    'Cookie Maestro',
    'Bake 100,000 cookies in total.',
    (game) => game.state.cookies >= 100000,
    'rare',
    'production',
    '👨‍🍳'
  ));
  
  game.registerAchievement(new Achievement(
    'cookies_1000000',
    'Cookie Mogul',
    'Bake 1,000,000 cookies in total.',
    (game) => game.state.cookies >= 1000000,
    'epic',
    'production',
    '👑'
  ));
  
  // Clicking achievements
  game.registerAchievement(new Achievement(
    'click_power_10',
    'Finger of Destiny',
    'Reach a click power of 10 or higher.',
    (game) => game.state.clickPower >= 10,
    'uncommon',
    'clicking',
    '👆'
  ));
  
  game.registerAchievement(new Achievement(
    'click_power_50',
    'Hand of Destruction',
    'Reach a click power of 50 or higher.',
    (game) => game.state.clickPower >= 50, 
    'rare',
    'clicking',
    '✋'
  ));
  
  game.registerAchievement(new Achievement(
    'click_power_100',
    'Cookie Annihilator',
    'Reach a click power of 100 or higher.',
    (game) => game.state.clickPower >= 100,
    'epic',
    'clicking',
    '💪'
  ));
  
  // Building collection achievements
  game.registerAchievement(new Achievement(
    'autoclicker_5',
    'Automation Beginner',
    'Own 5 Auto Clickers.',
    (game) => (game.upgrades.autoClicker.count || 0) >= 5,
    'common',
    'collection',
    '🤖'
  ));
  
  game.registerAchievement(new Achievement(
    'autoclicker_25',
    'Automation Expert',
    'Own 25 Auto Clickers.',
    (game) => (game.upgrades.autoClicker.count || 0) >= 25,
    'uncommon',
    'collection',
    '🤖'
  ));
  
  game.registerAchievement(new Achievement(
    'autoclicker_50',
    'Army of Clickers',
    'Own 50 Auto Clickers.',
    (game) => (game.upgrades.autoClicker.count || 0) >= 50,
    'rare',
    'collection',
    '⚙️'
  ));
  
  game.registerAchievement(new Achievement(
    'grandma_5',
    'Family Baker',
    'Recruit 5 Grandmas for your bakery.',
    (game) => (game.upgrades.grandma.count || 0) >= 5,
    'common',
    'collection',
    '👵'
  ));
  
  game.registerAchievement(new Achievement(
    'grandma_25',
    'Grandma Commune',
    'Recruit 25 Grandmas for your bakery.',
    (game) => (game.upgrades.grandma.count || 0) >= 25,
    'uncommon',
    'collection',
    '👵'
  ));
  
  game.registerAchievement(new Achievement(
    'grandma_50',
    'Grandmapocalypse',
    'Control an army of 50 Grandmas.',
    (game) => (game.upgrades.grandma.count || 0) >= 50,
    'epic',
    'collection',
    '👵'
  ));
  
  game.registerAchievement(new Achievement(
    'farm_5',
    'Cookie Farmer',
    'Own 5 Cookie Farms.',
    (game) => (game.upgrades.farm.count || 0) >= 5,
    'common',
    'collection',
    '🌱'
  ));
  
  game.registerAchievement(new Achievement(
    'farm_25',
    'Agribusiness',
    'Own 25 Cookie Farms.',
    (game) => (game.upgrades.farm.count || 0) >= 25,
    'uncommon',
    'collection', 
    '🌾'
  ));
  
  game.registerAchievement(new Achievement(
    'farm_50',
    'Cookie Plantation Empire',
    'Own 50 Cookie Farms across the land.',
    (game) => (game.upgrades.farm.count || 0) >= 50,
    'rare',
    'collection',
    '🚜'
  ));
  
  // Special achievements
  game.registerAchievement(new Achievement(
    'cps_100',
    'Industrial Revolution',
    'Reach 100 cookies per second.',
    (game) => {
      const autoClickers = game.upgrades.autoClicker.count || 0;
      const grandmas = game.upgrades.grandma.count || 0;
      const farms = game.upgrades.farm.count || 0;
      return (autoClickers * 1 + grandmas * 3 + farms * 6) >= 100;
    },
    'uncommon',
    'special',
    '⚡'
  ));
  
  game.registerAchievement(new Achievement(
    'cps_500',
    'Cookie Factory',
    'Reach 500 cookies per second.',
    (game) => {
      const autoClickers = game.upgrades.autoClicker.count || 0;
      const grandmas = game.upgrades.grandma.count || 0;
      const farms = game.upgrades.farm.count || 0;
      return (autoClickers * 1 + grandmas * 3 + farms * 6) >= 500;
    },
    'rare',
    'special',
    '🏭'
  ));
  
  game.registerAchievement(new Achievement(
    'balanced_force',
    'Balanced Force',
    'Have exactly the same number of Auto Clickers, Grandmas, and Farms (at least 10 each).',
    (game) => {
      const autoClickers = game.upgrades.autoClicker.count || 0;
      const grandmas = game.upgrades.grandma.count || 0;
      const farms = game.upgrades.farm.count || 0;
      return autoClickers >= 10 && autoClickers === grandmas && grandmas === farms;
    },
    'legendary',
    'special',
    '⚖️'
  ));
  
  game.registerAchievement(new Achievement(
    'lucky_streak',
    'Fortune Favors the Bold',
    'Purchase the Lucky Click upgrade 7 times in a row without buying any other upgrade.',
    (game) => game.state.luckyStreak >= 7,
    'epic',
    'special',
    '🍀'
  ));
}
