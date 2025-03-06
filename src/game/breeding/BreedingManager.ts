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