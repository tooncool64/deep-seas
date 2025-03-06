import { DepthLayer, DEPTH_RANGES } from '../../utils/Constants';
import { FishManager } from '../fish/FishManager';
import { Fish } from '../fish/Fish';
import { Layer } from './LayerManager';
import { DEEP_SEA_FISH } from '../../utils/DeepSeaConstants';

/**
 * Implements the Deep Sea layer (50-1000m)
 */
export class DeepSeaLayer implements Layer {
    // Basic properties
    id: string = DepthLayer.DEEP_SEA;
    name: string = 'Deep Sea';
    minDepth: number = DEPTH_RANGES[DepthLayer.DEEP_SEA].min;
    maxDepth: number = DEPTH_RANGES[DepthLayer.DEEP_SEA].max;
    isUnlocked: boolean = false; // Needs to be unlocked

    // Reference to fish manager
    private fishManager: FishManager;

    // Pressure resistance (0-1) affects chance of successful fishing
    private pressureResistance: number = 0;

    constructor(fishManager: FishManager) {
        this.fishManager = fishManager;
    }

    /**
     * Initialize the layer with deep sea fish
     */
    initialize(): void {
        // Add all deep sea fish to the fish manager
        for (const fishData of DEEP_SEA_FISH) {
            this.fishManager.addFishSpecies(fishData, this.id);
        }
    }

    /**
     * Check if a depth is within this layer's range
     */
    containsDepth(depth: number): boolean {
        return depth >= this.minDepth && depth <= this.maxDepth;
    }

    /**
     * Generate a fish at the given depth, considering pressure resistance
     */
    generateFish(depth: number, fishingPower: number): Fish | null {
        // Make sure depth is within this layer's range
        if (!this.containsDepth(depth)) {
            return null;
        }

        // Calculate pressure at this depth
        const relativeDepth = (depth - this.minDepth) / (this.maxDepth - this.minDepth);

        // Calculate chance of successful catch based on pressure resistance
        // Higher depths need better pressure resistance
        const requiredResistance = relativeDepth * 0.9; // Max 90% resistance needed at max depth
        const successChance = 1 - Math.max(0, requiredResistance - this.pressureResistance);

        // Random chance to fail catching based on pressure resistance
        if (Math.random() > successChance) {
            return null; // Fish escaped due to pressure issues
        }

        // Use fish manager to generate a fish at this depth
        return this.fishManager.generateFish(depth, fishingPower);
    }

    /**
     * Calculate catch time based on depth and pressure
     * Deeper means longer catch time, modified by catch speed bonus
     */
    calculateCatchTime(depth: number, catchSpeedBonus: number): number {
        // Base time plus depth factor, increased by pressure
        const baseTime = 5000; // 5 seconds base for deep sea
        const depthFactor = (depth - this.minDepth) / 10; // 100ms per 10m beyond min depth
        const pressureFactor = 1 + (1 - this.pressureResistance) * 0.5; // Up to 50% penalty for low resistance

        // Calculate catch time with speed bonus (higher bonus = lower time)
        const catchTime = (baseTime + depthFactor) * pressureFactor / (1 + catchSpeedBonus);

        // Ensure minimum catch time of 1000ms
        return Math.max(1000, catchTime);
    }

    /**
     * Set pressure resistance level (0-1)
     */
    setPressureResistance(resistance: number): void {
        this.pressureResistance = Math.max(0, Math.min(1, resistance));
    }

    /**
     * Get current pressure resistance (0-1)
     */
    getPressureResistance(): number {
        return this.pressureResistance;
    }

    /**
     * Serialize layer for saving
     */
    serialize(): object {
        return {
            isUnlocked: this.isUnlocked,
            pressureResistance: this.pressureResistance
        };
    }

    /**
     * Deserialize layer from saved data
     */
    deserialize(data: any): void {
        if (data) {
            if (typeof data.isUnlocked === 'boolean') {
                this.isUnlocked = data.isUnlocked;
            }

            if (typeof data.pressureResistance === 'number') {
                this.pressureResistance = data.pressureResistance;
            }
        }
    }
}