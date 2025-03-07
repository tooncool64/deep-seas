import { Fish } from '../fish/Fish';
import { generateId } from '../../utils/Random';

/**
 * Represents a fish tank that can hold fish for passive ability activation
 */
export class FishTank {
    // Unique identifier
    id: string;

    // Tank name
    name: string;

    // Fish currently in the tank
    fish: Fish | null = null;

    // Whether the tank is active (fish ability is active)
    isActive: boolean = false;

    constructor(id: string, name: string) {
        this.id = id;
        this.name = name;
    }

    /**
     * Add a fish to this tank
     * @returns true if successful, false if tank already has a fish
     */
    addFish(fish: Fish): boolean {
        if (this.fish) {
            return false;
        }

        this.fish = fish;
        this.isActive = true;
        return true;
    }

    /**
     * Remove and return the fish from this tank
     */
    removeFish(): Fish | null {
        const fish = this.fish;
        this.fish = null;
        this.isActive = false;
        return fish;
    }

    /**
     * Check if the tank contains a fish
     */
    hasFish(): boolean {
        return this.fish !== null;
    }

    /**
     * Serialize tank for saving
     */
    serialize(): object {
        return {
            id: this.id,
            name: this.name,
            fish: this.fish ? this.fish.serialize() : null,
            isActive: this.isActive
        };
    }

    /**
     * Deserialize tank from saved data
     */
    deserialize(data: any): void {
        if (data) {
            this.name = data.name || this.name;
            this.isActive = data.isActive || false;

            // Restore fish if present
            if (data.fish) {
                this.fish = Fish.deserialize(data.fish);
            } else {
                this.fish = null;
            }
        }
    }
}

/**
 * Manages fish tanks for passive abilities
 */
export class FishTankManager {
    // Available tanks
    private tanks: Map<string, FishTank> = new Map();

    // Maximum number of tanks
    private maxTanks: number;

    // Event callbacks
    private onFishAdded: ((tank: FishTank, fish: Fish) => void)[] = [];
    private onFishRemoved: ((tank: FishTank, fish: Fish) => void)[] = [];

    constructor(initialTanks: number = 1) {
        this.maxTanks = initialTanks;
        this.initializeTanks();
    }

    /**
     * Initialize tanks
     */
    private initializeTanks(): void {
        for (let i = 0; i < this.maxTanks; i++) {
            const tankId = generateId('tank-');
            const tankName = `Tank ${i + 1}`;
            this.tanks.set(tankId, new FishTank(tankId, tankName));
        }
    }

    /**
     * Get all tanks
     */
    getAllTanks(): FishTank[] {
        return Array.from(this.tanks.values());
    }

    /**
     * Get a specific tank by ID
     */
    getTank(tankId: string): FishTank | undefined {
        return this.tanks.get(tankId);
    }

    /**
     * Add a fish to the first available tank
     * @returns tank ID if successful, null if no tanks available
     */
    addFishToTank(fish: Fish): string | null {
        // Find an available tank
        for (const tank of this.tanks.values()) {
            if (!tank.hasFish()) {
                const success = tank.addFish(fish);

                if (success) {
                    // Notify listeners
                    this.notifyFishAdded(tank, fish);
                    return tank.id;
                }
            }
        }

        return null; // No tanks available
    }

    /**
     * Add a fish to a specific tank
     * @returns true if successful
     */
    addFishToSpecificTank(fish: Fish, tankId: string): boolean {
        const tank = this.tanks.get(tankId);

        if (!tank || tank.hasFish()) {
            return false;
        }

        const success = tank.addFish(fish);

        if (success) {
            // Notify listeners
            this.notifyFishAdded(tank, fish);
        }

        return success;
    }

    /**
     * Remove a fish from a tank
     * @returns the removed fish if successful, null otherwise
     */
    removeFishFromTank(tankId: string): Fish | null {
        const tank = this.tanks.get(tankId);

        if (!tank || !tank.hasFish()) {
            return null;
        }

        const fish = tank.removeFish();

        if (fish) {
            // Notify listeners
            this.notifyFishRemoved(tank, fish);
        }

        return fish;
    }

    /**
     * Check if a fish is in any tank
     * @returns tank ID if fish is in a tank, null otherwise
     */
    isFishInTank(fishId: string): string | null {
        for (const tank of this.tanks.values()) {
            if (tank.fish && tank.fish.id === fishId) {
                return tank.id;
            }
        }

        return null;
    }

    /**
     * Get all fish in tanks
     */
    getAllFishInTanks(): Fish[] {
        const result: Fish[] = [];

        for (const tank of this.tanks.values()) {
            if (tank.fish) {
                result.push(tank.fish);
            }
        }

        return result;
    }

    /**
     * Increase the maximum number of tanks
     */
    increaseMaxTanks(amount: number): void {
        const oldMax = this.maxTanks;
        this.maxTanks += amount;

        // Create new tanks
        for (let i = oldMax; i < this.maxTanks; i++) {
            const tankId = generateId('tank-');
            const tankName = `Tank ${i + 1}`;
            this.tanks.set(tankId, new FishTank(tankId, tankName));
        }
    }

    /**
     * Register callback for when a fish is added to a tank
     */
    registerFishAddedCallback(callback: (tank: FishTank, fish: Fish) => void): void {
        this.onFishAdded.push(callback);
    }

    /**
     * Register callback for when a fish is removed from a tank
     */
    registerFishRemovedCallback(callback: (tank: FishTank, fish: Fish) => void): void {
        this.onFishRemoved.push(callback);
    }

    /**
     * Notify listeners that a fish was added to a tank
     */
    private notifyFishAdded(tank: FishTank, fish: Fish): void {
        for (const callback of this.onFishAdded) {
            callback(tank, fish);
        }
    }

    /**
     * Notify listeners that a fish was removed from a tank
     */
    private notifyFishRemoved(tank: FishTank, fish: Fish): void {
        for (const callback of this.onFishRemoved) {
            callback(tank, fish);
        }
    }

    /**
     * Check if there are any available tanks
     */
    hasAvailableTanks(): boolean {
        for (const tank of this.tanks.values()) {
            if (!tank.hasFish()) {
                return true;
            }
        }
        return false;
    }

    /**
     * Get the number of tanks that have fish
     */
    getActiveTankCount(): number {
        let count = 0;
        for (const tank of this.tanks.values()) {
            if (tank.hasFish()) {
                count++;
            }
        }
        return count;
    }

    /**
     * Serialize for saving
     */
    serialize(): object {
        const serializedTanks: Record<string, any> = {};

        for (const [id, tank] of this.tanks.entries()) {
            serializedTanks[id] = tank.serialize();
        }

        return {
            maxTanks: this.maxTanks,
            tanks: serializedTanks
        };
    }

    /**
     * Deserialize from saved data
     */
    deserialize(data: any): void {
        if (!data) return;

        // Set max tanks
        if (typeof data.maxTanks === 'number') {
            this.maxTanks = data.maxTanks;
        }

        // Clear current tanks
        this.tanks.clear();

        // Restore tanks from save data
        if (data.tanks) {
            for (const tankId in data.tanks) {
                const tankData = data.tanks[tankId];
                const tankName = tankData.name || `Tank ${this.tanks.size + 1}`;
                const tank = new FishTank(tankId, tankName);
                tank.deserialize(tankData);
                this.tanks.set(tankId, tank);
            }
        }

        // Make sure we have enough tanks
        if (this.tanks.size < this.maxTanks) {
            for (let i = this.tanks.size; i < this.maxTanks; i++) {
                const tankId = generateId('tank-');
                const tankName = `Tank ${i + 1}`;
                this.tanks.set(tankId, new FishTank(tankId, tankName));
            }
        }
    }
}