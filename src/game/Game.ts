import { FishManager } from './fish/FishManager';
import { Fish } from './fish/Fish';
import { Inventory } from './inventory/Inventory';
import { Economy } from './economy/Economy';
import { UpgradeManager } from './upgrades/UpgradeManager';
import { LayerManager } from './layers/LayerManager';
import { SaveManager } from './save/SaveManager';
import { UIManager } from '../ui/UIManager';
import { DepthLayer, INITIAL_GAME_STATE, TIME_CONSTANTS, UpgradeType } from '../utils/Constants';
import { BreedingManager } from './breeding/BreedingManager';
import { AbilityManager } from './abilities/AbilityManager';
import { StatsTracker } from './stats/StatsTracker';
import { DeepSeaLayer } from './layers/DeepSeaLayer';
import { BreedingUI } from '../ui/BreedingUI';
import { FishDetailsUI } from '../ui/FishDetailsUI';
import { Achievement } from './stats/Achievement';
import { INITIAL_ACHIEVEMENTS } from '../utils/Constants';
import { BreedingOutcome } from "./breeding/BreedingOutcome";
import { FishTankManager } from './tanks/FishTankManager';
import { FishTankUI } from '../ui/FishTankUI';
import { FishAbility } from "./abilities/FishAbility";

// Import new service classes
import { ServiceManager } from './ServiceManager';
import { FishingService } from './FishingService';
import { BreedingService } from './BreedingService';
import { TankService } from './TankService';
import { EconomyService } from './EconomyService';

/**
 * Main game controller class
 */
export class Game {
    // Core systems
    private fishManager: FishManager;
    private inventory: Inventory;
    private economy: Economy;
    private upgradeManager: UpgradeManager;
    private layerManager: LayerManager;
    private ui: UIManager;
    private tankManager: FishTankManager;
    private tankUI: FishTankUI;
    private breedingManager: BreedingManager;
    private abilityManager: AbilityManager;
    private statsTracker: StatsTracker;

    // UI components
    private breedingUI: BreedingUI;
    private fishDetailsUI: FishDetailsUI;

    // Service manager and services
    private serviceManager!: ServiceManager;
    private fishingService!: FishingService;
    private breedingService!: BreedingService;
    private tankService!: TankService;
    private economyService!: EconomyService;

    // Game loop
    private lastUpdateTime: number = 0;
    private gameLoopId: number | null = null;
    private breedingTimerInterval: number | null = null;

    constructor() {
        // Initialize core systems
        this.fishManager = new FishManager();
        this.economy = new Economy(INITIAL_GAME_STATE.money);
        this.inventory = new Inventory(INITIAL_GAME_STATE.tankCapacity);
        this.upgradeManager = new UpgradeManager(this.economy);
        this.layerManager = new LayerManager(this.fishManager);
        this.ui = new UIManager();
        this.breedingManager = new BreedingManager(this.fishManager);
        this.abilityManager = new AbilityManager();
        this.statsTracker = new StatsTracker();
        this.tankManager = new FishTankManager();

        // Initialize UI components
        this.breedingUI = new BreedingUI();
        this.fishDetailsUI = new FishDetailsUI();
        this.tankUI = new FishTankUI();

        // Set up tank UI callbacks
        this.tankUI.setAddToTankCallback((fish, tankId) => this.addFishToTank(fish, tankId));
        this.tankUI.setRemoveFromTankCallback((tankId) => this.removeFishFromTank(tankId));
        this.tankUI.setViewFishDetailsCallback((fishId) => this.showFishDetails(fishId));

        // Initialize Deep Sea layer
        const deepSeaLayer = new DeepSeaLayer(this.fishManager);
        deepSeaLayer.initialize();
        this.layerManager.addLayer(deepSeaLayer);

        // Initialize achievements
        this.initializeAchievements();

        // Set up service manager and services
        this.serviceManager = new ServiceManager();
        this.initializeServices();

        // Register stat change callbacks
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
     * Initialize game services
     */
    private initializeServices(): void {
        // Create services
        this.fishingService = new FishingService(
            this.fishManager,
            this.inventory,
            this.layerManager,
            this.statsTracker,
            this.abilityManager
        );

        this.breedingService = new BreedingService(
            this.breedingManager,
            this.statsTracker,
            this.abilityManager
        );

        this.tankService = new TankService(
            this.tankManager,
            this.abilityManager,
            this.inventory
        );

        this.economyService = new EconomyService(
            this.economy,
            this.abilityManager,
            this.statsTracker
        );

        // Register services with manager
        this.serviceManager.registerService('fishing', this.fishingService);
        this.serviceManager.registerService('breeding', this.breedingService);
        this.serviceManager.registerService('tanks', this.tankService);
        this.serviceManager.registerService('economy', this.economyService);

        // Initialize all services
        this.serviceManager.initializeServices();

        // Set up service callbacks
        this.setupServiceCallbacks();
    }

    /**
     * Set up callbacks for services
     */
    private setupServiceCallbacks(): void {
        // Fishing service callbacks
        this.fishingService.registerFishCaughtCallback((fish) => {
            this.showFishCaught(fish);
            this.updateUI();
        });

        this.fishingService.registerFishingStartCallback(() => {
            this.ui.setFishingInProgress(true);
        });

        this.fishingService.registerFishingEndCallback(() => {
            this.ui.setFishingInProgress(false);
        });

        // Breeding service callbacks
        this.breedingService.registerBreedingOutcomeCallback((outcome) => {
            this.handleBreedingOutcome(outcome);
        });

        // Tank service callbacks
        this.tankService.registerTanksChangedCallback(() => {
            this.updateTanksUI();
            this.updateUI();
        });

        // Economy service callbacks
        this.economyService.registerMoneyChangedCallback((money) => {
            this.ui.updateMoneyDisplay(money);
        });
    }

    /**
     * Set up UI event handlers
     */
    private setupEventHandlers(): void {
        // Cast line button
        this.ui.registerCastLineHandler(() => this.startFishing());

        // Save and reset buttons
        this.ui.registerSaveHandler(() => this.saveGame());
        this.ui.registerResetHandler(() => this.resetGame());

        // Tab change handler
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

        // Upgrade events
        this.upgradeManager.registerUpgradePurchasedCallback((upgrade) => {
            this.applyUpgradeEffects();
            this.ui.updateUpgrades(this.upgradeManager.getUpgrades(),
                (upgradeId) => this.upgradeManager.purchaseUpgrade(upgradeId));

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
                this.breedingService.setBreedingEfficiency(breedingEfficiency);
            }
        });

        // Set up breeding UI callbacks
        this.breedingUI.setSelectionChangedCallback(() => {
            this.updateUI(); // Update UI when breeding selection changes
        });

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

    /**
     * Start fishing process using the fishing service
     */
    private startFishing(): void {
        // Check if inventory is full before delegating to service
        if (this.inventory.isFull()) {
            this.ui.showNotification('Inventory is full! Sell some fish first.', 'error');
            return;
        }

        const success = this.fishingService.startFishing();

        if (!success) {
            // If fishing couldn't start for some reason
            this.ui.showNotification('Unable to start fishing!', 'error');
        }
    }

    /**
     * Show fish caught animation and notification
     */
    private showFishCaught(fish: Fish | null): void {
        this.ui.showFishCaught(fish);
    }

    /**
     * Apply all upgrade effects to player stats
     */
    private applyUpgradeEffects(): void {
        // Get totals from upgrade manager
        const fishingPower = INITIAL_GAME_STATE.fishingPower +
            this.upgradeManager.getTotalBonusForType(UpgradeType.FISHING_POWER);

        const lineStrength = INITIAL_GAME_STATE.lineStrength +
            this.upgradeManager.getTotalBonusForType(UpgradeType.LINE_STRENGTH);

        const maxDepth = INITIAL_GAME_STATE.maxDepth +
            this.upgradeManager.getTotalBonusForType(UpgradeType.DEPTH_ACCESS);

        // Set inventory capacity
        const tankCapacity = INITIAL_GAME_STATE.tankCapacity +
            this.upgradeManager.getTotalBonusForType(UpgradeType.TANK_CAPACITY);
        this.inventory.setCapacity(tankCapacity);

        // Set catch speed
        const catchSpeed = INITIAL_GAME_STATE.catchSpeed +
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

        // Update services with new values
        this.fishingService.setFishingPower(fishingPower);
        this.fishingService.setLineStrength(lineStrength);
        this.fishingService.setMaxDepth(maxDepth);
        this.fishingService.setCatchSpeed(catchSpeed);

        const breedingEfficiency = 1 + this.upgradeManager.getTotalBonusForType(UpgradeType.BREEDING_EFFICIENCY);
        this.breedingService.setBreedingEfficiency(breedingEfficiency);
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
                fishingPower: this.fishingService.getFishingPower?.() ?? 1,
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
        setInterval(() => this.updateLayerRequirements(), 2000);
    }

    /**
     * Check layer requirements
     */
    private checkLayerRequirements(layerId: string): boolean {
        return this.layerManager.checkLayerRequirements(
            layerId,
            {
                inventory: this.inventory,
                upgradeManager: this.upgradeManager,
                fishingPower: this.fishingService.getFishingPower?.() ?? 1,
                tankManager: this.tankManager,
                statsTracker: this.statsTracker // Add statsTracker to the gameState
            }
        );
    }

    /**
     * Update layer requirements
     */
    private updateLayerRequirements(): void {
        const requirements = this.layerManager.getLayerRequirementStatus(
            DepthLayer.DEEP_SEA,
            {
                inventory: this.inventory,
                upgradeManager: this.upgradeManager,
                fishingPower: this.fishingService.getFishingPower?.() ?? 1,
                tankManager: this.tankManager,
                statsTracker: this.statsTracker // Add statsTracker to the gameState
            }
        );

        this.ui.updateLayerRequirements(requirements);
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
                if (layerMaxDepth > this.fishingService.getMaxDepth?.() ?? 0) {
                    this.fishingService.setMaxDepth(layerMaxDepth);
                }

                // Show notification
                this.ui.showNotification(`You have descended to the ${layer.name} layer!`, 'success');

                // Switch to fishing tab to show new layer
                this.ui.switchToTab('fishing-tab');
            }
        }
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
            // Sell the fish using the economy service
            const finalValue = this.economyService.sellFish(fish);

            // Remove any abilities the fish had
            this.abilityManager.removeFishAbility(fishId);

            // Show notification
            this.ui.showNotification(`Sold ${fish.displayName} for $${finalValue}!`, 'success');

            // Update UI
            this.updateUI();
        }
    }

    /**
     * Add a fish to a tank
     */
    private addFishToTank(fish: Fish, tankId: string): boolean {
        const success = this.tankService.addFishToTank(fish, tankId);

        if (success) {
            this.ui.showNotification(`${fish.displayName} has been added to a tank`, 'success');
        } else {
            this.ui.showNotification('Could not add fish to tank', 'error');
        }

        return success;
    }

    /**
     * Remove a fish from a tank
     */
    private removeFishFromTank(tankId: string): Fish | null {
        const fish = this.tankService.removeFishFromTank(tankId);

        if (fish) {
            this.ui.showNotification(`${fish.displayName} has been removed from tank`, 'info');
        } else {
            this.ui.showNotification('Inventory is full! Sell some fish first.', 'error');
        }

        return fish;
    }

    /**
     * Start a breeding attempt
     */
    private startBreeding(fish1: Fish, fish2: Fish): boolean {
        console.log(`Attempting to start breeding between ${fish1.displayName} and ${fish2.displayName}`);

        // First check if these fish are actually in the inventory
        if (!this.inventory.getFish(fish1.id) || !this.inventory.getFish(fish2.id)) {
            console.error("One or both fish are no longer in inventory!");
            this.ui.showNotification('One or both selected fish are no longer available.', 'error');
            return false;
        }

        const success = this.breedingService.startBreeding(fish1, fish2);

        if (success) {
            console.log(`Successfully started breeding between ${fish1.displayName} and ${fish2.displayName}`);
            this.ui.showNotification(`Started breeding ${fish1.displayName} with ${fish2.displayName}`, 'success');

            // Important: Force a complete refresh of the breeding UI to show the correct state
            setTimeout(() => {
                this.updateBreedingUI();
            }, 50);
        } else {
            console.error("Failed to start breeding");
            this.ui.showNotification('Unable to start breeding. Check compatibility or tank availability.', 'error');
        }

        return success;
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
        const success = this.breedingService.cancelBreeding(tankId);

        if (success) {
            this.ui.showNotification('Breeding canceled', 'info');
            this.updateBreedingUI();
        }
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
        // Update services
        this.serviceManager.updateServices(deltaTime);

        // Update other systems
        this.abilityManager.update(deltaTime);
        this.statsTracker.updatePlayTime(deltaTime);
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
        for (const tank of this.breedingManager.getAllTanks()) {
            if (tank.breedingPair) {
                disabledFishIds.add(tank.breedingPair.fish1.id);
                disabledFishIds.add(tank.breedingPair.fish2.id);
            }
        }

        // Update money display
        this.ui.updateMoneyDisplay(this.economy.money);

        // Update depth display
        this.ui.updateDepthDisplay(this.fishingService.getCurrentDepth());

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
     * Update breeding UI
     */
    private updateBreedingUI(): void {
        console.log("Updating breeding UI");

        // Get fresh tank data
        const tanks = this.breedingManager.getAllTanks();

        // Log tanks for debugging
        for (const tank of tanks) {
            if (tank.isOccupied() && tank.breedingPair) {
                console.log(`Tank ${tank.id}: ${tank.breedingPair.fish1.displayName} + ${tank.breedingPair.fish2.displayName}`);
            } else {
                console.log(`Tank ${tank.id}: empty`);
            }
        }

        // Update breeding tanks UI
        this.breedingUI.updateBreedingTanks(tanks);

        // Update selection panel with available fish
        // Get the list of fish IDs that are already breeding and should be disabled
        const breedingFishIds = new Set<string>();
        for (const tank of tanks) {
            if (tank.breedingPair) {
                breedingFishIds.add(tank.breedingPair.fish1.id);
                breedingFishIds.add(tank.breedingPair.fish2.id);
            }
        }

        // Update the inventory display to reflect breeding fish
        this.updateUI();

        // Update the selection panel
        this.breedingUI.updateSelectionPanel(
            this.inventory.getAllFish().filter(fish => !breedingFishIds.has(fish.id)),
            (fish1, fish2) => this.breedingManager.checkCompatibility(fish1, fish2)
        );
    }

    /**
     * Update stats display
     */
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
     * Start timer updates for breeding
     */
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
     * Stop breeding timer updates
     */
    private stopBreedingTimerUpdates(): void {
        if (this.breedingTimerInterval !== null) {
            window.clearInterval(this.breedingTimerInterval);
            this.breedingTimerInterval = null;
        }
    }

    /**
     * Handle breeding fish selection
     */
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

    /**
     * Reset the game
     */
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
            services: this.serviceManager.serializeServices()
        };

        // Save using save manager
        const success = await SaveManager.saveGame(saveData);

        // Show result
        if (success) {
            this.ui.showNotification('Game saved successfully!', 'success');
        } else {
            this.ui.showNotification('Failed to save game.', 'error');
        }

        // Restart game loop
        this.startGameLoop();
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

            // Restore services
            if (saveData.services) {
                this.serviceManager.deserializeServices(saveData.services);
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