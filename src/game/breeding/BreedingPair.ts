import { Fish } from '../fish/Fish';
import { TIME_CONSTANTS } from '../../utils/Constants';

/**
 * Represents a pair of fish that are breeding
 */
export class BreedingPair {
    // The two fish in the breeding pair
    fish1: Fish;
    fish2: Fish;

    // Breeding stats
    breedingEfficiency: number;
    breedingProgress: number = 0;
    breedingStartTime: number;

    // Callback when breeding is complete
    onComplete: (() => void) | null = null;

    constructor(fish1: Fish, fish2: Fish, breedingEfficiency: number = 1) {
        this.fish1 = fish1;
        this.fish2 = fish2;
        this.breedingEfficiency = breedingEfficiency;
        this.breedingStartTime = Date.now();
    }

    /**
     * Start the breeding process
     */
    startBreeding(): void {
        this.breedingProgress = 0;
        this.breedingStartTime = Date.now();
    }

    /**
     * Update breeding progress
     * @param deltaTime Time since last update in milliseconds
     */
    update(deltaTime: number): void {
        // Calculate progress increase based on breeding efficiency
        const progressIncrease =
            (deltaTime / TIME_CONSTANTS.BASE_BREEDING_TIME) * this.breedingEfficiency;

        this.breedingProgress += progressIncrease;

        // Check if breeding is complete
        if (this.breedingProgress >= 1) {
            this.completeBreeding();
        }
    }

    /**
     * Complete the breeding process and call completion callback
     */
    private completeBreeding(): void {
        if (this.onComplete) {
            this.onComplete();
        }
    }

    /**
     * Get the estimated time remaining for breeding in milliseconds
     */
    getTimeRemaining(): number {
        const totalTime = TIME_CONSTANTS.BASE_BREEDING_TIME / this.breedingEfficiency;
        const elapsedTime = totalTime * this.breedingProgress;
        return Math.max(0, totalTime - elapsedTime);
    }

    /**
     * Get the breeding progress as a percentage (0-100)
     */
    getProgressPercentage(): number {
        return this.breedingProgress * 100;
    }

    /**
     * Serialize breeding pair for saving
     */
    serialize(): object {
        return {
            fish1: this.fish1.serialize(),
            fish2: this.fish2.serialize(),
            breedingEfficiency: this.breedingEfficiency,
            breedingProgress: this.breedingProgress,
            breedingStartTime: this.breedingStartTime
        };
    }

    /**
     * Deserialize breeding pair from saved data
     */
    static deserialize(data: any): BreedingPair | null {
        if (!data || !data.fish1 || !data.fish2) {
            return null;
        }

        const fish1 = Fish.deserialize(data.fish1);
        const fish2 = Fish.deserialize(data.fish2);
        const pair = new BreedingPair(
            fish1,
            fish2,
            data.breedingEfficiency || 1
        );

        pair.breedingProgress = data.breedingProgress || 0;
        pair.breedingStartTime = data.breedingStartTime || Date.now();

        return pair;
    }
}