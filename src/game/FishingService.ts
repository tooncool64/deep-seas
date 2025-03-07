import { GameService } from './GameService';
import { FishManager } from './fish/FishManager';
import { Inventory } from './inventory/Inventory';
import { LayerManager } from './layers/LayerManager';
import { StatsTracker } from './stats/StatsTracker';
import { AbilityManager } from './abilities/AbilityManager';
import { Fish } from './fish/Fish';
import { randomInt } from '../utils/Random';

/**
 * FishingService - Handles fishing mechanics
 */
export class FishingService extends GameService {
    // Core dependencies
    private fishManager: FishManager;
    private inventory: Inventory;
    private layerManager: LayerManager;
    private statsTracker: StatsTracker;
    private abilityManager: AbilityManager;

    // Fishing state
    private isFishing: boolean = false;
    private fishingTimeout: NodeJS.Timeout | null = null;
    private currentDepth: number = 0;
    private maxDepth: number = 10;
    private fishingPower: number = 1;
    private lineStrength: number = 1;
    private catchSpeed: number = 1;

    // Event callbacks
    private onFishCaught: ((fish: Fish | null) => void)[] = [];
    private onFishingStart: (() => void)[] = [];
    private onFishingEnd: (() => void)[] = [];

    constructor(
        fishManager: FishManager,
        inventory: Inventory,
        layerManager: LayerManager,
        statsTracker: StatsTracker,
        abilityManager: AbilityManager
    ) {
        super();
        this.fishManager = fishManager;
        this.inventory = inventory;
        this.layerManager = layerManager;
        this.statsTracker = statsTracker;
        this.abilityManager = abilityManager;
    }

    /**
     * Initialize the service
     */
    initialize(): void {
        // Nothing to initialize yet
    }

    /**
     * Update the service (called on game tick)
     * @param deltaTime Time since last update in milliseconds
     */
    update(deltaTime: number): void {
        // No per-frame updates needed for fishing service
    }

    /**
     * Start fishing process
     * @returns false if fishing can't be started (e.g., inventory full)
     */
    startFishing(): boolean {
        console.log("startFishing called");
        if (this.isFishing) {
            console.log("Already fishing, ignoring");
            return false;
        }

        // Check if inventory is full
        if (this.inventory.isFull()) {
            console.log("Inventory full");
            return false;
        }

        // Set fishing state
        this.isFishing = true;
        this.notifyFishingStart();

        // Generate random depth within current max
        this.currentDepth = randomInt(0, this.maxDepth);
        console.log(`Fishing at depth: ${this.currentDepth}m`);

        // Get active layer for current depth
        const layer = this.layerManager.getLayerForDepth(this.currentDepth);

        if (!layer) {
            console.error("No layer found for depth:", this.currentDepth);
            this.finishFishing(null);
            return false;
        }

        console.log(`Found layer: ${layer.name}`);

        // Apply ability buffs to fishing power and catch speed
        const fishingPowerBonus = this.abilityManager.getBuffValue('fishingPowerBonus');
        const catchRateBonus = this.abilityManager.getBuffValue('catchRateBonus');

        const totalFishingPower = this.fishingPower + fishingPowerBonus;
        const totalCatchSpeed = this.catchSpeed + catchRateBonus;

        // Calculate catch time based on depth and catch speed
        const catchTime = layer.calculateCatchTime(this.currentDepth, totalCatchSpeed);
        console.log(`Catch time: ${catchTime}ms`);

        // Set timeout for fishing completion
        this.fishingTimeout = setTimeout(() => {
            console.log("Fishing timeout completed");

            // Apply rarity boost to catch
            const rarityBoostBonus = this.abilityManager.getBuffValue('rarityChanceBonus');

            // Generate fish at current depth
            const fish = layer.generateFish(this.currentDepth, totalFishingPower, rarityBoostBonus);

            if (fish) {
                console.log(`Caught fish: ${fish.displayName}`);
                // Add to inventory
                this.inventory.addFish(fish);

                // Register in stats
                this.statsTracker.registerFishCaught(fish);

                // Process fish for abilities
                this.abilityManager.processFish(fish);
            } else {
                console.log("No fish caught");
            }

            // Finish fishing
            this.finishFishing(fish);
        }, catchTime);

        return true;
    }

    /**
     * Finish fishing process and notify listeners
     */
    private finishFishing(fish: Fish | null): void {
        // Reset fishing state
        this.isFishing = false;
        this.notifyFishingEnd();

        // Notify listeners about catch result
        this.notifyFishCaught(fish);
    }

    /**
     * Cancel fishing if in progress
     */
    cancelFishing(): void {
        if (!this.isFishing) return;

        if (this.fishingTimeout) {
            clearTimeout(this.fishingTimeout);
            this.fishingTimeout = null;
        }

        this.isFishing = false;
        this.notifyFishingEnd();
    }

    /**
     * Check if fishing is currently in progress
     */
    isCurrentlyFishing(): boolean {
        return this.isFishing;
    }

    /**
     * Set maximum fishing depth
     */
    setMaxDepth(depth: number): void {
        this.maxDepth = depth;
    }

    /**
     * Set fishing power
     */
    setFishingPower(power: number): void {
        this.fishingPower = power;
    }

    /**
     * Set line strength
     */
    setLineStrength(strength: number): void {
        this.lineStrength = strength;
    }

    /**
     * Set catch speed multiplier
     */
    setCatchSpeed(speed: number): void {
        this.catchSpeed = speed;
    }

    /**
     * Get current fishing depth
     */
    getCurrentDepth(): number {
        return this.currentDepth;
    }

    /**
     * Register a callback for when a fish is caught
     */
    registerFishCaughtCallback(callback: (fish: Fish | null) => void): void {
        this.onFishCaught.push(callback);
    }

    /**
     * Register a callback for when fishing starts
     */
    registerFishingStartCallback(callback: () => void): void {
        this.onFishingStart.push(callback);
    }

    /**
     * Register a callback for when fishing ends
     */
    registerFishingEndCallback(callback: () => void): void {
        this.onFishingEnd.push(callback);
    }

    /**
     * Notify callbacks when a fish is caught
     */
    private notifyFishCaught(fish: Fish | null): void {
        for (const callback of this.onFishCaught) {
            callback(fish);
        }
    }

    /**
     * Notify callbacks when fishing starts
     */
    private notifyFishingStart(): void {
        for (const callback of this.onFishingStart) {
            callback();
        }
    }

    /**
     * Notify callbacks when fishing ends
     */
    private notifyFishingEnd(): void {
        for (const callback of this.onFishingEnd) {
            callback();
        }
    }

    /**
     * Get current fishing power
     */
    getFishingPower(): number {
        return this.fishingPower;
    }

    /**
     * Get current line strength
     */
    getLineStrength(): number {
        return this.lineStrength;
    }

    /**
     * Get current max depth
     */
    getMaxDepth(): number {
        return this.maxDepth;
    }

    /**
     * Get current catch speed
     */
    getCatchSpeed(): number {
        return this.catchSpeed;
    }

    /**
     * Serialize service for saving
     */
    serialize(): object {
        return {
            currentDepth: this.currentDepth,
            maxDepth: this.maxDepth,
            fishingPower: this.fishingPower,
            lineStrength: this.lineStrength,
            catchSpeed: this.catchSpeed
        };
    }

    /**
     * Deserialize service from saved data
     */
    deserialize(data: any): void {
        if (!data) return;

        this.currentDepth = data.currentDepth ?? this.currentDepth;
        this.maxDepth = data.maxDepth ?? this.maxDepth;
        this.fishingPower = data.fishingPower ?? this.fishingPower;
        this.lineStrength = data.lineStrength ?? this.lineStrength;
        this.catchSpeed = data.catchSpeed ?? this.catchSpeed;
    }
}