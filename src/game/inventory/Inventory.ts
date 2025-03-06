import { Fish } from '../fish/Fish';
import { generateId } from '../../utils/Random';

/**
 * Manages the player's inventory of caught fish
 */
export class Inventory {
    // Fish currently in inventory
    private fish: Map<string, Fish> = new Map();

    // Maximum capacity
    private capacity: number;

    constructor(initialCapacity: number = 10) {
        this.capacity = initialCapacity;
    }

    /**
     * Add a fish to inventory
     * @returns true if successful, false if inventory is full
     */
    addFish(fish: Fish): boolean {
        if (this.fish.size >= this.capacity) {
            return false; // Inventory full
        }

        this.fish.set(fish.id, fish);
        return true;
    }

    /**
     * Remove a fish from inventory
     */
    removeFish(fishId: string): Fish | null {
        const fish = this.fish.get(fishId);

        if (fish) {
            this.fish.delete(fishId);
            return fish;
        }

        return null;
    }

    /**
     * Get a fish by ID
     */
    getFish(fishId: string): Fish | undefined {
        return this.fish.get(fishId);
    }

    /**
     * Get all fish in inventory
     */
    getAllFish(): Fish[] {
        return Array.from(this.fish.values());
    }

    /**
     * Check if inventory is full
     */
    isFull(): boolean {
        return this.fish.size >= this.capacity;
    }

    /**
     * Get current inventory size
     */
    get size(): number {
        return this.fish.size;
    }

    /**
     * Get maximum inventory capacity
     */
    get maxCapacity(): number {
        return this.capacity;
    }

    /**
     * Increase inventory capacity
     */
    increaseCapacity(amount: number): void {
        this.capacity += amount;
    }

    /**
     * Set inventory capacity
     */
    setCapacity(capacity: number): void {
        this.capacity = capacity;
    }

    /**
     * Check how many free slots are available
     */
    get freeSlots(): number {
        return this.capacity - this.fish.size;
    }

    /**
     * Calculate total value of all fish in inventory
     */
    get totalValue(): number {
        let total = 0;
        for (const fish of this.fish.values()) {
            total += fish.value;
        }
        return total;
    }

    /**
     * Serialize inventory for saving
     */
    serialize(): object {
        const serializedFish = Array.from(this.fish.values()).map(fish => fish.serialize());

        return {
            capacity: this.capacity,
            fish: serializedFish
        };
    }

    /**
     * Deserialize inventory from saved data
     */
    static deserialize(data: any): Inventory {
        const inventory = new Inventory(data.capacity);

        // Restore fish
        if (data.fish && Array.isArray(data.fish)) {
            for (const fishData of data.fish) {
                const fish = Fish.deserialize(fishData);
                inventory.addFish(fish);
            }
        }

        return inventory;
    }
}