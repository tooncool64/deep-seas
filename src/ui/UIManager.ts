import { Fish } from '../game/fish/Fish';
import { Upgrade } from '../game/upgrades/Upgrade';
import { FishAbility } from '../game/abilities/FishAbility';
import { Achievement } from '../game/stats/Achievement';

/**
 * Manages the game UI and interactions
 */
export class UIManager {
    // DOM references
    private moneyDisplay: HTMLElement;
    private currentDepthDisplay: HTMLElement;
    private castLineButton: HTMLElement;
    private inventorySlots: HTMLElement;
    private upgradeList: HTMLElement;
    private saveGameButton: HTMLElement;

    // Fishing animation state
    private isFishing: boolean = false;
    private fishingAnimation: HTMLElement;

    constructor() {
        // Get DOM references
        this.moneyDisplay = document.getElementById('money') as HTMLElement;
        this.currentDepthDisplay = document.getElementById('current-depth') as HTMLElement;
        this.castLineButton = document.getElementById('cast-line') as HTMLElement;
        this.inventorySlots = document.getElementById('inventory-slots') as HTMLElement;
        this.upgradeList = document.getElementById('upgrade-list') as HTMLElement;
        this.saveGameButton = document.getElementById('save-game') as HTMLElement;
        this.fishingAnimation = document.getElementById('fishing-animation') as HTMLElement;

        // Initialize UI
        this.initialize();
    }

    /**
     * Initialize UI
     */
    private initialize(): void {
        // Set initial states
        this.updateMoneyDisplay(0);
        this.updateDepthDisplay(0);
    }

    /**
     * Update money display
     */
    updateMoneyDisplay(amount: number): void {
        this.moneyDisplay.textContent = `$${amount.toFixed(2)}`;
    }

    /**
     * Update depth display
     */
    updateDepthDisplay(depth: number): void {
        this.currentDepthDisplay.textContent = `${depth}m`;
    }

    /**
     * Set fishing in progress
     */
    setFishingInProgress(inProgress: boolean): void {
        this.isFishing = inProgress;
        (this.castLineButton as HTMLButtonElement).disabled = inProgress;

        if (inProgress) {
            this.fishingAnimation.classList.add('fishing');
            this.castLineButton.textContent = 'Fishing...';
        } else {
            this.fishingAnimation.classList.remove('fishing');
            this.castLineButton.textContent = 'Cast Line';
        }
    }

    /**
     * Register fishing button click handler
     */
    registerCastLineHandler(handler: () => void): void {
        console.log("Registering cast line handler");
        this.castLineButton.addEventListener('click', () => {
            console.log("Cast line button clicked");
            if (!this.isFishing) {
                console.log("Starting fishing process");
                handler();
            } else {
                console.log("Already fishing, ignoring click");
            }
        });
    }

    /**
     * Register save button click handler
     */
    registerSaveHandler(handler: () => void): void {
        this.saveGameButton.addEventListener('click', handler);
    }

    /**
     * Update inventory display
     */
    updateInventory(fish: Fish[], inventoryCapacity: number, sellHandler: (fishId: string) => void): void {
        // Clear existing slots
        this.inventorySlots.innerHTML = '';

        // Create fish slots
        for (let i = 0; i < inventoryCapacity; i++) {
            const slot = document.createElement('div');
            slot.className = 'inventory-slot';

            // If this slot has a fish, populate it
            if (i < fish.length) {
                const currentFish = fish[i];
                slot.classList.add('filled');

                // Create fish display
                const fishElement = document.createElement('div');
                fishElement.className = `fish-item ${currentFish.rarity}`;
                fishElement.innerHTML = `
          <div class="fish-name">${currentFish.displayName}</div>
          <div class="fish-details">
            <div>${currentFish.weight}kg</div>
            <div>$${currentFish.value}</div>
          </div>
        `;

                // Create sell button
                const sellButton = document.createElement('button');
                sellButton.className = 'sell-button';
                sellButton.textContent = 'Sell';
                sellButton.addEventListener('click', () => {
                    sellHandler(currentFish.id);
                });

                // Add to slot
                fishElement.appendChild(sellButton);
                slot.appendChild(fishElement);
            } else {
                // Empty slot
                slot.innerHTML = '<div class="empty-slot">Empty</div>';
            }

            this.inventorySlots.appendChild(slot);
        }
    }

    /**
     * Update upgrades display
     */
    updateUpgrades(upgrades: Upgrade[], purchaseHandler: (upgradeId: string) => void): void {
        // Clear existing upgrades
        this.upgradeList.innerHTML = '';

        // Create upgrade items
        for (const upgrade of upgrades) {
            const upgradeElement = document.createElement('div');
            upgradeElement.className = 'upgrade-item';

            // Create upgrade details
            upgradeElement.innerHTML = `
        <div class="upgrade-name">${upgrade.name} (Level ${upgrade.level}/${upgrade.maxLevel})</div>
        <div class="upgrade-description">${upgrade.description}</div>
        <div class="upgrade-details">
          <div>Current bonus: ${this.formatUpgradeValue(upgrade)}</div>
          <div>Cost: ${upgrade.isMaxLevel() ? 'MAX' : `$${upgrade.nextCost}`}</div>
        </div>
      `;

            // Create purchase button
            const purchaseButton = document.createElement('button');
            purchaseButton.className = 'purchase-button';
            purchaseButton.textContent = upgrade.isMaxLevel() ? 'Maxed' : 'Purchase';
            purchaseButton.disabled = upgrade.isMaxLevel();

            purchaseButton.addEventListener('click', () => {
                purchaseHandler(upgrade.id);
            });

            // Add to upgrade element
            upgradeElement.appendChild(purchaseButton);
            this.upgradeList.appendChild(upgradeElement);
        }
    }

    /**
     * Format upgrade value based on type
     */
    private formatUpgradeValue(upgrade: Upgrade): string {
        switch (upgrade.type) {
            case 'fishing_power':
                return `+${upgrade.totalValue} Fishing Power`;
            case 'line_strength':
                return `+${upgrade.totalValue} Line Strength`;
            case 'depth_access':
                return `+${upgrade.totalValue}m Depth`;
            case 'tank_capacity':
                return `+${upgrade.totalValue} Tank Capacity`;
            case 'catch_speed':
                return `${(upgrade.totalValue * 100).toFixed(0)}% Faster Catch`;
            default:
                return `+${upgrade.totalValue}`;
        }
    }

    /**
     * Show a notification to the player
     */
    showNotification(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;

        // Add to DOM
        document.body.appendChild(notification);

        // Fade in
        setTimeout(() => {
            notification.classList.add('visible');
        }, 10);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.classList.remove('visible');

            // Remove from DOM after fade out
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }

    /**
     * Show fish catch result
     */
    showFishCaught(fish: Fish | null): void {
        if (!fish) {
            this.showNotification('You didn\'t catch anything.', 'info');
            return;
        }

        // Create catch notification
        this.showNotification(`Caught a ${fish.displayName} (${fish.weight}kg)!`, 'success');

        // Animate fish catch
        const catchAnimation = document.createElement('div');
        catchAnimation.className = 'catch-animation';
        catchAnimation.textContent = '🐠';

        // Add to fishing area
        this.fishingAnimation.appendChild(catchAnimation);

        // Remove after animation
        setTimeout(() => {
            catchAnimation.remove();
        }, 1000);
    }

    updateInventoryWithAbilities(
        fish: Fish[],
        inventoryCapacity: number,
        sellHandler: (fishId: string) => void,
        fishAbilities: Map<string, FishAbility>
    ): void {
        // Clear existing slots
        this.inventorySlots.innerHTML = '';

        // Create fish slots
        for (let i = 0; i < inventoryCapacity; i++) {
            const slot = document.createElement('div');
            slot.className = 'inventory-slot';

            // If this slot has a fish, populate it
            if (i < fish.length) {
                const currentFish = fish[i];
                slot.classList.add('filled');

                // Create fish display
                const fishElement = document.createElement('div');
                fishElement.className = `fish-item ${currentFish.rarity}`;
                fishElement.dataset.fishId = currentFish.id;

                // Check if fish has ability
                const hasAbility = fishAbilities.has(currentFish.id);

                fishElement.innerHTML = `
                    <div class="fish-name">${currentFish.displayName} ${hasAbility ? '<span class="ability-indicator">✨</span>' : ''}</div>
                    <div class="fish-details">
                        <div>${currentFish.weight}kg</div>
                        <div>$${currentFish.value}</div>
                    </div>
                `;

                // Create sell button
                const sellButton = document.createElement('button');
                sellButton.className = 'sell-button';
                sellButton.textContent = 'Sell';
                sellButton.addEventListener('click', (event) => {
                    event.stopPropagation(); // Prevent opening details when clicking sell
                    sellHandler(currentFish.id);
                });

                // Add to slot
                fishElement.appendChild(sellButton);
                slot.appendChild(fishElement);
            } else {
                // Empty slot
                slot.innerHTML = '<div class="empty-slot">Empty</div>';
            }

            this.inventorySlots.appendChild(slot);
        }
    }

    /**
     * Show achievement notification
     */
    showAchievementUnlocked(achievement: Achievement): void {
        // Create notification element with special styling
        const notification = document.createElement('div');
        notification.className = 'notification achievement';

        notification.innerHTML = `
            <div class="achievement-title">Achievement Unlocked!</div>
            <div class="achievement-name">${achievement.name}</div>
            <div class="achievement-description">${achievement.description}</div>
        `;

        // Add to DOM
        document.body.appendChild(notification);

        // Fade in
        setTimeout(() => {
            notification.classList.add('visible');
        }, 10);

        // Remove after 5 seconds (longer than regular notifications)
        setTimeout(() => {
            notification.classList.remove('visible');

            // Remove from DOM after fade out
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 5000);
    }

    /**
     * Update stats display
     */
    updateStats(stats: Map<string, number>): void {
        // Create or get stats container
        let statsContainer = document.getElementById('stats-container');

        if (!statsContainer) {
            statsContainer = document.createElement('div');
            statsContainer.id = 'stats-container';
            statsContainer.className = 'stats-container';

            // Add to game container
            const gameContainer = document.getElementById('game-container');
            if (gameContainer) {
                gameContainer.appendChild(statsContainer);
            }
        }

        // Format and display key stats
        const keyStats = [
            { name: 'Fish Caught', value: stats.get('totalFishCaught') || 0 },
            { name: 'Max Depth', value: `${stats.get('maxDepthReached') || 0}m` },
            { name: 'Breeding Success', value: stats.get('successfulBreeds') || 0 },
            { name: 'Play Time', value: this.formatTime(stats.get('totalPlayTime') || 0) }
        ];

        statsContainer.innerHTML = `
            <h3>Statistics</h3>
            <div class="stats-grid">
                ${keyStats.map(stat => `
                    <div class="stat-item">
                        <div class="stat-name">${stat.name}</div>
                        <div class="stat-value">${stat.value}</div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    /**
     * Format time in seconds to a readable string
     */
    private formatTime(seconds: number): string {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);

        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        } else {
            return `${minutes}m`;
        }
    }

    /**
     * Initialize tab system
     */
    initializeTabs(): void {
        // Get all tab buttons
        const tabButtons = document.querySelectorAll('.tab-button');

        // Add click handler to each tab button
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const tabId = (button as HTMLElement).dataset.tab;
                this.switchToTab(tabId as string);
            });
        });
    }

    /**
     * Switch to a specific tab
     */
    switchToTab(tabId: string): void {
        // Remove active class from all tabs and buttons
        const allTabs = document.querySelectorAll('.tab-content');
        const allButtons = document.querySelectorAll('.tab-button');

        allTabs.forEach(tab => tab.classList.remove('active'));
        allButtons.forEach(button => button.classList.remove('active'));

        // Add active class to selected tab and button
        const selectedTab = document.getElementById(tabId);
        const selectedButton = document.querySelector(`.tab-button[data-tab="${tabId}"]`);

        if (selectedTab) {
            selectedTab.classList.add('active');
        }

        if (selectedButton) {
            selectedButton.classList.add('active');
        }
    }

    registerTabChangeHandler(handler: (tabId: string) => void): void {
        const tabButtons = document.querySelectorAll('.tab-button');

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const tabId = (button as HTMLElement).dataset.tab;
                if (tabId) {
                    handler(tabId);
                }
            });
        });
    }

    /**
     * Initialize layer transition system
     */
    initializeLayerTransition(
        currentLayer: string,
        nextLayer: string,
        requirements: {id: string, description: string, isComplete: boolean}[],
        checkRequirementsHandler: () => boolean,
        descendHandler: () => void
    ): void {
        // Update layer display
        const currentLayerElement = document.querySelector('.current-layer .layer-name');
        const nextLayerElement = document.querySelector('.next-layer .layer-name');

        if (currentLayerElement) {
            currentLayerElement.textContent = currentLayer;
        }

        if (nextLayerElement) {
            nextLayerElement.textContent = nextLayer;
        }

        // Update requirements list
        this.updateLayerRequirements(requirements);

        // Set up descend button
        const descendButton = document.getElementById('descend-button');
        if (descendButton) {
            descendButton.addEventListener('click', () => {
                if (checkRequirementsHandler()) {
                    this.showLayerTransitionAnimation(currentLayer, nextLayer);
                    descendHandler();
                }
            });
        }
    }

    /**
     * Update layer transition requirements
     */
    updateLayerRequirements(requirements: {id: string, description: string, isComplete: boolean}[]): void {
        const requirementsList = document.querySelector('.requirement-list');
        if (!requirementsList) return;

        // Clear existing items
        requirementsList.innerHTML = '';

        // Add each requirement
        let completedCount = 0;

        for (const req of requirements) {
            const item = document.createElement('li');
            item.className = 'requirement-item';
            item.innerHTML = `
            <div class="requirement-status ${req.isComplete ? 'completed' : 'incomplete'}">✓</div>
            <div>${req.description}</div>
        `;

            requirementsList.appendChild(item);

            if (req.isComplete) {
                completedCount++;
            }
        }

        // Update progress bar
        const progressPercent = requirements.length > 0
            ? (completedCount / requirements.length) * 100
            : 0;

        const progressFill = document.querySelector('.progress-fill') as HTMLElement;
        const progressText = document.querySelector('.progress-text');

        if (progressFill) {
            progressFill.style.width = `${progressPercent}%`;
        }

        if (progressText) {
            progressText.textContent = `${Math.round(progressPercent)}%`;
        }

        // Enable/disable descend button
        const descendButton = document.getElementById('descend-button') as HTMLButtonElement;
        if (descendButton) {
            descendButton.disabled = completedCount < requirements.length;
        }
    }

    /**
     * Show layer transition animation
     */
    showLayerTransitionAnimation(fromLayer: string, toLayer: string): void {
        // Create transition overlay
        const overlay = document.createElement('div');
        overlay.className = 'layer-transition-overlay';

        overlay.innerHTML = `
        <div class="transition-title">Descending to ${toLayer}</div>
        <div class="transition-message">
            You are leaving the ${fromLayer} and entering the mysterious depths of the ${toLayer}.
            New fish species and challenges await!
        </div>
        <div class="transition-animation"></div>
    `;

        // Add to DOM
        document.body.appendChild(overlay);

        // Remove after animation completes
        setTimeout(() => {
            document.body.removeChild(overlay);
        }, 3000);
    }
}