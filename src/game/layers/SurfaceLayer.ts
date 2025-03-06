import { DepthLayer, DEPTH_RANGES } from '../../utils/Constants';
import { FishManager } from '../fish/FishManager';
import { Fish } from '../fish/Fish';
import { Layer } from './LayerManager';

/**
 * Implements the Surface layer (0-50m)
 */
export class SurfaceLayer implements Layer {
    // Basic properties
    id: string = DepthLayer.SURFACE;
    name: string = 'Surface';
    minDepth: number = DEPTH_RANGES[DepthLayer.SURFACE].min;
    maxDepth: number = DEPTH_RANGES[DepthLayer.SURFACE].max;
    isUnlocked: boolean = true; // Surface is always unlocked

    // Reference to fish manager
    private fishManager: FishManager;

    constructor(fishManager: FishManager) {
        this.fishManager = fishManager;
    }

    /**
     * Initialize the layer
     */
    initialize(): void {
        // Surface layer setup is handled in FishManager initialization
        // No additional setup needed here for now
    }

    /**
     * Check if a depth is within this layer's range
     */
    containsDepth(depth: number): boolean {
        return depth >= this.minDepth && depth <= this.maxDepth;
    }

    /**
     * Generate a fish at the given depth
     */
    generateFish(depth: number, fishingPower: number, rarityBoost: number = 0): Fish | null {
        // Make sure depth is within this layer's range
        if (!this.containsDepth(depth)) {
            return null;
        }

        // Use fish manager to generate a fish at this depth
        return this.fishManager.generateFish(depth, fishingPower, rarityBoost);
    }

    /**
     * Serialize layer for saving
     */
    serialize(): object {
        return {
            isUnlocked: this.isUnlocked
        };

        // Future expansion: add layer-specific state if needed
    }

    /**
     * Deserialize layer from saved data
     */
    deserialize(data: any): void {
        if (data && typeof data.isUnlocked === 'boolean') {
            this.isUnlocked = data.isUnlocked;
        }

        // Future expansion: restore layer-specific state if needed
    }

    /**
     * Calculate optimal catch time based on depth
     * Deeper means longer catch time
     */
    calculateCatchTime(depth: number, catchSpeedBonus: number): number {
        // Base time plus depth factor, reduced by catch speed bonus
        const baseTime = 3000; // 3 seconds base
        const depthFactor = depth / 10; // 100ms per 10m of depth

        // Calculate catch time with speed bonus (higher bonus = lower time)
        const catchTime = (baseTime + depthFactor) / (1 + catchSpeedBonus);

        // Ensure minimum catch time of 500ms
        return Math.max(500, catchTime);
    }
}