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
    CATCH_SPEED = 'catch_speed'
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
    }
];