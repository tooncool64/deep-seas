import { Fish, FishSpecies } from './Fish';
import { FishRarity, RARITY_CHANCES, SURFACE_FISH } from '../../utils/Constants';
import { chance, randomElement, weightedRandom } from '../../utils/Random';

/**
 * Manages fish species and generation
 */
export class FishManager {
    // Map of all fish species by ID
    private fishSpecies: Map<string, FishSpecies> = new Map();

    // Fish species grouped by depth layer
    private fishByLayer: Map<string, FishSpecies[]> = new Map();

    constructor() {
        this.initializeFishSpecies();
    }

    /**
     * Initialize the available fish species
     */
    private initializeFishSpecies(): void {
        // Load surface fish species
        this.loadSurfaceFish();

        // Additional layers will be added in future development cycles
    }

    /**
     * Load the surface layer fish
     */
    private loadSurfaceFish(): void {
        const surfaceFish: FishSpecies[] = [];

        // Add all surface fish to the species map and layer array
        for (const fishData of SURFACE_FISH) {
            this.fishSpecies.set(fishData.id, fishData);
            surfaceFish.push(fishData);
        }

        this.fishByLayer.set('surface', surfaceFish);
    }

    /**
     * Get all fish species for a specific layer
     */
    getFishForLayer(layerId: string): FishSpecies[] {
        return this.fishByLayer.get(layerId) || [];
    }

    /**
     * Get a fish species by ID
     */
    getFishSpecies(speciesId: string): FishSpecies | undefined {
        return this.fishSpecies.get(speciesId);
    }

    /**
     * Generate a random rarity based on rarity chances
     */
    generateRarity(fishingPower: number = 1): FishRarity {
        // Increase chances of better rarities based on fishing power
        // For now, a simple linear boost to chances
        const rarityBoost = (fishingPower - 1) * 0.02; // 2% per fishing power level

        // Calculate rarity
        if (chance(RARITY_CHANCES[FishRarity.MYTHIC] + rarityBoost)) {
            return FishRarity.MYTHIC;
        } else if (chance(RARITY_CHANCES[FishRarity.LEGENDARY] + rarityBoost)) {
            return FishRarity.LEGENDARY;
        } else if (chance(RARITY_CHANCES[FishRarity.RARE] + rarityBoost)) {
            return FishRarity.RARE;
        } else if (chance(RARITY_CHANCES[FishRarity.UNCOMMON] + rarityBoost)) {
            return FishRarity.UNCOMMON;
        } else {
            return FishRarity.COMMON;
        }
    }

    /**
     * Generate a random fish at the given depth
     */
    generateFish(depth: number, fishingPower: number = 1): Fish | null {
        // Get all fish species available at this depth
        const availableSpecies = this.findAvailableSpeciesAtDepth(depth);

        if (availableSpecies.length === 0) {
            return null; // No fish available at this depth
        }

        // Select a random species
        const species = randomElement(availableSpecies);

        // Generate rarity
        const rarity = this.generateRarity(fishingPower);

        // Create and return the fish
        return new Fish(species, rarity, depth);
    }

    /**
     * Find all fish species available at a given depth
     */
    private findAvailableSpeciesAtDepth(depth: number): FishSpecies[] {
        const availableSpecies: FishSpecies[] = [];

        // Check all fish species to find ones available at this depth
        for (const species of this.fishSpecies.values()) {
            if (depth >= species.minDepth && depth <= species.maxDepth) {
                availableSpecies.push(species);
            }
        }

        return availableSpecies;
    }

    /**
     * Add a new fish species to the game
     * This allows for easy expansion in future development cycles
     */
    addFishSpecies(species: FishSpecies, layerId: string): void {
        // Add to main species map
        this.fishSpecies.set(species.id, species);

        // Add to layer map
        const layerFish = this.fishByLayer.get(layerId) || [];
        layerFish.push(species);
        this.fishByLayer.set(layerId, layerFish);
    }
}