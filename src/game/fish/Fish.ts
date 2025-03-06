import { FishRarity, RARITY_VALUE_MULTIPLIERS } from '../../utils/Constants';
import { generateId, randomFloatPrecision } from '../../utils/Random';

/**
 * Fish Species data interface
 */
export interface FishSpecies {
    id: string;
    name: string;
    baseValue: number;
    minDepth: number;
    maxDepth: number;
    weight: {
        min: number;
        max: number;
    };
    // Future expansion: add breeding compatibility, special abilities, etc.
}

/**
 * Represents a caught fish instance
 */
export class Fish {
    // Unique identifier for each fish instance
    id: string;

    // Reference to the species
    speciesId: string;
    speciesName: string;

    // Instance properties
    rarity: FishRarity;
    weight: number;
    value: number;
    caughtDepth: number;
    caughtAt: Date;

    // Future expansion: add age, health, breeding cooldown, etc.

    constructor(species: FishSpecies, rarity: FishRarity, depth: number) {
        this.id = generateId('fish-');
        this.speciesId = species.id;
        this.speciesName = species.name;
        this.rarity = rarity;
        this.caughtDepth = depth;
        this.caughtAt = new Date();

        // Generate random weight for this fish based on species range
        this.weight = randomFloatPrecision(
            species.weight.min,
            species.weight.max,
            1
        );

        // Calculate value based on base value, weight, and rarity
        this.value = this.calculateValue(species.baseValue);
    }

    /**
     * Calculate the sell value of this fish
     */
    private calculateValue(baseValue: number): number {
        // Value formula: base value * weight factor * rarity multiplier
        const weightFactor = 1 + (this.weight / 10);
        const rarityMultiplier = RARITY_VALUE_MULTIPLIERS[this.rarity];

        return Math.round(baseValue * weightFactor * rarityMultiplier);
    }

    /**
     * Get display name including rarity
     */
    get displayName(): string {
        return `${this.rarity.charAt(0).toUpperCase() + this.rarity.slice(1)} ${this.speciesName}`;
    }

    /**
     * Get detailed description of the fish
     */
    get description(): string {
        return `${this.displayName} (${this.weight}kg)\nValue: $${this.value}\nCaught at ${this.caughtDepth}m`;
    }

    /**
     * Serialize fish for saving
     */
    serialize(): object {
        return {
            id: this.id,
            speciesId: this.speciesId,
            speciesName: this.speciesName,
            rarity: this.rarity,
            weight: this.weight,
            value: this.value,
            caughtDepth: this.caughtDepth,
            caughtAt: this.caughtAt.toISOString()
        };
    }

    /**
     * Deserialize fish from saved data
     */
    static deserialize(data: any): Fish {
        const fish = Object.create(Fish.prototype);
        return Object.assign(fish, {
            ...data,
            caughtAt: new Date(data.caughtAt)
        });
    }
}