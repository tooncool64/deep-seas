import { BreedingPair } from './BreedingPair';

/**
 * Represents a tank that can hold a breeding pair of fish
 */
export class BreedingTank {
    // Unique identifier
    id: string;

    // Currently breeding pair, if any
    breedingPair: BreedingPair | null = null;

    constructor(id: string) {
        this.id = id;
    }

    /**
     * Check if the tank is currently occupied
     */
    isOccupied(): boolean {
        return this.breedingPair !== null;
    }

    /**
     * Set a breeding pair in this tank
     */
    setPair(pair: BreedingPair): boolean {
        if (this.isOccupied()) {
            return false;
        }

        this.breedingPair = pair;
        return true;
    }

    /**
     * Clear the breeding pair from this tank
     */
    clearPair(): BreedingPair | null {
        const pair = this.breedingPair;
        this.breedingPair = null;
        return pair;
    }

    /**
     * Get the current breeding progress (0-1)
     */
    getProgress(): number {
        if (!this.breedingPair) {
            return 0;
        }

        return this.breedingPair.breedingProgress;
    }

    /**
     * Get the remaining time for current breeding in milliseconds
     */
    getTimeRemaining(): number {
        if (!this.breedingPair) {
            return 0;
        }

        return this.breedingPair.getTimeRemaining();
    }

    /**
     * Get information about the breeding pair
     */
    getPairInfo(): { fish1Name: string, fish2Name: string } | null {
        if (!this.breedingPair) {
            return null;
        }

        return {
            fish1Name: this.breedingPair.fish1.displayName,
            fish2Name: this.breedingPair.fish2.displayName
        };
    }

    /**
     * Serialize breeding tank for saving
     */
    serialize(): object {
        return {
            id: this.id,
            breedingPair: this.breedingPair ? this.breedingPair.serialize() : null
        };
    }

    /**
     * Deserialize breeding tank from saved data
     */
    deserialize(data: any): void {
        if (data && data.breedingPair) {
            this.breedingPair = BreedingPair.deserialize(data.breedingPair);
        }
    }
}