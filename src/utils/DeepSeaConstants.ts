/**
 * Deep Sea Layer Constants
 *
 * This file contains constants specific to the Deep Sea layer.
 */

import { FishSpecies } from '../game/fish/Fish';

/**
 * Deep sea fish species
 */
export const DEEP_SEA_FISH: FishSpecies[] = [
    {
        id: 'anglerfish',
        name: 'Anglerfish',
        baseValue: 25,
        minDepth: 50,
        maxDepth: 300,
        weight: { min: 3, max: 15 }
    },
    {
        id: 'viperfish',
        name: 'Viperfish',
        baseValue: 35,
        minDepth: 70,
        maxDepth: 500,
        weight: { min: 0.5, max: 3 }
    },
    {
        id: 'fangtooth',
        name: 'Fangtooth',
        baseValue: 30,
        minDepth: 150,
        maxDepth: 600,
        weight: { min: 0.3, max: 2 }
    },
    {
        id: 'giant_squid',
        name: 'Giant Squid',
        baseValue: 80,
        minDepth: 300,
        maxDepth: 800,
        weight: { min: 20, max: 300 }
    },
    {
        id: 'oarfish',
        name: 'Oarfish',
        baseValue: 60,
        minDepth: 200,
        maxDepth: 700,
        weight: { min: 40, max: 150 }
    },
    {
        id: 'frilled_shark',
        name: 'Frilled Shark',
        baseValue: 45,
        minDepth: 100,
        maxDepth: 400,
        weight: { min: 5, max: 30 }
    },
    {
        id: 'barreleye',
        name: 'Barreleye',
        baseValue: 40,
        minDepth: 80,
        maxDepth: 350,
        weight: { min: 0.2, max: 1 }
    },
    {
        id: 'hatchetfish',
        name: 'Hatchetfish',
        baseValue: 20,
        minDepth: 50,
        maxDepth: 250,
        weight: { min: 0.1, max: 0.5 }
    },
    {
        id: 'gulper_eel',
        name: 'Gulper Eel',
        baseValue: 50,
        minDepth: 500,
        maxDepth: 1000,
        weight: { min: 1, max: 8 }
    },
    {
        id: 'bioluminescent_jellyfish',
        name: 'Bioluminescent Jellyfish',
        baseValue: 55,
        minDepth: 400,
        maxDepth: 900,
        weight: { min: 2, max: 25 }
    },
    {
        id: 'dumbo_octopus',
        name: 'Dumbo Octopus',
        baseValue: 70,
        minDepth: 1000,
        maxDepth: 2000,
        weight: { min: 10, max: 50 }
    },
    {
        id: 'vampire_squid',
        name: 'Vampire Squid',
        baseValue: 65,
        minDepth: 600,
        maxDepth: 1200,
        weight: { min: 5, max: 15 }
    },
    {
        id: 'deep_sea_dragonfish',
        name: 'Deep Sea Dragonfish',
        baseValue: 55,
        minDepth: 200,
        maxDepth: 1500,
        weight: { min: 0.5, max: 5 }
    },
    {
        id: 'blob_fish',
        name: 'Blob Fish',
        baseValue: 45,
        minDepth: 600,
        maxDepth: 1800,
        weight: { min: 2, max: 10 }
    },
    {
        id: 'lanternfish',
        name: 'Lanternfish',
        baseValue: 30,
        minDepth: 100,
        maxDepth: 1000,
        weight: { min: 0.1, max: 1 }
    },
    {
        id: 'yeti_crab',
        name: 'Yeti Crab',
        baseValue: 60,
        minDepth: 1500,
        maxDepth: 2000,
        weight: { min: 1, max: 5 }
    },
    {
        id: 'colossal_squid',
        name: 'Colossal Squid',
        baseValue: 90,
        minDepth: 800,
        maxDepth: 1600,
        weight: { min: 100, max: 500 }
    },
    {
        id: 'abyssal_anglerfish',
        name: 'Abyssal Anglerfish',
        baseValue: 75,
        minDepth: 1000,
        maxDepth: 1900,
        weight: { min: 5, max: 20 }
    },
    {
        id: 'deep_sea_chimera',
        name: 'Deep Sea Chimera',
        baseValue: 65,
        minDepth: 500,
        maxDepth: 1700,
        weight: { min: 10, max: 40 }
    },
    {
        id: 'glass_squid',
        name: 'Glass Squid',
        baseValue: 50,
        minDepth: 200,
        maxDepth: 1300,
        weight: { min: 0.5, max: 3 }
    }
];

/**
 * Pressure gear upgrades
 */
export const PRESSURE_UPGRADES = [
    {
        id: 'basic_pressure_hull',
        name: 'Basic Pressure Hull',
        description: 'Increases pressure resistance by 20%',
        cost: 500,
        value: 0.2,
        maxLevel: 1
    },
    {
        id: 'reinforced_hull',
        name: 'Reinforced Hull',
        description: 'Increases pressure resistance by 15%',
        cost: 1200,
        value: 0.15,
        maxLevel: 2,
        requirements: ['basic_pressure_hull']
    },
    {
        id: 'pressure_compensator',
        name: 'Pressure Compensator',
        description: 'Increases pressure resistance by 20%',
        cost: 2500,
        value: 0.2,
        maxLevel: 1,
        requirements: ['reinforced_hull']
    },
    {
        id: 'deep_sea_alloy',
        name: 'Deep Sea Alloy',
        description: 'Increases pressure resistance by 25%',
        cost: 5000,
        value: 0.25,
        maxLevel: 1,
        requirements: ['pressure_compensator']
    }
];

/**
 * Light source upgrades for attracting specific deep sea fish
 */
export const LIGHT_SOURCE_UPGRADES = [
    {
        id: 'basic_deep_light',
        name: 'Basic Deep Light',
        description: 'A basic light source for deep sea fishing',
        cost: 800,
        attractionBonus: 0.1,
        targetFish: ['anglerfish', 'viperfish', 'barreleye'],
        maxLevel: 1
    },
    {
        id: 'blue_spectrum_light',
        name: 'Blue Spectrum Light',
        description: 'Attracts specific deep sea creatures',
        cost: 1500,
        attractionBonus: 0.2,
        targetFish: ['hatchetfish', 'oarfish', 'bioluminescent_jellyfish'],
        maxLevel: 1,
        requirements: ['basic_deep_light']
    },
    {
        id: 'pulsating_lure',
        name: 'Pulsating Lure',
        description: 'Mimics deep sea bioluminescence patterns',
        cost: 3000,
        attractionBonus: 0.3,
        targetFish: ['giant_squid', 'gulper_eel', 'frilled_shark'],
        maxLevel: 1,
        requirements: ['blue_spectrum_light']
    }
];