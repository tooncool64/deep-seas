import { FishManager } from './fish/FishManager';
import { Fish } from './fish/Fish';
import { Inventory } from './inventory/Inventory';
import { Economy } from './economy/Economy';
import { UpgradeManager } from './upgrades/UpgradeManager';
import { LayerManager } from './layers/LayerManager';
import { SaveManager } from './save/SaveManager';
import { UIManager } from '../ui/UIManager';
import { INITIAL_GAME_STATE, TIME_CONSTANTS, UpgradeType } from '../utils/Constants';
import { randomInt } from '../utils/Random';

/**
 * Main game controller class
 */
export class Game {
    // Game systems
    private fishManager: FishManager;
    private inventory: Inventory;
    private economy: Economy;
    private upgradeManager: UpgradeManager;
    private layerManager: LayerManager;
    private ui: UIManager;

    // Game state
    private currentDepth: number = 0;
    private maxDepth: number = INITIAL_GAME_STATE.maxDepth;
    private fishingPower: number = INITIAL_GAME_STATE.fishingPower;
    private lineStrength: number = INITIAL_GAME_STATE.lineStrength;
    private catchSpeed: number = INITIAL_GAME_STATE.catchSpeed;

    // Fishing state
    private isFishing: boolean = false;
    private fishingTimeout: NodeJS.Timeout | null = null;

    constructor() {
        // Initialize game systems
        this.fishManager = new FishManager();
        this.economy = new Economy(INITIAL_GAME_STATE.money);
        this.inventory = new Inventory(INITIAL_GAME_STATE.tankCapacity);
        this.upgradeManager = new UpgradeManager(this.economy);
        this.layerManager = new LayerManager(this.fishManager);
        this.ui = new UIManager();

        // Apply initial stats
        this.applyUpgradeEffects();

        // Set up event handlers
        this.setupEventHandlers();

        // Set up auto-save
        SaveManager.startAutoSave(() => this.saveGame(), TIME_CONSTANTS.SAVE_INTERVAL);

        // Try to load saved game
        this.loadGame();
    }

    /**
     * Set up UI event handlers
     */
    private setupEventHandlers(): void {
        // Cast line button
        this.ui.registerCastLineHandler(() => this.startFishing());

        // Save button
        this.ui.registerSaveHandler(() => this.saveGame());

        // Economy events
        this.economy.registerMoneyChangedCallback((money) => {
            this.ui.updateMoneyDisplay(money);
        });

        // Upgrade events
        this.upgradeManager.registerUpgradePurchasedCallback((upgrade) => {
            this.applyUpgradeEffects();
            this.ui.updateUpgrades(this.upgradeManager.getUpgrades(),
                (upgradeId) => this.upgradeManager.purchaseUpgrade(upgradeId));
        });

        // Initial UI updates
        this.updateUI();
    }

    /**
     * Apply all upgrade effects to player stats
     */
    private applyUpgradeEffects(): void {
        // Get totals from upgrade manager
        this.fishingPower = INITIAL_GAME_STATE.fishingPower +
            this.upgradeManager.getTotalBonusForType(UpgradeType.FISHING_POWER);

        this.lineStrength = INITIAL_GAME_STATE.lineStrength +
            this.upgradeManager.getTotalBonusForType(UpgradeType.LINE_STRENGTH);

        this.maxDepth = INITIAL_GAME_STATE.maxDepth +
            this.upgradeManager.getTotalBonusForType(UpgradeType.DEPTH_ACCESS);

        // Set inventory capacity
        const tankCapacity = INITIAL_GAME_STATE.tankCapacity +
            this.upgradeManager.getTotalBonusForType(UpgradeType.TANK_CAPACITY);
        this.inventory.setCapacity(tankCapacity);

        // Set catch speed
        this.catchSpeed = INITIAL_GAME_STATE.catchSpeed +
            this.upgradeManager.getTotalBonusForType(UpgradeType.CATCH_SPEED);
    }

    /**
     * Update all UI elements
     */
    private updateUI(): void {
        // Update money display
        this.ui.updateMoneyDisplay(this.economy.money);

        // Update depth display
        this.ui.updateDepthDisplay(this.currentDepth);

        // Update inventory
        this.ui.updateInventory(
            this.inventory.getAllFish(),
            this.inventory.maxCapacity,
            (fishId) => this.sellFish(fishId)
        );

        // Update upgrades
        this.ui.updateUpgrades(
            this.upgradeManager.getUpgrades(),
            (upgradeId) => this.upgradeManager.purchaseUpgrade(upgradeId)
        );
    }

    /**
     * Start fishing process
     */
    private startFishing(): void {
        console.log("startFishing called");
        if (this.isFishing) {
            console.log("Already fishing, ignoring");
            return;
        }

        // Check if inventory is full
        if (this.inventory.isFull()) {
            console.log("Inventory full");
            this.ui.showNotification('Inventory is full! Sell some fish first.', 'error');
            return;
        }

        // Set fishing state
        this.isFishing = true;
        this.ui.setFishingInProgress(true);

        // Generate random depth within current max
        this.currentDepth = randomInt(0, this.maxDepth);
        console.log(`Fishing at depth: ${this.currentDepth}m`);
        this.ui.updateDepthDisplay(this.currentDepth);

        // Get active layer for current depth
        const layer = this.layerManager.getLayerForDepth(this.currentDepth);

        if (!layer) {
            console.error("No layer found for depth:", this.currentDepth);
            this.finishFishing(null);
            return;
        }

        console.log(`Found layer: ${layer.name}`);

        // Calculate catch time based on depth and catch speed
        const catchTime = layer.calculateCatchTime(this.currentDepth, this.catchSpeed);
        console.log(`Catch time: ${catchTime}ms`);

        // Set timeout for fishing completion
        this.fishingTimeout = setTimeout(() => {
            console.log("Fishing timeout completed");
            // Generate fish at current depth
            const fish = layer.generateFish(this.currentDepth, this.fishingPower);

            if (fish) {
                console.log(`Caught fish: ${fish.displayName}`);
                // Add to inventory
                this.inventory.addFish(fish);
            } else {
                console.log("No fish caught");
            }

            // Finish fishing
            this.finishFishing(fish);
        }, catchTime);
    }

    /**
     * Finish fishing process
     */
    private finishFishing(fish: Fish | null): void {
        // Reset fishing state
        this.isFishing = false;
        this.ui.setFishingInProgress(false);

        // Show result
        this.ui.showFishCaught(fish);

        // Update UI
        this.updateUI();
    }

    /**
     * Sell a fish from inventory
     */
    private sellFish(fishId: string): void {
        const fish = this.inventory.removeFish(fishId);

        if (fish) {
            // Add money from fish value
            this.economy.addMoney(fish.value);

            // Show notification
            this.ui.showNotification(`Sold ${fish.displayName} for $${fish.value}!`, 'success');

            // Update UI
            this.updateUI();
        }
    }

    /**
     * Save the game
     */
    async saveGame(): Promise<void> {
        // Create save data object
        const saveData = {
            inventory: this.inventory.serialize(),
            economy: this.economy.serialize(),
            upgrades: this.upgradeManager.serialize(),
            layers: this.layerManager.serialize(),
            playerStats: {
                currentDepth: this.currentDepth,
                maxDepth: this.maxDepth,
                fishingPower: this.fishingPower,
                lineStrength: this.lineStrength,
                catchSpeed: this.catchSpeed
            }
        };

        // Save using save manager
        const success = await SaveManager.saveGame(saveData);

        // Show result
        if (success) {
            this.ui.showNotification('Game saved successfully!', 'success');
        } else {
            this.ui.showNotification('Failed to save game.', 'error');
        }
    }

    /**
     * Load the game
     */
    async loadGame(): Promise<void> {
        // Load using save manager
        const saveData = await SaveManager.loadGame() as any;

        if (!saveData) {
            // No save data or error loading
            this.ui.showNotification('Starting new game.', 'info');
            return;
        }

        try {
            // Instead of replacing instances, load data into existing objects

            // Restore inventory
            if (saveData.inventory) {
                // Clear existing inventory
                const allFish = this.inventory.getAllFish();
                for (const fish of allFish) {
                    this.inventory.removeFish(fish.id);
                }

                // Set capacity
                if (saveData.inventory.capacity) {
                    this.inventory.setCapacity(saveData.inventory.capacity);
                }

                // Add fish from save
                if (saveData.inventory.fish && Array.isArray(saveData.inventory.fish)) {
                    for (const fishData of saveData.inventory.fish) {
                        const fish = Fish.deserialize(fishData);
                        this.inventory.addFish(fish);
                    }
                }
            }

            // Restore economy
            if (saveData.economy && typeof saveData.economy.money === 'number') {
                this.economy.setMoney(saveData.economy.money);
            }

            // Restore upgrades
            if (saveData.upgrades && saveData.upgrades.upgrades) {
                for (const upgradeData of saveData.upgrades.upgrades) {
                    const upgrade = this.upgradeManager.getUpgrade(upgradeData.id);
                    if (upgrade) {
                        upgrade.setLevel(upgradeData.level);
                    }
                }
            }

            // Restore layers
            if (saveData.layers && saveData.layers.layers) {
                for (const layerId in saveData.layers.layers) {
                    const layer = this.layerManager.getLayer(layerId);
                    if (layer) {
                        layer.deserialize(saveData.layers.layers[layerId]);
                    }
                }

                // Restore active layer
                if (saveData.layers.activeLayerId) {
                    this.layerManager.setActiveLayer(saveData.layers.activeLayerId);
                }
            }

            // Restore player stats
            if (saveData.playerStats) {
                this.currentDepth = saveData.playerStats.currentDepth ?? this.currentDepth;
                this.maxDepth = saveData.playerStats.maxDepth ?? this.maxDepth;
                this.fishingPower = saveData.playerStats.fishingPower ?? this.fishingPower;
                this.lineStrength = saveData.playerStats.lineStrength ?? this.lineStrength;
                this.catchSpeed = saveData.playerStats.catchSpeed ?? this.catchSpeed;
            }

            // Apply upgrade effects to ensure stats are correct
            this.applyUpgradeEffects();

            // Update UI
            this.updateUI();

            this.ui.showNotification('Game loaded successfully!', 'success');
        } catch (error) {
            console.error('Error loading save data:', error);
            this.ui.showNotification('Error loading save data.', 'error');
        }
    }
}