import { FishManager } from './fish/FishManager';
import { Fish } from './fish/Fish';
import { Inventory } from './inventory/Inventory';
import { Economy } from './economy/Economy';
import { UpgradeManager } from './upgrades/UpgradeManager';
import { LayerManager } from './layers/LayerManager';
import { SaveManager } from './save/SaveManager';
import { UIManager } from '../ui/UIManager';
import {DepthLayer, INITIAL_GAME_STATE, TIME_CONSTANTS, UpgradeType} from '../utils/Constants';
import { randomInt } from '../utils/Random';
import { BreedingManager } from './breeding/BreedingManager';
import { AbilityManager } from './abilities/AbilityManager';
import { StatsTracker } from './stats/StatsTracker';
import { DeepSeaLayer } from './layers/DeepSeaLayer';
import { BreedingUI } from '../ui/BreedingUI';
import { FishDetailsUI } from '../ui/FishDetailsUI';
import { Achievement } from './stats/Achievement';
import { INITIAL_ACHIEVEMENTS } from '../utils/Constants';
import {BreedingOutcome} from "./breeding/BreedingOutcome";
import { FishTankManager } from './tanks/FishTankManager';
import { FishTankUI } from '../ui/FishTankUI';
import {FishAbility} from "./abilities/FishAbility";

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
    private tankManager: FishTankManager;
    private tankUI: FishTankUI;

    // Game state
    private currentDepth: number = 0;
    private maxDepth: number = INITIAL_GAME_STATE.maxDepth;
    private fishingPower: number = INITIAL_GAME_STATE.fishingPower;
    private lineStrength: number = INITIAL_GAME_STATE.lineStrength;
    private catchSpeed: number = INITIAL_GAME_STATE.catchSpeed;

    // Fishing state
    private isFishing: boolean = false;
    private fishingTimeout: NodeJS.Timeout | null = null;

    // New game systems for Cycle 2
    private breedingManager: BreedingManager;
    private abilityManager: AbilityManager;
    private statsTracker: StatsTracker;
    private breedingTimerInterval: number | null = null;

    // Additional UI components
    private breedingUI: BreedingUI;
    private fishDetailsUI: FishDetailsUI;

    // Game loop
    private lastUpdateTime: number = 0;
    private gameLoopId: number | null = null;

    constructor() {
        // Initialize game systems
        this.fishManager = new FishManager();
        this.economy = new Economy(INITIAL_GAME_STATE.money);
        this.inventory = new Inventory(INITIAL_GAME_STATE.tankCapacity);
        this.upgradeManager = new UpgradeManager(this.economy);
        this.layerManager = new LayerManager(this.fishManager);
        this.ui = new UIManager();
        // Initialize new systems for Cycle 2
        this.breedingManager = new BreedingManager(this.fishManager);
        this.abilityManager = new AbilityManager();
        this.statsTracker = new StatsTracker();

        // Initialize Deep Sea layer
        const deepSeaLayer = new DeepSeaLayer(this.fishManager);
        deepSeaLayer.initialize();
        this.layerManager.addLayer(deepSeaLayer);

        // Initialize additional UI
        this.breedingUI = new BreedingUI();
        this.fishDetailsUI = new FishDetailsUI();

        this.tankManager = new FishTankManager();
        this.tankUI = new FishTankUI();
        this.tankUI.setAddToTankCallback((fish, tankId) => this.addFishToTank(fish, tankId));
        this.tankUI.setRemoveFromTankCallback((tankId) => this.removeFishFromTank(tankId));
        this.tankUI.setViewFishDetailsCallback((fishId) => this.showFishDetails(fishId));

        // Initialize achievements
        this.initializeAchievements();

        this.statsTracker.registerStatChangedCallback((statName, value) => {
            if (this.ui.getCurrentTab() === 'stats-tab') {
                this.updateStatsDisplay();
            }
        });

        this.statsTracker.registerAchievementUnlockedCallback((achievement) => {
            this.ui.showAchievementUnlocked(achievement);
            if (this.ui.getCurrentTab() === 'stats-tab') {
                this.updateStatsDisplay();
            }
        });

        this.startBreedingTimerUpdates();

        // Initialize tab system
        this.ui.initializeTabs();

        // Initialize layer transition system
        this.initializeLayerTransitionSystem();

        // Start game loop
        this.startGameLoop();

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
        this.ui.registerResetHandler(() => this.resetGame());

        this.ui.registerTabChangeHandler((tabId) => {
            if (tabId === 'tanks-tab') {
                this.updateTanksUI();
            } else if (tabId === 'stats-tab') {
                this.updateStatsDisplay();
            } else if (tabId === 'breeding-tab') {
                this.updateBreedingUI();
                // Immediately update timers when switching to breeding tab
                this.breedingUI.updateBreedingTimers(this.breedingManager.getAllTanks());
            }
        });

        // Economy events
        this.economy.registerMoneyChangedCallback((money) => {
            this.ui.updateMoneyDisplay(money);
        });

        // Upgrade events
        this.upgradeManager.registerUpgradePurchasedCallback((upgrade) => {
            this.applyUpgradeEffects();
            this.ui.updateUpgrades(this.upgradeManager.getUpgrades(),
                (upgradeId) => this.upgradeManager.purchaseUpgrade(upgradeId));

            // Track money spent
            this.statsTracker.registerMoneySpent(upgrade.nextCost);

            // Handle special upgrade types
            if (upgrade.type === UpgradeType.BREEDING_TANKS && upgrade.level === 1) {
                // First breeding tank was purchased, unlock breeding UI
                const gameArea = document.getElementById('game-area');
                if (gameArea) {
                    const breedingContainer = document.getElementById('breeding-area');
                    if (breedingContainer) {
                        gameArea.appendChild(breedingContainer);
                    }
                }
            }

            if (upgrade.type === UpgradeType.PRESSURE_RESISTANCE && upgrade.level === 1) {
                // First pressure resistance upgrade, unlock deep sea layer
                const deepSeaLayer = this.layerManager.getLayer(DepthLayer.DEEP_SEA);
                if (deepSeaLayer) {
                    this.layerManager.unlockLayer(DepthLayer.DEEP_SEA);
                    this.ui.showNotification('Deep Sea layer unlocked! You can now fish down to 1000m.', 'success');
                }
            }

            if (upgrade.type === UpgradeType.TANK_CAPACITY && upgrade.level >= 1) {
                this.tankManager.increaseMaxTanks(upgrade.value);
                this.updateTanksUI();
            }

            if (upgrade.type === UpgradeType.BREEDING_EFFICIENCY) {
                const breedingEfficiency = 1 + this.upgradeManager.getTotalBonusForType(UpgradeType.BREEDING_EFFICIENCY);
                this.breedingUI.setBreedingEfficiency(breedingEfficiency);
            }
        });

        // Breeding events
        this.breedingManager.registerBreedingCompleteCallback((outcome) => {
            this.handleBreedingOutcome(outcome);
        });

        this.breedingUI.setSelectionChangedCallback(() => {
            this.updateUI(); // Update UI when breeding selection changes
        });

        // Set up breeding UI callbacks
        this.breedingUI.setStartBreedingCallback((fish1, fish2) => this.startBreeding(fish1, fish2));
        this.breedingUI.setCancelBreedingCallback((tankId) => this.cancelBreeding(tankId));

        // Set up fish details UI callbacks
        this.fishDetailsUI.setActivateAbilityCallback((abilityId) => this.activateAbility(abilityId));
        this.fishDetailsUI.setSellFishCallback((fishId) => this.sellFish(fishId));
        this.fishDetailsUI.setAddToBreedingCallback((fishId) => {
            const fish = this.inventory.getFish(fishId);
            if (fish) {
                // Reset selection in breeding UI and then select this fish
                this.breedingUI.resetSelection();
                this.handleBreedingFishSelection(fish);
            }
        });

        this.breedingUI.setStartBreedingCallback((fish1, fish2) => this.startBreeding(fish1, fish2));
        this.breedingUI.setCancelBreedingCallback((tankId) => this.cancelBreeding(tankId));

        this.breedingUI.setBreedingChanceCalculator((fish1, fish2, efficiency) => {
            const successChance = this.breedingManager.calculateBreedingSuccessChance(fish1, fish2, efficiency);
            const offspringRange = this.breedingManager.calculatePotentialOffspringRange(efficiency);
            const mutationChance = this.breedingManager.calculateMutationChance(fish1, fish2, efficiency);

            return { successChance, offspringRange, mutationChance };
        });

// Set breeding efficiency based on upgrades
        const breedingEfficiency = 1 + this.upgradeManager.getTotalBonusForType(UpgradeType.BREEDING_EFFICIENCY);
        this.breedingUI.setBreedingEfficiency(breedingEfficiency);


        document.addEventListener('click', (event) => {
            const target = event.target as HTMLElement;
            const fishElement = target.closest('.fish-item') as HTMLElement | null;

            if (fishElement && fishElement.dataset.fishId) {
                this.showFishDetails(fishElement.dataset.fishId);
            }
        });

        // Initial UI updates
        this.updateUI();
    }

    private stopBreedingTimerUpdates(): void {
        if (this.breedingTimerInterval !== null) {
            window.clearInterval(this.breedingTimerInterval);
            this.breedingTimerInterval = null;
        }
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

        // Set breeding tanks
        const breedingTanks = this.upgradeManager.getTotalBonusForType(UpgradeType.BREEDING_TANKS);
        if (breedingTanks > 0) {
            this.breedingManager.increaseMaxTanks(breedingTanks);
        }

        // Set pressure resistance
        const pressureResistance = this.upgradeManager.getTotalBonusForType(UpgradeType.PRESSURE_RESISTANCE);
        const deepSeaLayer = this.layerManager.getLayer(DepthLayer.DEEP_SEA) as DeepSeaLayer;
        if (deepSeaLayer) {
            deepSeaLayer.setPressureResistance(pressureResistance);
        }
    }

    /**
     * Initialize the layer transition system
     */
    private initializeLayerTransitionSystem(): void {
        // Initialize with default layer data
        const currentLayer = this.layerManager.getActiveLayer();
        const nextLayer = this.layerManager.getLayer(DepthLayer.DEEP_SEA);

        if (!currentLayer || !nextLayer) {
            return;
        }

        // Get current requirements status
        const requirements = this.layerManager.getLayerRequirementStatus(
            DepthLayer.DEEP_SEA,
            {
                inventory: this.inventory,
                upgradeManager: this.upgradeManager,
                fishingPower: this.fishingPower,
                tankManager: this.tankManager
            }
        );

        // Initialize UI
        this.ui.initializeLayerTransition(
            currentLayer.name,
            nextLayer.name,
            requirements,
            () => this.checkLayerRequirements(DepthLayer.DEEP_SEA),
            () => this.transitionToLayer(DepthLayer.DEEP_SEA)
        );

        // Schedule regular updates
        setInterval(() => this.updateLayerRequirements(), 5000);
    }

    /**
     * Update layer requirements display
     */
    private updateLayerRequirements(): void {
        const requirements = this.layerManager.getLayerRequirementStatus(
            DepthLayer.DEEP_SEA,
            {
                inventory: this.inventory,
                upgradeManager: this.upgradeManager,
                fishingPower: this.fishingPower,
                tankManager: this.tankManager
            }
        );

        this.ui.updateLayerRequirements(requirements);
    }

    private updateStatsDisplay(): void {
        // Update stats
        this.ui.updateStats(this.statsTracker.getAllStats());

        // Update achievements
        this.ui.updateAchievements(
            this.statsTracker.getAllAchievements(),
            this.statsTracker.getAllStats()
        );
    }

    /**
     * Check if requirements are met for transitioning to a layer
     */
    private checkLayerRequirements(layerId: string): boolean {
        return this.layerManager.checkLayerRequirements(
            layerId,
            {
                inventory: this.inventory,
                upgradeManager: this.upgradeManager,
                fishingPower: this.fishingPower,
                tankManager: this.tankManager
            }
        );
    }

    /**
     * Transition to a new layer
     */
    private transitionToLayer(layerId: string): void {
        const success = this.layerManager.transitionToLayer(layerId);

        if (success) {
            // Update max depth based on new layer
            const layer = this.layerManager.getLayer(layerId);
            if (layer) {
                // Set max depth to the new layer's max
                const layerMaxDepth = layer.maxDepth;
                if (layerMaxDepth > this.maxDepth) {
                    this.maxDepth = layerMaxDepth;
                }

                // Show notification
                this.ui.showNotification(`You have descended to the ${layer.name} layer!`, 'success');

                // Switch to fishing tab to show new layer
                this.ui.switchToTab('fishing-tab');
            }
        }
    }

    /**
     * Add a fish to a tank
     */
    private addFishToTank(fish: Fish, tankId: string): boolean {
        // Remove from inventory first
        const removed = this.inventory.removeFish(fish.id);

        if (!removed) {
            this.ui.showNotification('Could not remove fish from inventory', 'error');
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
            this.ui.showNotification('Could not add fish to tank', 'error');
            return false;
        }

        // Set fish as being in a tank for abilities
        this.abilityManager.setFishInTank(fish.id, true);

        // Update UI
        this.updateTanksUI();
        this.updateUI();

        this.ui.showNotification(`${fish.displayName} has been added to a tank`, 'success');

        return true;
    }

    /**
     * Remove a fish from a tank
     */
    private removeFishFromTank(tankId: string): Fish | null {
        // Remove from tank
        const fish = this.tankManager.removeFishFromTank(tankId);

        if (!fish) {
            return null;
        }

        // Check if inventory has space
        if (this.inventory.isFull()) {
            // No space, return fish to tank
            this.tankManager.addFishToSpecificTank(fish, tankId);
            this.ui.showNotification('Inventory is full! Sell some fish first.', 'error');
            return null;
        }

        // Set fish as not being in a tank for abilities
        this.abilityManager.setFishInTank(fish.id, false);

        // Add to inventory
        this.inventory.addFish(fish);

        // Update UI
        this.updateTanksUI();
        this.updateUI();

        this.ui.showNotification(`${fish.displayName} has been removed from tank`, 'info');

        return fish;
    }

    /**
     * Update tanks UI
     */
    private updateTanksUI(): void {
        const tanks = this.tankManager.getAllTanks();
        const abilities = new Map<string, FishAbility>();

        // Collect abilities for fish in tanks
        for (const tank of tanks) {
            if (tank.fish) {
                const ability = this.abilityManager.getAbilityForFish(tank.fish.id);
                if (ability) {
                    abilities.set(tank.fish.id, ability);
                }
            }
        }

        // Update tanks display
        this.tankUI.updateTanks(tanks, abilities);

        // Update available fish display
        const allFish = this.inventory.getAllFish();
        const unavailableFishIds = new Set<string>();

        // Collect abilities for fish in inventory
        for (const fish of allFish) {
            const ability = this.abilityManager.getAbilityForFish(fish.id);
            if (ability) {
                abilities.set(fish.id, ability);
            }
        }

        this.tankUI.updateAvailableFish(allFish, abilities, unavailableFishIds);
    }

    /**
     * Update all UI elements
     */
    private updateUI(): void {
        // Get fish IDs selected for breeding
        const disabledFishIds = new Set<string>();
        const selectedFish = this.breedingUI.getSelectedFish();
        if (selectedFish) {
            disabledFishIds.add(selectedFish.id);
        }
        if (this.breedingUI) {
            const selectedFish = this.breedingUI.getSelectedFish();
            if (selectedFish) {
                disabledFishIds.add(selectedFish.id);
            }
        }
        for (const tank of this.breedingManager.getAllTanks()) {
            if (tank.breedingPair) {
                disabledFishIds.add(tank.breedingPair.fish1.id);
                disabledFishIds.add(tank.breedingPair.fish2.id);
            }
        }

        // Update money display
        this.ui.updateMoneyDisplay(this.economy.money);

        // Update depth display
        this.ui.updateDepthDisplay(this.currentDepth);

        // Update inventory with fish that can't be sold marked
        this.ui.updateInventory(
            this.inventory.getAllFish(),
            this.inventory.maxCapacity,
            (fishId) => this.sellFish(fishId),
            (fishId) => this.showFishDetails(fishId),
            disabledFishIds
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
        const disabledFishIds = new Set<string>();

        if (this.breedingUI) {
            const selectedFish = this.breedingUI.getSelectedFish();
            if (selectedFish && selectedFish.id === fishId) {
                this.ui.showNotification("Can't sell fish selected for breeding", 'error');
                return;
            }
        }

        // Check if fish is in a breeding tank
        for (const tank of this.breedingManager.getAllTanks()) {
            if (tank.breedingPair) {
                if (tank.breedingPair.fish1.id === fishId || tank.breedingPair.fish2.id === fishId) {
                    this.ui.showNotification("Can't sell fish that is currently breeding", 'error');
                    return;
                }
            }
        }

        const fish = this.inventory.removeFish(fishId);

        if (fish) {
            // Apply money multiplier from abilities
            const moneyMultiplier = this.abilityManager.getBuffValue('moneyMultiplier');
            const finalValue = Math.round(fish.value * moneyMultiplier);

            // Add money from fish value
            this.economy.addMoney(finalValue);

            // Track money earned
            this.statsTracker.registerMoneyEarned(finalValue);

            // Remove any abilities the fish had
            this.abilityManager.removeFishAbility(fishId);

            // Show notification
            this.ui.showNotification(`Sold ${fish.displayName} for $${finalValue}!`, 'success');

            // Update UI
            this.updateUI();
        }
    }

    /*
    /**
     * Initialize achievements
     */
    private initializeAchievements(): void {
        for (const achievementData of INITIAL_ACHIEVEMENTS) {
            const achievement = new Achievement(
                achievementData.id,
                achievementData.name,
                achievementData.description
            );

            // Add requirement
            achievement.addRequirement(
                achievementData.requirement.statName,
                achievementData.requirement.value
            );

            // Set unlock callback to grant reward
            achievement.setUnlockCallback(() => {
                // Grant reward
                if (achievementData.reward.money) {
                    this.economy.addMoney(achievementData.reward.money);
                    this.ui.showNotification(
                        `Achievement unlocked: ${achievementData.name} - Reward: $${achievementData.reward.money}`,
                        'success'
                    );
                }
            });

            // Add to stats tracker
            this.statsTracker.addAchievement(achievement);
        }
    }

    /**
     * Start the game loop
     */
    private startGameLoop(): void {
        this.lastUpdateTime = Date.now();

        const gameLoop = () => {
            const currentTime = Date.now();
            const deltaTime = currentTime - this.lastUpdateTime;

            // Update game systems
            this.updateGame(deltaTime);

            this.lastUpdateTime = currentTime;
            this.gameLoopId = requestAnimationFrame(gameLoop);
        };

        this.gameLoopId = requestAnimationFrame(gameLoop);
    }

    /**
     * Stop the game loop
     */
    private stopGameLoop(): void {
        if (this.gameLoopId !== null) {
            cancelAnimationFrame(this.gameLoopId);
            this.gameLoopId = null;
        }
    }

    /**
     * Update all game systems
     */
    private updateGame(deltaTime: number): void {
        // Update breeding system
        this.breedingManager.update(deltaTime);

        // Update abilities
        this.abilityManager.update(deltaTime);

        // Update stats
        this.statsTracker.updatePlayTime(deltaTime);

        // Apply passive income from abilities
        const passiveIncome = this.abilityManager.getBuffValue('passiveIncome');
        if (passiveIncome > 0) {
            // Convert to amount per frame
            const incomeThisFrame = (passiveIncome * deltaTime) / 1000;
            this.economy.addMoney(incomeThisFrame);
        }
    }

    /**
     * Start a breeding attempt
     */
    private startBreeding(fish1: Fish, fish2: Fish): boolean {
        // Apply breeding efficiency bonus from abilities
        const breedingEfficiencyBonus = this.abilityManager.getBuffValue('breedingEfficiencyBonus');

        // Get breeding efficiency from upgrades
        const breedingEfficiencyUpgrades =
            this.upgradeManager.getTotalBonusForType(UpgradeType.BREEDING_EFFICIENCY);

        // Calculate total breeding efficiency
        const totalBreedingEfficiency = 1 + breedingEfficiencyUpgrades + breedingEfficiencyBonus;

        // Start breeding
        const tankId = this.breedingManager.startBreeding(
            fish1,
            fish2,
            totalBreedingEfficiency
        );

        if (!tankId) {
            this.ui.showNotification('Unable to start breeding. Check compatibility or tank availability.', 'error');
            return false;
        }

        // Track breeding attempt
        this.statsTracker.registerBreedingAttempt(true);

        // Show notification
        this.ui.showNotification(`Started breeding ${fish1.displayName} with ${fish2.displayName}`, 'success');

        // Update UI
        this.updateBreedingUI();

        return true;
    }

    /**
     * Handle breeding outcome
     */
    private handleBreedingOutcome(outcome: BreedingOutcome): void {
        // Add offspring to inventory
        for (const offspring of outcome.offspring) {
            // Skip if inventory is full
            if (this.inventory.isFull()) {
                this.ui.showNotification('Some offspring couldn\'t be added - inventory full!', 'error');
                break;
            }

            this.inventory.addFish(offspring);

            // Process offspring for abilities
            this.abilityManager.processFish(offspring);
        }

        // Update stats
        this.statsTracker.registerBreedingAttempt(
            true,
            outcome.offspring.length,
            outcome.hasMutation
        );

        // Show outcome in UI
        this.breedingUI.showBreedingOutcome(outcome);

        // Update UI
        this.updateBreedingUI();
        this.updateUI();
    }

    /**
     * Cancel breeding in a tank
     */
    private cancelBreeding(tankId: string): void {
        const success = this.breedingManager.cancelBreeding(tankId);

        if (success) {
            this.ui.showNotification('Breeding canceled', 'info');
            this.updateBreedingUI();
        }
    }

    /**
     * Update breeding UI
     */
    private updateBreedingUI(): void {
        // Update breeding tanks
        this.breedingUI.updateBreedingTanks(this.breedingManager.getAllTanks());

        // Update selection panel with fish available for breeding
        this.breedingUI.updateSelectionPanel(
            this.inventory.getAllFish(),
            (fish1, fish2) => this.breedingManager.checkCompatibility(fish1, fish2)
        );
    }

    /**
     * Show detailed information for a fish
     */
    private showFishDetails(fishId: string): void {
        const fish = this.inventory.getFish(fishId);

        if (!fish) {
            return;
        }

        // Get ability for this fish if any
        const ability = this.abilityManager.getAbilityForFish(fishId);

        // Show details
        this.fishDetailsUI.showFishDetails(fish, ability);
    }

    /**
     * Activate a fish ability
     */
    private activateAbility(abilityId: string): boolean {
        const success = this.abilityManager.activateAbility(abilityId);

        if (success) {
            this.ui.showNotification('Ability activated!', 'success');
            this.statsTracker.registerAbilityActivated();
        } else {
            this.ui.showNotification('Unable to activate ability', 'error');
        }

        return success;
    }

    async resetGame(): Promise<void> {
        // Show confirmation dialog
        if (!confirm("Are you sure you want to reset the game? All progress will be lost!")) {
            return;
        }

        this.stopBreedingTimerUpdates();

        // Delete save data
        const success = await SaveManager.deleteSaveData();

        if (success) {
            this.ui.showNotification('Game reset successfully. Refreshing...', 'info');

            // Set a flag in localStorage to indicate we're resetting
            localStorage.setItem('deepSeasResetting', 'true');

            // Refresh the page after a short delay
            setTimeout(() => {
                window.location.reload();
            }, 1500);
        } else {
            this.ui.showNotification('Failed to reset game.', 'error');
        }
    }

    private handleBreedingFishSelection(fish: Fish): void {
        // Show breeding UI
        const breedingContainer = document.getElementById('breeding-area');
        if (breedingContainer) {
            breedingContainer.scrollIntoView({behavior: 'smooth'});
        }

        // Ensure breeding selection panel is visible
        const selectionPanel = document.querySelector('.breeding-selection-panel');
        if (selectionPanel) {
            (selectionPanel as HTMLElement).style.display = 'block';
        }

        // Find and click the fish in the selection panel
        setTimeout(() => {
            const fishElements = document.querySelectorAll('.breeding-fish-selection');
            for (const element of fishElements) {
                if ((element as HTMLElement).dataset.fishId === fish.id) {
                    (element as HTMLElement).click();
                    break;
                }
            }
        }, 100);
    }

    private startBreedingTimerUpdates(): void {
        // Clear any existing interval
        if (this.breedingTimerInterval !== null) {
            window.clearInterval(this.breedingTimerInterval);
        }

        // Start new interval that updates every second
        this.breedingTimerInterval = window.setInterval(() => {
            // Only update if on breeding tab
            if (this.ui.getCurrentTab() === 'breeding-tab') {
                this.breedingUI.updateBreedingTimers(this.breedingManager.getAllTanks());
            }
        }, 1000); // Update every second
    }


    /**
     * Save the game
     */
    async saveGame(): Promise<void> {
        this.stopGameLoop();

        // Create save data object
        const saveData = {
            inventory: this.inventory.serialize(),
            economy: this.economy.serialize(),
            upgrades: this.upgradeManager.serialize(),
            tankManager: this.tankManager.serialize(),
            layers: this.layerManager.serialize(),
            breeding: this.breedingManager.serialize(),
            abilities: this.abilityManager.serialize(),
            stats: this.statsTracker.serialize(),
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
        // Check if we're coming from a reset
        if (localStorage.getItem('deepSeasResetting') === 'true') {
            // Clear the reset flag
            localStorage.removeItem('deepSeasResetting');
            this.ui.showNotification('Starting new game.', 'info');
            return;
        }

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

                        // Process fish for abilities
                        this.abilityManager.processFish(fish);
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

            // Restore breeding
            if (saveData.breeding) {
                this.breedingManager.deserialize(saveData.breeding);
            }

            if (saveData.tankManager) {
                this.tankManager.deserialize(saveData.tankManager);

                // Reactivate abilities for fish in tanks
                for (const tank of this.tankManager.getAllTanks()) {
                    if (tank.fish) {
                        this.abilityManager.setFishInTank(tank.fish.id, true);
                    }
                }
            }

            // Restore abilities
            if (saveData.abilities) {
                this.abilityManager.deserialize(saveData.abilities);
            }

            // Restore stats and achievements
            if (saveData.stats) {
                this.statsTracker.deserialize(saveData.stats);
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
            this.updateBreedingUI();

            this.ui.showNotification('Game loaded successfully!', 'success');
        } catch (error) {
            console.error('Error loading save data:', error);
            this.ui.showNotification('Error loading save data.', 'error');
        }
    }
}