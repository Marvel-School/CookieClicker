// Contains the Achievement class and achievement setup

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

// This function will be called by the Game class to set up the achievements
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
  
  // Mine achievements
  game.registerAchievement(new Achievement(
    'mine_5',
    'Cookie Miner',
    'Own 5 Cookie Mines.',
    (game) => (game.upgrades.mine.count || 0) >= 5,
    'common',
    'collection',
    '⛏️'
  ));
  
  game.registerAchievement(new Achievement(
    'mine_25',
    'Excavation Expert',
    'Own 25 Cookie Mines.',
    (game) => (game.upgrades.mine.count || 0) >= 25,
    'uncommon',
    'collection',
    '⛏️'
  ));
  
  game.registerAchievement(new Achievement(
    'mine_50',
    'Deep Cookie Deposits',
    'Own 50 Cookie Mines.',
    (game) => (game.upgrades.mine.count || 0) >= 50,
    'rare',
    'collection',
    '💎'
  ));
  
  // Factory achievements
  game.registerAchievement(new Achievement(
    'factory_5',
    'Industrialist',
    'Own 5 Cookie Factories.',
    (game) => (game.upgrades.factory.count || 0) >= 5,
    'common',
    'collection',
    '🏭'
  ));
  
  game.registerAchievement(new Achievement(
    'factory_25',
    'Mass Production',
    'Own 25 Cookie Factories.',
    (game) => (game.upgrades.factory.count || 0) >= 25,
    'uncommon',
    'collection', 
    '🏭'
  ));
  
  // Bank achievements
  game.registerAchievement(new Achievement(
    'bank_5',
    'Cookie Investor',
    'Own 5 Cookie Banks.',
    (game) => (game.upgrades.bank.count || 0) >= 5,
    'common',
    'collection',
    '🏦'
  ));
  
  game.registerAchievement(new Achievement(
    'bank_25',
    'Cookie Magnate',
    'Own 25 Cookie Banks.',
    (game) => (game.upgrades.bank.count || 0) >= 25,
    'uncommon',
    'collection', 
    '💰'
  ));
  
  // Temple achievements
  game.registerAchievement(new Achievement(
    'temple_5',
    'Cookie Worshipper',
    'Own 5 Cookie Temples.',
    (game) => (game.upgrades.temple.count || 0) >= 5,
    'uncommon',
    'collection',
    '🏛️'
  ));
  
  game.registerAchievement(new Achievement(
    'temple_25',
    'Cookie Deity',
    'Own 25 Cookie Temples.',
    (game) => (game.upgrades.temple.count || 0) >= 25,
    'rare',
    'collection', 
    '👑'
  ));
  
  // Special achievements
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
  
  // Special achievement - Balanced Collector
  game.registerAchievement(new Achievement(
    'balanced_collector',
    'Cookie Connoisseur',
    'Have exactly 10 of each production building (Auto Clickers, Grandmas, Farms, Mines, Factories, Banks, Temples)',
    (game) => {
      const count = game.upgrades.autoClicker.count || 0;
      return count >= 10 &&
             count === (game.upgrades.grandma.count || 0) &&
             count === (game.upgrades.farm.count || 0) &&
             count === (game.upgrades.mine.count || 0) &&
             count === (game.upgrades.factory.count || 0) &&
             count === (game.upgrades.bank.count || 0) &&
             count === (game.upgrades.temple.count || 0);
    },
    'legendary',
    'special',
    '🎭'
  ));
}
