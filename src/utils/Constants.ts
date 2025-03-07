/**
 * Game Constants
 *
 * This file contains all the game constants and enumerations.
 * Keep all fixed values here for easy configuration and balancing.
 */

// Depth Layer Configuration
export enum DepthLayer {
    SURFACE = 'surface',
    DEEP_SEA = 'deep_sea',
    CHTHONIC = 'chthonic',
    COSMIC = 'cosmic'
}

// Depth ranges in meters
export const DEPTH_RANGES = {
    [DepthLayer.SURFACE]: { min: 0, max: 50 },
    [DepthLayer.DEEP_SEA]: { min: 50, max: 1000 },
    [DepthLayer.CHTHONIC]: { min: 1000, max: 5000 },
    [DepthLayer.COSMIC]: { min: 5000, max: 10000 }
};

// Fish Rarity Levels
export enum FishRarity {
    COMMON = 'common',
    UNCOMMON = 'uncommon',
    RARE = 'rare',
    LEGENDARY = 'legendary',
    MYTHIC = 'mythic'
}

// Rarity chances (0-1)
export const RARITY_CHANCES = {
    [FishRarity.COMMON]: 0.6,
    [FishRarity.UNCOMMON]: 0.25,
    [FishRarity.RARE]: 0.1,
    [FishRarity.LEGENDARY]: 0.04,
    [FishRarity.MYTHIC]: 0.01
};

// Rarity value multipliers
export const RARITY_VALUE_MULTIPLIERS = {
    [FishRarity.COMMON]: 1,
    [FishRarity.UNCOMMON]: 2.5,
    [FishRarity.RARE]: 6,
    [FishRarity.LEGENDARY]: 15,
    [FishRarity.MYTHIC]: 40
};

// Upgrade Types
export enum UpgradeType {
    FISHING_POWER = 'fishing_power',
    LINE_STRENGTH = 'line_strength',
    DEPTH_ACCESS = 'depth_access',
    TANK_CAPACITY = 'tank_capacity',
    CATCH_SPEED = 'catch_speed',
   BREEDING_EFFICIENCY = 'breeding_efficiency',
    BREEDING_TANKS = 'breeding_tanks',
    PRESSURE_RESISTANCE = 'pressure_resistance',
}

// Initial game values
export const INITIAL_GAME_STATE = {
    money: 0,
    fishingPower: 1,
    lineStrength: 1,
    maxDepth: 10,
    tankCapacity: 10,
    catchSpeed: 1
};

// Time constants (in milliseconds)
export const TIME_CONSTANTS = {
    BASE_CATCH_TIME: 3000, // Base time to catch a fish
    SAVE_INTERVAL: 60000,  // Auto-save every minute
    BASE_BREEDING_TIME: 300000, // 5 minutes for basic breeding time
};

// Surface fish species
export const SURFACE_FISH = [
    {
        id: 'trout',
        name: 'Trout',
        baseValue: 5,
        minDepth: 0,
        maxDepth: 20,
        weight: { min: 0.5, max: 3 }
    },
    {
        id: 'bass',
        name: 'Bass',
        baseValue: 8,
        minDepth: 5,
        maxDepth: 30,
        weight: { min: 1, max: 5 }
    },
    {
        id: 'salmon',
        name: 'Salmon',
        baseValue: 12,
        minDepth: 10,
        maxDepth: 40,
        weight: { min: 2, max: 8 }
    },
    {
        id: 'sunfish',
        name: 'Sunfish',
        baseValue: 3,
        minDepth: 0,
        maxDepth: 15,
        weight: { min: 0.2, max: 1 }
    },
    {
        id: 'catfish',
        name: 'Catfish',
        baseValue: 15,
        minDepth: 20,
        maxDepth: 50,
        weight: { min: 3, max: 12 }
    },
    {
        id: 'perch',
        name: 'Perch',
        baseValue: 6,
        minDepth: 2,
        maxDepth: 25,
        weight: { min: 0.5, max: 2.5 }
    },
    {
        id: 'herring',
        name: 'Herring',
        baseValue: 4,
        minDepth: 0,
        maxDepth: 35,
        weight: { min: 0.1, max: 0.5 }
    },
    {
        id: 'mackerel',
        name: 'Mackerel',
        baseValue: 7,
        minDepth: 5,
        maxDepth: 45,
        weight: { min: 0.5, max: 3 }
    },
    {
        id: 'bluegill',
        name: 'Bluegill',
        baseValue: 3,
        minDepth: 0,
        maxDepth: 10,
        weight: { min: 0.2, max: 1.5 }
    },
    {
        id: 'pike',
        name: 'Pike',
        baseValue: 10,
        minDepth: 10,
        maxDepth: 30,
        weight: { min: 1.5, max: 6 }
    },
    {
        id: 'whitefish',
        name: 'Whitefish',
        baseValue: 5,
        minDepth: 15,
        maxDepth: 40,
        weight: { min: 1, max: 4 }
    },
    {
        id: 'carp',
        name: 'Carp',
        baseValue: 6,
        minDepth: 5,
        maxDepth: 25,
        weight: { min: 2, max: 7 }
    },
    {
        id: 'crappie',
        name: 'Crappie',
        baseValue: 4,
        minDepth: 3,
        maxDepth: 20,
        weight: { min: 0.3, max: 2 }
    },
    {
        id: 'barracuda',
        name: 'Barracuda',
        baseValue: 18,
        minDepth: 10,
        maxDepth: 50,
        weight: { min: 2, max: 10 }
    },
    {
        id: 'anchovy',
        name: 'Anchovy',
        baseValue: 2,
        minDepth: 0,
        maxDepth: 30,
        weight: { min: 0.05, max: 0.2 }
    },
    {
        id: 'rainbow-trout',
        name: 'Rainbow Trout',
        baseValue: 7,
        minDepth: 5,
        maxDepth: 35,
        weight: { min: 1, max: 5 }
    },
    {
        id: 'walleye',
        name: 'Walleye',
        baseValue: 9,
        minDepth: 15,
        maxDepth: 40,
        weight: { min: 1.5, max: 6 }
    },
    {
        id: 'arapaima',
        name: 'Arapaima',
        baseValue: 13,
        minDepth: 50,
        maxDepth: 50,
        weight: { min: 50, max: 200 },
    },
    {
        id: 'megamouth-shark',
        name: 'Megamouth Shark',
        baseValue: 18,
        minDepth: 50,
        maxDepth: 50,
        weight: { min: 500, max: 1000 },
    },
    {
        id: 'coelacanth',
        name: 'Coelacanth',
        baseValue: 25,
        minDepth: 50,
        maxDepth: 50,
        weight: { min: 30, max: 90 },
    }
];

// Initial upgrades available
export const INITIAL_UPGRADES = [
    {
        id: 'basic_rod',
        name: 'Basic Fishing Rod',
        description: 'Increases fishing power by 1',
        type: UpgradeType.FISHING_POWER,
        cost: 50,
        value: 1,
        maxLevel: 5
    },
    {
        id: 'basic_line',
        name: 'Stronger Fishing Line',
        description: 'Increases line strength by 1',
        type: UpgradeType.LINE_STRENGTH,
        cost: 75,
        value: 1,
        maxLevel: 5
    },
    {
        id: 'depth_gauge',
        name: 'Basic Depth Gauge',
        description: 'Increases maximum fishing depth by 10m',
        type: UpgradeType.DEPTH_ACCESS,
        cost: 100,
        value: 10,
        maxLevel: 5
    },
    {
        id: 'small_tank',
        name: 'Small Fish Tank',
        description: 'Increases tank capacity by 5',
        type: UpgradeType.TANK_CAPACITY,
        cost: 60,
        value: 5,
        maxLevel: 5
    },
    {
        id: 'reel_upgrade',
        name: 'Reel Mechanism',
        description: 'Decreases catch time by 10%',
        type: UpgradeType.CATCH_SPEED,
        cost: 85,
        value: 0.1,  // 10% reduction
        maxLevel: 5
    },
    {
        id: 'basic_breeding_tank',
        name: 'Basic Breeding Tank',
        description: 'Adds a tank for breeding fish',
        type: UpgradeType.BREEDING_TANKS,
        cost: 200,
        value: 1,
        maxLevel: 5
    },
    {
        id: 'breeding_handbook',
        name: 'Breeding Handbook',
        description: 'Increases breeding efficiency by 10%',
        type: UpgradeType.BREEDING_EFFICIENCY,
        cost: 150,
        value: 0.1,
        maxLevel: 5
    },
    {
        id: 'basic_pressure_gear',
        name: 'Basic Pressure Gear',
        description: 'Allows fishing in deeper water with 20% pressure resistance',
        type: UpgradeType.PRESSURE_RESISTANCE,
        cost: 300,
        value: 0.2,
        maxLevel: 1
    }
];

export const INITIAL_ACHIEVEMENTS = [
    {
        id: 'first_catch',
        name: 'First Catch',
        description: 'Catch your first fish',
        requirement: { statName: 'totalFishCaught', value: 1 },
        reward: { money: 10 }
    },
    {
        id: 'catch_10',
        name: 'Novice Angler',
        description: 'Catch 10 fish',
        requirement: { statName: 'totalFishCaught', value: 10 },
        reward: { money: 25 }
    },
    {
        id: 'catch_50',
        name: 'Skilled Angler',
        description: 'Catch 50 fish',
        requirement: { statName: 'totalFishCaught', value: 50 },
        reward: { money: 100 }
    },
    {
        id: 'catch_rare',
        name: 'Rare Find',
        description: 'Catch your first rare fish',
        requirement: { statName: 'rareFishCaught', value: 1 },
        reward: { money: 50 }
    },
    {
        id: 'catch_legendary',
        name: 'Legend of the Deep',
        description: 'Catch your first legendary fish',
        requirement: { statName: 'legendaryFishCaught', value: 1 },
        reward: { money: 200 }
    },
    {
        id: 'first_breed',
        name: 'Fish Breeder',
        description: 'Successfully breed fish for the first time',
        requirement: { statName: 'successfulBreeds', value: 1 },
        reward: { money: 100 }
    },
    {
        id: 'first_mutation',
        name: 'Genetic Pioneer',
        description: 'Obtain your first mutation through breeding',
        requirement: { statName: 'mutationsObtained', value: 1 },
        reward: { money: 150 }
    },
    {
        id: 'deep_diver',
        name: 'Deep Diver',
        description: 'Reach a depth of 100m',
        requirement: { statName: 'maxDepthReached', value: 100 },
        reward: { money: 200 }
    },
    {
        id: 'money_maker',
        name: 'Money Maker',
        description: 'Earn a total of 1000 money',
        requirement: { statName: 'totalMoneyEarned', value: 1000 },
        reward: { money: 100 }
    },
    {
        id: 'activate_ability',
        name: 'Power User',
        description: 'Activate a fish ability for the first time',
        requirement: { statName: 'abilitiesActivated', value: 1 },
        reward: { money: 50 }
    }
];

// Layer Unlock Requirements
export interface LayerRequirement {
    id: string;
    description: string;
    checkFunction: (gameState: any) => boolean;
}

// Define a type for the layer requirements mapping
export type LayerRequirementMap = {
    [key in DepthLayer]?: LayerRequirement[];
};

export const LAYER_REQUIREMENTS: LayerRequirementMap = {
    [DepthLayer.DEEP_SEA]: [
        {
            id: 'fish_species',
            description: 'Catch at least 20 different fish species',
            checkFunction: (gameState: any) => {
                // Use the StatsTracker to check for unique species caught
                if (gameState.statsTracker) {
                    return gameState.statsTracker.getUniqueSpeciesCount() >= 20;
                }
                return false;
            }
        },
        {
            id: 'pressure_gear',
            description: 'Purchase Deep Sea Pressure Gear upgrade',
            checkFunction: (gameState: any) => {
                // Check if the pressure gear upgrade has been purchased
                const pressureGearLevel = gameState.upgradeManager.getTotalBonusForType(UpgradeType.PRESSURE_RESISTANCE);
                return pressureGearLevel > 0;
            }
        },
        {
            id: 'fishing_power',
            description: 'Reach a fishing power of at least 5',
            checkFunction: (gameState: any) => {
                return gameState.fishingPower >= 5;
            }
        }
    ]
};