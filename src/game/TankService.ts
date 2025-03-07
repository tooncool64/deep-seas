import { GameService } from './GameService';
import { FishTankManager } from './tanks/FishTankManager';
import { Fish } from './fish/Fish';
import { AbilityManager } from './abilities/AbilityManager';
import { Inventory } from './inventory/Inventory';
import { FishTank } from './tanks/FishTankManager';

/**
 * TankService - Manages fish tanks and their abilities
 */
export class TankService extends GameService {
    // Core dependencies
    private tankManager: FishTankManager;
    private abilityManager: AbilityManager;
    private inventory: Inventory;

    // Event callbacks
    private onFishAddedToTank: ((fish: Fish, tankId: string) => void)[] = [];
    private onFishRemovedFromTank: ((fish: Fish, tankId: string) => void)[] = [];
    private onTanksChanged: (() => void)[] = [];

    constructor(
        tankManager: FishTankManager,
        abilityManager: AbilityManager,
        inventory: Inventory
    ) {
        super();
        this.tankManager = tankManager;
        this.abilityManager = abilityManager;
        this.inventory = inventory;
    }

    /**
     * Initialize the service
     */
    initialize(): void {
        // Set up tank manager callbacks
        this.tankManager.registerFishAddedCallback((tank, fish) => {
            this.abilityManager.setFishInTank(fish.id, true);
            this.notifyFishAddedToTank(fish, tank.id);
        });

        this.tankManager.registerFishRemovedCallback((tank, fish) => {
            this.abilityManager.setFishInTank(fish.id, false);
            this.notifyFishRemovedFromTank(fish, tank.id);
        });
    }

    /**
     * Update the service (called on game tick)
     * @param deltaTime Time since last update in milliseconds
     */
    update(deltaTime: number): void {
        // No per-frame updates needed for tank service
    }

    /**
     * Add a fish to a tank
     * @param fish The fish to add
     * @param tankId Optional specific tank ID, or empty for any available tank
     */
    addFishToTank(fish: Fish, tankId: string = ''): boolean {
        // Remove from inventory first
        const removed = this.inventory.removeFish(fish.id);

        if (!removed) {
            return false;
        }

        // Add to tank
        let success: boolean;

        if (tankId) {
            success = this.tankManager.addFishToSpecificTank(fish, tankId);
        } else {
            const newTankId = this.tankManager.addFishToTank(fish);
            success = newTankId !== null;
        }

        if (!success) {
            // Failed to add to tank, return to inventory
            this.inventory.addFish(fish);
            return false;
        }

        this.notifyTanksChanged();
        return true;
    }

    /**
     * Remove a fish from a tank
     */
    removeFishFromTank(tankId: string): Fish | null {
        // Check if inventory has space
        if (this.inventory.isFull()) {
            return null;
        }

        // Remove from tank
        const fish = this.tankManager.removeFishFromTank(tankId);

        if (!fish) {
            return null;
        }

        // Add to inventory
        this.inventory.addFish(fish);

        this.notifyTanksChanged();
        return fish;
    }

    /**
     * Get all tanks
     */
    getAllTanks(): FishTank[] {
        return this.tankManager.getAllTanks();
    }

    /**
     * Get all fish in tanks
     */
    getAllFishInTanks(): Fish[] {
        return this.tankManager.getAllFishInTanks();
    }

    /**
     * Check if a fish is in any tank
     */
    isFishInTank(fishId: string): boolean {
        return this.tankManager.isFishInTank(fishId) !== null;
    }

    /**
     * Find which tank contains a specific fish
     */
    getTankContainingFish(fishId: string): string | null {
        return this.tankManager.isFishInTank(fishId);
    }

    /**
     * Check if tanks are available
     */
    hasAvailableTanks(): boolean {
        return this.tankManager.hasAvailableTanks();
    }

    /**
     * Increase the maximum number of tanks
     */
    increaseMaxTanks(amount: number): void {
        this.tankManager.increaseMaxTanks(amount);
        this.notifyTanksChanged();
    }

    /**
     * Register a callback for when a fish is added to a tank
     */
    registerFishAddedToTankCallback(callback: (fish: Fish, tankId: string) => void): void {
        this.onFishAddedToTank.push(callback);
    }

    /**
     * Register a callback for when a fish is removed from a tank
     */
    registerFishRemovedFromTankCallback(callback: (fish: Fish, tankId: string) => void): void {
        this.onFishRemovedFromTank.push(callback);
    }

    /**
     * Register a callback for when tanks change
     */
    registerTanksChangedCallback(callback: () => void): void {
        this.onTanksChanged.push(callback);
    }

    /**
     * Notify callbacks when a fish is added to a tank
     */
    private notifyFishAddedToTank(fish: Fish, tankId: string): void {
        for (const callback of this.onFishAddedToTank) {
            callback(fish, tankId);
        }
    }

    /**
     * Notify callbacks when a fish is removed from a tank
     */
    private notifyFishRemovedFromTank(fish: Fish, tankId: string): void {
        for (const callback of this.onFishRemovedFromTank) {
            callback(fish, tankId);
        }
    }

    /**
     * Notify callbacks when tanks change
     */
    private notifyTanksChanged(): void {
        for (const callback of this.onTanksChanged) {
            callback();
        }
    }

    /**
     * Serialize service for saving
     */
    serialize(): object {
        return {}; // No additional data to save, tank manager handles its own serialization
    }

    /**
     * Deserialize service from saved data
     */
    deserialize(data: any): void {
        // No additional data to restore
    }
}