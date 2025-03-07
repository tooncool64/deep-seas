import { GameService } from './GameService';
import { FishManager } from './fish/FishManager';
import { BreedingManager } from './breeding/BreedingManager';
import { Fish } from './fish/Fish';
import { BreedingOutcome } from './breeding/BreedingOutcome';
import { StatsTracker } from './stats/StatsTracker';
import { AbilityManager } from './abilities/AbilityManager';
import { BreedingTank } from './breeding/BreedingTank';

/**
 * BreedingService - Handles fish breeding mechanics
 */
export class BreedingService extends GameService {
    // Core dependencies
    private breedingManager: BreedingManager;
    private statsTracker: StatsTracker;
    private abilityManager: AbilityManager;

    // Current breeding efficiency
    private breedingEfficiency: number = 1;

    // Event callbacks
    private onBreedingOutcome: ((outcome: BreedingOutcome) => void)[] = [];
    private onBreedingStarted: ((fish1: Fish, fish2: Fish) => void)[] = [];
    private onBreedingCancelled: ((tankId: string) => void)[] = [];

    constructor(
        breedingManager: BreedingManager,
        statsTracker: StatsTracker,
        abilityManager: AbilityManager
    ) {
        super();
        this.breedingManager = breedingManager;
        this.statsTracker = statsTracker;
        this.abilityManager = abilityManager;
    }

    /**
     * Initialize the service
     */
    initialize(): void {
        // Set up breeding outcome callback
        this.breedingManager.registerBreedingCompleteCallback((outcome) => {
            this.handleBreedingOutcome(outcome);
        });
    }

    /**
     * Update the service (called on game tick)
     * @param deltaTime Time since last update in milliseconds
     */
    update(deltaTime: number): void {
        // Update breeding process
        this.breedingManager.update(deltaTime);
    }

    /**
     * Start a breeding attempt
     */
    startBreeding(fish1: Fish, fish2: Fish): boolean {
        // Apply breeding efficiency bonus from abilities
        const breedingEfficiencyBonus = this.abilityManager.getBuffValue('breedingEfficiencyBonus');

        // Calculate total breeding efficiency
        const totalBreedingEfficiency = this.breedingEfficiency + breedingEfficiencyBonus;

        // Start breeding
        const tankId = this.breedingManager.startBreeding(
            fish1,
            fish2,
            totalBreedingEfficiency
        );

        if (!tankId) {
            return false;
        }

        // Track breeding attempt
        this.statsTracker.registerBreedingAttempt(true);

        // Notify listeners
        this.notifyBreedingStarted(fish1, fish2);

        return true;
    }

    /**
     * Cancel breeding in a specific tank
     */
    cancelBreeding(tankId: string): boolean {
        const success = this.breedingManager.cancelBreeding(tankId);

        if (success) {
            this.notifyBreedingCancelled(tankId);
        }

        return success;
    }

    /**
     * Handle breeding outcome
     */
    private handleBreedingOutcome(outcome: BreedingOutcome): void {
        // Update stats
        this.statsTracker.registerBreedingAttempt(
            true,
            outcome.offspring.length,
            outcome.hasMutation
        );

        // Notify listeners
        this.notifyBreedingOutcome(outcome);
    }

    /**
     * Check if two fish are compatible for breeding
     */
    checkCompatibility(fish1: Fish, fish2: Fish): boolean {
        return this.breedingManager.checkCompatibility(fish1, fish2);
    }

    /**
     * Get all breeding tanks
     */
    getAllTanks(): BreedingTank[] {
        return this.breedingManager.getAllTanks();
    }

    /**
     * Check if any tanks are available for breeding
     */
    hasAvailableTanks(): boolean {
        return this.breedingManager.hasAvailableTanks();
    }

    /**
     * Calculate the success chance for a breeding pair
     */
    calculateBreedingSuccessChance(fish1: Fish, fish2: Fish): number {
        const efficiencyBonus = this.abilityManager.getBuffValue('breedingEfficiencyBonus');
        const totalEfficiency = this.breedingEfficiency + efficiencyBonus;

        return this.breedingManager.calculateBreedingSuccessChance(fish1, fish2, totalEfficiency);
    }

    /**
     * Calculate potential offspring range based on breeding efficiency
     */
    calculatePotentialOffspringRange(): [number, number] {
        const efficiencyBonus = this.abilityManager.getBuffValue('breedingEfficiencyBonus');
        const totalEfficiency = this.breedingEfficiency + efficiencyBonus;

        return this.breedingManager.calculatePotentialOffspringRange(totalEfficiency);
    }

    /**
     * Calculate mutation chance for a breeding pair
     */
    calculateMutationChance(fish1: Fish, fish2: Fish): number {
        const efficiencyBonus = this.abilityManager.getBuffValue('breedingEfficiencyBonus');
        const totalEfficiency = this.breedingEfficiency + efficiencyBonus;

        return this.breedingManager.calculateMutationChance(fish1, fish2, totalEfficiency);
    }

    /**
     * Set breeding efficiency
     */
    setBreedingEfficiency(efficiency: number): void {
        this.breedingEfficiency = efficiency;
    }

    /**
     * Register a callback for breeding outcome
     */
    registerBreedingOutcomeCallback(callback: (outcome: BreedingOutcome) => void): void {
        this.onBreedingOutcome.push(callback);
    }

    /**
     * Register a callback for breeding started
     */
    registerBreedingStartedCallback(callback: (fish1: Fish, fish2: Fish) => void): void {
        this.onBreedingStarted.push(callback);
    }

    /**
     * Register a callback for breeding cancelled
     */
    registerBreedingCancelledCallback(callback: (tankId: string) => void): void {
        this.onBreedingCancelled.push(callback);
    }

    /**
     * Notify callbacks when breeding outcome is received
     */
    private notifyBreedingOutcome(outcome: BreedingOutcome): void {
        for (const callback of this.onBreedingOutcome) {
            callback(outcome);
        }
    }

    /**
     * Notify callbacks when breeding is started
     */
    private notifyBreedingStarted(fish1: Fish, fish2: Fish): void {
        for (const callback of this.onBreedingStarted) {
            callback(fish1, fish2);
        }
    }

    /**
     * Notify callbacks when breeding is cancelled
     */
    private notifyBreedingCancelled(tankId: string): void {
        for (const callback of this.onBreedingCancelled) {
            callback(tankId);
        }
    }

    /**
     * Serialize service for saving
     */
    serialize(): object {
        return {
            breedingEfficiency: this.breedingEfficiency
        };
    }

    /**
     * Deserialize service from saved data
     */
    deserialize(data: any): void {
        if (!data) return;

        this.breedingEfficiency = data.breedingEfficiency ?? this.breedingEfficiency;
    }
}