import { Fish, FishSpecies } from '../fish/Fish';
import { FishManager } from '../fish/FishManager';
import { FishRarity, RARITY_CHANCES } from '../../utils/Constants';
import { chance, randomFloat, randomInt } from '../../utils/Random';

/**
 * Represents the outcome of a breeding attempt
 */
export class BreedingOutcome {
    // Parent fish
    parentFish1: Fish;
    parentFish2: Fish;

    // Resulting offspring
    offspring: Fish[];

    // Whether mutation occurred
    hasMutation: boolean = false;

    // Reference to fish manager
    private fishManager: FishManager;

    constructor(
        parentFish1: Fish,
        parentFish2: Fish,
        fishManager: FishManager,
        breedingEfficiency: number = 1
    ) {
        this.parentFish1 = parentFish1;
        this.parentFish2 = parentFish2;
        this.fishManager = fishManager;

        // Generate offspring
        this.offspring = this.generateOffspring(breedingEfficiency);
    }

    /**
     * Generate offspring based on parent fish
     */
    private generateOffspring(breedingEfficiency: number): Fish[] {
        const offspring: Fish[] = [];

        // Get parent species
        const speciesId = this.parentFish1.speciesId; // Both parents should be same species
        const species = this.fishManager.getFishSpecies(speciesId);

        if (!species) {
            return offspring; // Species not found
        }

        // Determine number of offspring based on breeding efficiency
        // Higher efficiency can lead to more offspring
        const baseOffspringCount = 1;
        const maxExtraOffspring = Math.floor(breedingEfficiency);
        const extraOffspring = randomInt(0, maxExtraOffspring);
        const offspringCount = baseOffspringCount + extraOffspring;

        // Generate each offspring
        for (let i = 0; i < offspringCount; i++) {
            const offspringFish = this.generateSingleOffspring(species, breedingEfficiency);
            offspring.push(offspringFish);

            // Check if this offspring has a mutation
            if (this.hasBetterRarity(offspringFish)) {
                this.hasMutation = true;
            }
        }

        return offspring;
    }

    /**
     * Generate a single offspring fish
     */
    private generateSingleOffspring(species: FishSpecies, breedingEfficiency: number): Fish {
        // Calculate rarity based on parent fish and breeding efficiency
        const rarity = this.determineOffspringRarity(breedingEfficiency);

        // Calculate depth (average of parents' caught depths)
        const depth = Math.floor(
            (this.parentFish1.caughtDepth + this.parentFish2.caughtDepth) / 2
        );

        // Create the offspring fish
        return new Fish(species, rarity, depth);
    }

    /**
     * Determine rarity of offspring based on parent fish and breeding efficiency
     */
    private determineOffspringRarity(breedingEfficiency: number): FishRarity {
        // Get parent rarities
        const parentRarity1 = this.parentFish1.rarity;
        const parentRarity2 = this.parentFish2.rarity;

        // Higher breeding efficiency increases chance of better rarity
        const rarityChanceBoost = (breedingEfficiency - 1) * 0.05; // 5% per efficiency point

        // Determine base rarity - usually inherits from parents
        let baseRarity: FishRarity;

        // 75% chance to inherit higher rarity parent, 25% chance for lower
        if (chance(0.75)) {
            baseRarity = this.getHigherRarity(parentRarity1, parentRarity2);
        } else {
            baseRarity = this.getLowerRarity(parentRarity1, parentRarity2);
        }

        // Chance to mutate to a higher rarity
        const mutationChance = this.getMutationChance(baseRarity, rarityChanceBoost);

        if (chance(mutationChance)) {
            return this.getNextHigherRarity(baseRarity);
        }

        return baseRarity;
    }

    /**
     * Get mutation chance based on current rarity and breeding efficiency boost
     */
    private getMutationChance(rarity: FishRarity, rarityBoost: number): number {
        switch (rarity) {
            case FishRarity.COMMON:
                return 0.15 + rarityBoost; // 15% base chance to go from Common to Uncommon
            case FishRarity.UNCOMMON:
                return 0.10 + rarityBoost; // 10% base chance to go from Uncommon to Rare
            case FishRarity.RARE:
                return 0.05 + rarityBoost; // 5% base chance to go from Rare to Legendary
            case FishRarity.LEGENDARY:
                return 0.02 + rarityBoost; // 2% base chance to go from Legendary to Mythic
            default:
                return 0; // Mythic is already highest
        }
    }

    /**
     * Compare two rarities and return the higher one
     */
    private getHigherRarity(rarity1: FishRarity, rarity2: FishRarity): FishRarity {
        const rarityValues = {
            [FishRarity.COMMON]: 1,
            [FishRarity.UNCOMMON]: 2,
            [FishRarity.RARE]: 3,
            [FishRarity.LEGENDARY]: 4,
            [FishRarity.MYTHIC]: 5
        };

        return rarityValues[rarity1] >= rarityValues[rarity2] ? rarity1 : rarity2;
    }

    /**
     * Compare two rarities and return the lower one
     */
    private getLowerRarity(rarity1: FishRarity, rarity2: FishRarity): FishRarity {
        const rarityValues = {
            [FishRarity.COMMON]: 1,
            [FishRarity.UNCOMMON]: 2,
            [FishRarity.RARE]: 3,
            [FishRarity.LEGENDARY]: 4,
            [FishRarity.MYTHIC]: 5
        };

        return rarityValues[rarity1] <= rarityValues[rarity2] ? rarity1 : rarity2;
    }

    /**
     * Get the next higher rarity level
     */
    private getNextHigherRarity(rarity: FishRarity): FishRarity {
        switch (rarity) {
            case FishRarity.COMMON:
                return FishRarity.UNCOMMON;
            case FishRarity.UNCOMMON:
                return FishRarity.RARE;
            case FishRarity.RARE:
                return FishRarity.LEGENDARY;
            case FishRarity.LEGENDARY:
                return FishRarity.MYTHIC;
            default:
                return FishRarity.MYTHIC; // Already at highest
        }
    }

    /**
     * Check if offspring has better rarity than parents
     */
    private hasBetterRarity(offspring: Fish): boolean {
        const offspringRarity = offspring.rarity;
        const parentRarity1 = this.parentFish1.rarity;
        const parentRarity2 = this.parentFish2.rarity;

        // Get highest parent rarity
        const highestParentRarity = this.getHigherRarity(parentRarity1, parentRarity2);

        // Compare offspring rarity to highest parent rarity
        const rarityValues = {
            [FishRarity.COMMON]: 1,
            [FishRarity.UNCOMMON]: 2,
            [FishRarity.RARE]: 3,
            [FishRarity.LEGENDARY]: 4,
            [FishRarity.MYTHIC]: 5
        };

        return rarityValues[offspringRarity] > rarityValues[highestParentRarity];
    }

    /**
     * Serialize breeding outcome
     */
    serialize(): object {
        return {
            parentFish1: this.parentFish1.serialize(),
            parentFish2: this.parentFish2.serialize(),
            offspring: this.offspring.map(fish => fish.serialize()),
            hasMutation: this.hasMutation
        };
    }
}