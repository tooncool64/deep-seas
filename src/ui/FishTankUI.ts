import { Fish } from '../game/fish/Fish';
import { FishTank, FishTankManager } from '../game/tanks/FishTankManager';
import { FishAbility } from '../game/abilities/FishAbility';

/**
 * UI for fish tanks management
 */
export class FishTankUI {
    // DOM elements
    private tanksContainer: HTMLElement;
    private availableFishContainer: HTMLElement;

    // Callbacks
    private addToTankCallback: ((fish: Fish, tankId: string) => boolean) | null = null;
    private removeFromTankCallback: ((tankId: string) => Fish | null) | null = null;
    private viewFishDetailsCallback: ((fishId: string) => void) | null = null;

    constructor() {
        // Get container elements
        this.tanksContainer = document.getElementById('fish-tanks-container') as HTMLElement;
        this.availableFishContainer = document.getElementById('available-fish-container') as HTMLElement;

        // Make sure elements exist
        if (!this.tanksContainer) {
            this.tanksContainer = this.createContainer('fish-tanks-container');
        }

        if (!this.availableFishContainer) {
            this.availableFishContainer = this.createContainer('available-fish-container');
        }
    }

    /**
     * Create a container element
     */
    private createContainer(id: string): HTMLElement {
        const container = document.createElement('div');
        container.id = id;
        return container;
    }

    /**
     * Update the tanks display
     */
    updateTanks(tanks: FishTank[], abilities: Map<string, FishAbility>): void {
        // Clear container
        this.tanksContainer.innerHTML = '';

        // Create tank elements
        for (const tank of tanks) {
            const tankElement = this.createTankElement(tank, abilities);
            this.tanksContainer.appendChild(tankElement);
        }
    }

    /**
     * Create a tank element
     */
    private createTankElement(tank: FishTank, abilities: Map<string, FishAbility>): HTMLElement {
        const tankElement = document.createElement('div');
        tankElement.className = 'fish-tank';
        tankElement.dataset.tankId = tank.id;

        // Add tank title
        const title = document.createElement('div');
        title.className = 'fish-tank-title';
        title.innerHTML = `
            ${tank.name}
            ${tank.hasFish() ? `<span class="tank-status ${tank.isActive ? 'active' : ''}">
                ${tank.isActive ? 'Active' : 'Inactive'}
            </span>` : ''}
        `;
        tankElement.appendChild(title);

        // Add tank content
        if (tank.hasFish() && tank.fish) {
            // Tank has a fish - show fish details
            const fishList = document.createElement('div');
            fishList.className = 'tank-fish-list';

            const fishElement = document.createElement('div');
            fishElement.className = `tank-fish-item ${tank.fish.rarity}`;

            // Check if fish has an ability
            const ability = tank.fish ? abilities.get(tank.fish.id) : undefined;

            fishElement.innerHTML = `
                <div class="fish-details">
                    <div class="fish-name">${tank.fish.displayName}</div>
                    <div class="fish-stats">
                        <div>${tank.fish.weight}kg - $${tank.fish.value}</div>
                        <div>Caught at ${tank.fish.caughtDepth}m</div>
                    </div>
                    ${ability ? `<div class="ability-active">
                        ${ability.name}: ${ability.description}
                    </div>` : ''}
                </div>
            `;

            // Add remove button
            const removeButton = document.createElement('button');
            removeButton.className = 'remove-from-tank-button';
            removeButton.textContent = 'Remove';
            removeButton.addEventListener('click', () => {
                if (this.removeFromTankCallback) {
                    this.removeFromTankCallback(tank.id);
                }
            });

            fishElement.appendChild(removeButton);
            fishList.appendChild(fishElement);
            tankElement.appendChild(fishList);
        } else {
            // Empty tank
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'empty-tank-message';
            emptyMessage.textContent = 'Empty Tank';
            tankElement.appendChild(emptyMessage);
        }

        return tankElement;
    }

    /**
     * Update available fish display
     */
    updateAvailableFish(
        fish: Fish[],
        abilities: Map<string, FishAbility>,
        unavailableFishIds: Set<string> = new Set()
    ): void {
        // Clear container
        this.availableFishContainer.innerHTML = '';

        // Group fish by rarity for better organization
        const fishByRarity: Record<string, Fish[]> = {};

        for (const f of fish) {
            if (unavailableFishIds.has(f.id)) continue;

            if (!fishByRarity[f.rarity]) {
                fishByRarity[f.rarity] = [];
            }

            fishByRarity[f.rarity].push(f);
        }

        // Create fish elements grouped by rarity
        for (const rarity of ['legendary', 'mythic', 'rare', 'uncommon', 'common']) {
            const rarityFish = fishByRarity[rarity];

            if (rarityFish && rarityFish.length > 0) {
                // Add rarity header
                const rarityHeader = document.createElement('h4');
                rarityHeader.textContent = `${rarity.charAt(0).toUpperCase() + rarity.slice(1)} Fish`;
                this.availableFishContainer.appendChild(rarityHeader);

                // Add fish list for this rarity
                const fishList = document.createElement('div');
                fishList.className = 'tank-fish-list';

                for (const f of rarityFish) {
                    const fishElement = this.createFishElement(f, abilities.get(f.id));
                    fishList.appendChild(fishElement);
                }

                this.availableFishContainer.appendChild(fishList);
            }
        }

        // If no available fish, show message
        if (Object.keys(fishByRarity).length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'empty-tank-message';
            emptyMessage.textContent = 'No fish available';
            this.availableFishContainer.appendChild(emptyMessage);
        }
    }

    /**
     * Create a fish element
     */
    private createFishElement(fish: Fish, ability: FishAbility | undefined): HTMLElement {
        const fishElement = document.createElement('div');
        fishElement.className = `tank-fish-item ${fish.rarity}`;
        fishElement.dataset.fishId = fish.id;

        // Add fish content
        fishElement.innerHTML = `
            <div class="fish-details">
                <div class="fish-name">${fish.displayName}</div>
                <div class="fish-stats">
                    <div>${fish.weight}kg - $${fish.value}</div>
                    <div>Caught at ${fish.caughtDepth}m</div>
                </div>
                ${ability ? `<div class="ability-name">
                    ${ability.name}${ability.isPassive ? ' (Passive)' : ''}
                </div>` : ''}
            </div>
        `;

        // Add view details button
        const viewButton = document.createElement('button');
        viewButton.className = 'view-fish-button';
        viewButton.textContent = 'Details';
        viewButton.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent other click handlers
            if (this.viewFishDetailsCallback) {
                this.viewFishDetailsCallback(fish.id);
            }
        });

        // Add to tank button
        const addButton = document.createElement('button');
        addButton.className = 'add-to-tank-button';
        addButton.textContent = 'Add to Tank';
        addButton.addEventListener('click', () => {
            if (this.addToTankCallback) {
                // Just add to first available tank for simplicity
                // In a more advanced implementation, you could show a tank selection dialog
                this.addToTankCallback(fish, '');
            }
        });

        // Add buttons
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'fish-button-container';
        buttonContainer.appendChild(viewButton);
        buttonContainer.appendChild(addButton);
        fishElement.appendChild(buttonContainer);

        return fishElement;
    }

    /**
     * Set callback for adding fish to tank
     */
    setAddToTankCallback(callback: (fish: Fish, tankId: string) => boolean): void {
        this.addToTankCallback = callback;
    }

    /**
     * Set callback for removing fish from tank
     */
    setRemoveFromTankCallback(callback: (tankId: string) => Fish | null): void {
        this.removeFromTankCallback = callback;
    }

    /**
     * Set callback for viewing fish details
     */
    setViewFishDetailsCallback(callback: (fishId: string) => void): void {
        this.viewFishDetailsCallback = callback;
    }

    /**
     * Show a confirmation dialog
     */
    showConfirmation(message: string, onConfirm: () => void): void {
        if (confirm(message)) {
            onConfirm();
        }
    }
}