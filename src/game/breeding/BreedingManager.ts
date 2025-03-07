import { Fish } from '../fish/Fish';
import { FishManager } from '../fish/FishManager';
import { BreedingPair } from './BreedingPair';
import { BreedingOutcome } from './BreedingOutcome';
import { generateId } from '../../utils/Random';
import { BreedingTank } from './BreedingTank';

/**
 * Manages the breeding system for the game
 */
export class BreedingManager {
    // Breeding tanks where fish pairs are placed
    private breedingTanks: Map<string, BreedingTank> = new Map();

    // Maximum number of breeding tanks
    private maxTanks: number;

    // Reference to fish manager for species information
    private fishManager: FishManager;

    // Event callbacks
    private onBreedingComplete: ((outcome: BreedingOutcome) => void)[] = [];

    constructor(fishManager: FishManager, initialTanks: number = 1) {
        this.fishManager = fishManager;
        this.maxTanks = initialTanks;

        // Initialize initial tanks
        this.initializeTanks();
    }

    /**
     * Initialize breeding tanks
     */
    private initializeTanks(): void {
        for (let i = 0; i < this.maxTanks; i++) {
            const tankId = generateId('tank-');
            this.breedingTanks.set(tankId, new BreedingTank(tankId));
        }
    }

    /**
     * Get all breeding tanks
     */
    getAllTanks(): BreedingTank[] {
        return Array.from(this.breedingTanks.values());
    }

    /**
     * Get a specific tank by ID
     */
    getTank(tankId: string): BreedingTank | undefined {
        return this.breedingTanks.get(tankId);
    }

    /**
     * Check if two fish are compatible for breeding
     */
    checkCompatibility(fish1: Fish, fish2: Fish): boolean {
        // For now, fish can breed if they are the same species
        return fish1.speciesId === fish2.speciesId;

        // In future development cycles, this will be expanded to check:
        // - Fish health/age
        // - Species compatibility matrix
        // - Special breeding conditions
    }

    /**
     * Place a breeding pair in an available tank
     * @returns tank ID if successful, null if no tanks available
     */
    startBreeding(fish1: Fish, fish2: Fish, breedingEfficiency: number = 1): string | null {
        // Check compatibility
        if (!this.checkCompatibility(fish1, fish2)) {
            return null;
        }

        // Find an available tank
        let availableTank: BreedingTank | undefined;

        for (const tank of this.breedingTanks.values()) {
            if (!tank.isOccupied()) {
                availableTank = tank;
                break;
            }
        }

        if (!availableTank) {
            return null; // No tanks available
        }

        // Create breeding pair
        const breedingPair = new BreedingPair(fish1, fish2, breedingEfficiency);

        // Set up completion callback
        breedingPair.onComplete = () => {
            // Generate outcome
            const outcome = new BreedingOutcome(
                fish1,
                fish2,
                this.fishManager,
                breedingEfficiency
            );

            // Notify listeners
            this.notifyBreedingComplete(outcome);

            // Clear tank
            availableTank!.clearPair();
        };

        // Place pair in tank
        availableTank.setPair(breedingPair);

        // Start breeding process
        breedingPair.startBreeding();

        return availableTank.id;
    }

    /**
     * Cancel breeding in a specific tank
     */
    cancelBreeding(tankId: string): boolean {
        const tank = this.breedingTanks.get(tankId);

        if (!tank || !tank.isOccupied()) {
            return false;
        }

        tank.clearPair();
        return true;
    }

    /**
     * Calculate the chance of successful breeding for a pair of fish
     * @returns Value between 0-1 representing success chance
     */
    calculateBreedingSuccessChance(fish1: Fish, fish2: Fish, breedingEfficiency: number = 1): number {
        // Base chance is higher for more similar fish
        let baseChance = 0.7; // Default 70% chance

        // Same species increases chance significantly
        if (fish1.speciesId === fish2.speciesId) {
            baseChance += 0.2; // +20% for same species
        }

        // Similar depth preferences increase chance
        const depthDifference = Math.abs(fish1.caughtDepth - fish2.caughtDepth);
        const maxDepthDiff = 100; // Consider depths within 100m as "close"
        if (depthDifference < maxDepthDiff) {
            baseChance += 0.1 * (1 - depthDifference / maxDepthDiff); // Up to +10% for similar depths
        }

        // Higher rarity reduces chance slightly
        const rarityValues = {
            'common': 0,
            'uncommon': 1,
            'rare': 2,
            'legendary': 3,
            'mythic': 4
        };

        const averageRarity = (rarityValues[fish1.rarity] + rarityValues[fish2.rarity]) / 2;
        const rarityPenalty = 0.02 * averageRarity; // Up to -8% for mythic pairs

        // Breeding efficiency bonus
        const efficiencyBonus = 0.05 * (breedingEfficiency - 1); // +5% per efficiency point above 1

        // Calculate final chance, ensure it's between 0-1
        const finalChance = Math.min(1, Math.max(0, baseChance - rarityPenalty + efficiencyBonus));

        return finalChance;
    }

    /**
     * Calculate potential offspring count range based on breeding efficiency
     */
    calculatePotentialOffspringRange(breedingEfficiency: number = 1): [number, number] {
        const baseOffspringCount = 1;
        const maxExtraOffspring = Math.floor(breedingEfficiency);

        return [baseOffspringCount, baseOffspringCount + maxExtraOffspring];
    }

    /**
     * Calculate chance of mutation based on parent fish
     */
    calculateMutationChance(fish1: Fish, fish2: Fish, breedingEfficiency: number = 1): number {
        const rarityValues = {
            'common': 0,
            'uncommon': 1,
            'rare': 2,
            'legendary': 3,
            'mythic': 4
        };

        // Higher rarity has higher chance of mutation
        const highestRarity = Math.max(rarityValues[fish1.rarity], rarityValues[fish2.rarity]);

        let mutationChance = 0;
        switch (highestRarity) {
            case 0: mutationChance = 0.05; break; // 5% for commons
            case 1: mutationChance = 0.08; break; // 8% for uncommons
            case 2: mutationChance = 0.12; break; // 12% for rares
            case 3: mutationChance = 0.15; break; // 15% for legendaries
            case 4: mutationChance = 0.18; break; // 18% for mythics
        }

        // Breeding efficiency increases mutation chance
        const efficiencyBonus = 0.02 * (breedingEfficiency - 1); // +2% per efficiency point

        return Math.min(0.5, mutationChance + efficiencyBonus); // Cap at 50%
    }

    /**
     * Increase the number of available breeding tanks
     */
    increaseMaxTanks(amount: number): void {
        const oldMax = this.maxTanks;
        this.maxTanks += amount;

        // Create new tanks
        for (let i = oldMax; i < this.maxTanks; i++) {
            const tankId = generateId('tank-');
            this.breedingTanks.set(tankId, new BreedingTank(tankId));
        }
    }

    /**
     * Register a callback for breeding completion
     */
    registerBreedingCompleteCallback(callback: (outcome: BreedingOutcome) => void): void {
        this.onBreedingComplete.push(callback);
    }

    /**
     * Notify all callbacks about breeding completion
     */
    private notifyBreedingComplete(outcome: BreedingOutcome): void {
        for (const callback of this.onBreedingComplete) {
            callback(outcome);
        }
    }

    /**
     * Get breeding efficiency based on player upgrades
     */
    getBreedingEfficiency(breedingEfficiencyBonus: number): number {
        return 1 + breedingEfficiencyBonus;
    }

    /**
     * Check if player has any available tanks
     */
    hasAvailableTanks(): boolean {
        for (const tank of this.breedingTanks.values()) {
            if (!tank.isOccupied()) {
                return true;
            }
        }
        return false;
    }

    /**
     * Update breeding progress (call on game tick)
     */
    update(deltaTime: number): void {
        for (const tank of this.breedingTanks.values()) {
            if (tank.isOccupied()) {
                tank.breedingPair!.update(deltaTime);
            }
        }
    }

    /**
     * Serialize breeding manager for saving
     */
    serialize(): object {
        const serializedTanks: Record<string, any> = {};

        for (const [id, tank] of this.breedingTanks.entries()) {
            serializedTanks[id] = tank.serialize();
        }

        return {
            maxTanks: this.maxTanks,
            tanks: serializedTanks
        };
    }

    /**
     * Deserialize breeding manager from saved data
     */
    deserialize(data: any): void {
        if (data) {
            // Set max tanks
            if (typeof data.maxTanks === 'number') {
                this.maxTanks = data.maxTanks;
            }

            // Clear current tanks
            this.breedingTanks.clear();

            // Restore tanks from save data
            if (data.tanks) {
                for (const tankId in data.tanks) {
                    const tankData = data.tanks[tankId];
                    const tank = new BreedingTank(tankId);
                    tank.deserialize(tankData);

                    // If tank has a breeding pair, set up completion callback
                    if (tank.isOccupied() && tank.breedingPair) {
                        tank.breedingPair.onComplete = () => {
                            // Generate outcome
                            const outcome = new BreedingOutcome(
                                tank.breedingPair!.fish1,
                                tank.breedingPair!.fish2,
                                this.fishManager,
                                tank.breedingPair!.breedingEfficiency
                            );

                            // Notify listeners
                            this.notifyBreedingComplete(outcome);

                            // Clear tank
                            tank.clearPair();
                        };
                    }

                    this.breedingTanks.set(tankId, tank);
                }
            }

            // Make sure we have at least the minimum tanks
            if (this.breedingTanks.size < this.maxTanks) {
                for (let i = this.breedingTanks.size; i < this.maxTanks; i++) {
                    const tankId = generateId('tank-');
                    this.breedingTanks.set(tankId, new BreedingTank(tankId));
                }
            }
        }
    }
}