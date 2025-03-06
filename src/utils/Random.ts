/**
 * Random Utility Functions
 *
 * This file contains utility functions for generating random values,
 * which are used throughout the game for fish generation, catches, etc.
 */

/**
 * Generate a random number between min and max (inclusive)
 */
export function randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generate a random floating point number between min and max
 */
export function randomFloat(min: number, max: number): number {
    return Math.random() * (max - min) + min;
}

/**
 * Generate a random floating point number with specified precision
 */
export function randomFloatPrecision(min: number, max: number, precision: number): number {
    const value = randomFloat(min, max);
    const multiplier = Math.pow(10, precision);
    return Math.round(value * multiplier) / multiplier;
}

/**
 * Select a random element from an array
 */
export function randomElement<T>(array: T[]): T {
    return array[randomInt(0, array.length - 1)];
}

/**
 * Returns true with the given probability (0-1)
 */
export function chance(probability: number): boolean {
    return Math.random() < probability;
}

/**
 * Select a random item based on weights
 * @param items Array of items to select from
 * @param weights Array of weights corresponding to items
 */
export function weightedRandom<T>(items: T[], weights: number[]): T {
    if (items.length !== weights.length) {
        throw new Error('Items and weights arrays must be the same length');
    }

    // Calculate sum of weights
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);

    // Get a random value between 0 and totalWeight
    const randomValue = randomFloat(0, totalWeight);

    // Find the item that corresponds to the random value
    let cumulativeWeight = 0;
    for (let i = 0; i < items.length; i++) {
        cumulativeWeight += weights[i];
        if (randomValue <= cumulativeWeight) {
            return items[i];
        }
    }

    // Fallback (should not happen)
    return items[items.length - 1];
}

/**
 * Generate a random ID string
 */
export function generateId(prefix: string = ''): string {
    return `${prefix}${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}