import { Fish } from '../game/fish/Fish';
import { BreedingTank } from '../game/breeding/BreedingTank';
import { BreedingOutcome } from '../game/breeding/BreedingOutcome';

/**
 * Manages the breeding UI elements
 */
export class BreedingUI {
    // DOM references
    private breedingContainer: HTMLElement;
    private breedingTanksContainer: HTMLElement;
    private selectionPanel: HTMLElement;

    // Selected fish for breeding
    private selectedFish: Fish | null = null;

    // Callback for breeding
    private startBreedingCallback: ((fish1: Fish, fish2: Fish) => boolean) | null = null;

    constructor(containerId: string = 'breeding-area') {
        // Get or create main container
        let container = document.getElementById(containerId);

        if (!container) {
            container = this.createBreedingContainer(containerId);
        }

        this.breedingContainer = container;

        // Create internal elements
        this.breedingTanksContainer = this.createBreedingTanksContainer();
        this.selectionPanel = this.createSelectionPanel();

        // Add to main container
        this.breedingContainer.appendChild(this.breedingTanksContainer);
        this.breedingContainer.appendChild(this.selectionPanel);
    }

    /**
     * Create the main breeding container
     */
    private createBreedingContainer(id: string): HTMLElement {
        const container = document.createElement('div');
        container.id = id;
        container.className = 'breeding-area';

        // Add heading
        const heading = document.createElement('h2');
        heading.textContent = 'Breeding';
        container.appendChild(heading);

        // Add to DOM
        const gameArea = document.getElementById('game-area');
        if (gameArea) {
            gameArea.appendChild(container);
        } else {
            document.body.appendChild(container);
        }

        return container;
    }

    /**
     * Create the breeding tanks container
     */
    private createBreedingTanksContainer(): HTMLElement {
        const container = document.createElement('div');
        container.className = 'breeding-tanks-container';

        return container;
    }

    /**
     * Create the fish selection panel
     */
    private createSelectionPanel(): HTMLElement {
        const panel = document.createElement('div');
        panel.className = 'breeding-selection-panel';

        // Add panel title
        const title = document.createElement('h3');
        title.textContent = 'Select Fish for Breeding';
        panel.appendChild(title);

        // Add instructions
        const instructions = document.createElement('p');
        instructions.textContent = 'Select two compatible fish to place in a breeding tank.';
        panel.appendChild(instructions);

        // Add selection container
        const selectionContainer = document.createElement('div');
        selectionContainer.className = 'breeding-selection-container';
        panel.appendChild(selectionContainer);

        return panel;
    }

    /**
     * Update the breeding tanks display
     */
    updateBreedingTanks(tanks: BreedingTank[]): void {
        // Clear container
        this.breedingTanksContainer.innerHTML = '';

        // Create tank elements
        for (const tank of tanks) {
            const tankElement = this.createTankElement(tank);
            this.breedingTanksContainer.appendChild(tankElement);
        }
    }

    /**
     * Create a tank display element
     */
    private createTankElement(tank: BreedingTank): HTMLElement {
        const tankElement = document.createElement('div');
        tankElement.className = 'breeding-tank';
        tankElement.dataset.tankId = tank.id;

        // Add tank title
        const title = document.createElement('div');
        title.className = 'tank-title';
        title.textContent = `Breeding Tank`;
        tankElement.appendChild(title);

        if (tank.isOccupied()) {
            // Tank has breeding pair
            const pairInfo = tank.getPairInfo();

            if (pairInfo) {
                // Add fish info
                const fishInfo = document.createElement('div');
                fishInfo.className = 'breeding-fish-info';
                fishInfo.innerHTML = `
                    <div>${pairInfo.fish1Name}</div>
                    <div>+</div>
                    <div>${pairInfo.fish2Name}</div>
                `;
                tankElement.appendChild(fishInfo);

                // Add progress bar
                const progress = tank.getProgress() * 100;
                const progressBar = document.createElement('div');
                progressBar.className = 'breeding-progress-bar';
                progressBar.innerHTML = `
                    <div class="progress-fill" style="width: ${progress}%"></div>
                    <div class="progress-text">${progress.toFixed(0)}%</div>
                `;
                tankElement.appendChild(progressBar);

                // Add cancel button
                const cancelButton = document.createElement('button');
                cancelButton.className = 'cancel-breeding-button';
                cancelButton.textContent = 'Cancel';
                cancelButton.addEventListener('click', () => {
                    if (this.cancelBreedingCallback) {
                        this.cancelBreedingCallback(tank.id);
                    }
                });
                tankElement.appendChild(cancelButton);
            }
        } else {
            // Empty tank
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'empty-tank-message';
            emptyMessage.textContent = 'Empty Tank';
            tankElement.appendChild(emptyMessage);

            // Add info
            const infoText = document.createElement('div');
            infoText.className = 'tank-info';
            infoText.textContent = 'Select two compatible fish to breed';
            tankElement.appendChild(infoText);
        }

        return tankElement;
    }

    /**
     * Update the fish selection panel
     */
    updateSelectionPanel(availableFish: Fish[], compatibilityCheck: (fish1: Fish, fish2: Fish) => boolean): void {
        // Get the selection container
        const selectionContainer = this.selectionPanel.querySelector('.breeding-selection-container');

        if (!selectionContainer) {
            return;
        }

        // Clear container
        selectionContainer.innerHTML = '';

        // Create fish selection elements
        for (const fish of availableFish) {
            const fishElement = this.createFishSelectionElement(
                fish,
                this.selectedFish,
                compatibilityCheck
            );
            selectionContainer.appendChild(fishElement);
        }

        // Update selected fish display
        this.updateSelectedFishDisplay();
    }

    /**
     * Create a fish selection element
     */
    private createFishSelectionElement(
        fish: Fish,
        selectedFish: Fish | null,
        compatibilityCheck: (fish1: Fish, fish2: Fish) => boolean
    ): HTMLElement {
        const fishElement = document.createElement('div');
        fishElement.className = 'breeding-fish-selection';
        fishElement.dataset.fishId = fish.id;

        // Check if this fish is compatible with selected fish
        let isCompatible = true;
        if (selectedFish && selectedFish.id !== fish.id) {
            isCompatible = compatibilityCheck(selectedFish, fish);
        }

        // Set CSS classes
        if (selectedFish && selectedFish.id === fish.id) {
            fishElement.classList.add('selected');
        }

        if (!isCompatible) {
            fishElement.classList.add('incompatible');
        }

        // Add fish content
        fishElement.innerHTML = `
            <div class="fish-name ${fish.rarity}">${fish.displayName}</div>
            <div class="fish-details">
                <span>${fish.weight}kg</span>
                <span>Caught at ${fish.caughtDepth}m</span>
            </div>
        `;

        // Add click handler
        fishElement.addEventListener('click', () => {
            if (fishElement.classList.contains('incompatible')) {
                return; // Cannot select incompatible fish
            }

            this.handleFishSelection(fish);
        });

        return fishElement;
    }

    /**
     * Handle fish selection
     */
    private handleFishSelection(fish: Fish): void {
        if (this.selectedFish && this.selectedFish.id === fish.id) {
            // Deselect if already selected
            this.selectedFish = null;
        } else if (this.selectedFish) {
            // Already have one fish selected, try to breed with second fish
            if (this.startBreedingCallback) {
                const success = this.startBreedingCallback(this.selectedFish, fish);

                if (success) {
                    // Reset selection after successful breeding
                    this.selectedFish = null;
                }
            }
        } else {
            // Select the first fish
            this.selectedFish = fish;
        }

        // Update UI
// Update UI
        const selectionElements = this.selectionPanel.querySelectorAll('.breeding-fish-selection');

        for (const element of selectionElements) {
            element.classList.remove('selected');

            if (this.selectedFish && (element as HTMLElement).dataset.fishId === this.selectedFish.id) {
                element.classList.add('selected');
            }
        }

        this.updateSelectedFishDisplay();
    }

    /**
     * Update the selected fish display
     */
    private updateSelectedFishDisplay(): void {
        // Remove existing display
        const existingDisplay = this.selectionPanel.querySelector('.selected-fish-display');
        if (existingDisplay) {
            existingDisplay.remove();
        }

        if (!this.selectedFish) {
            return;
        }

        // Create selected fish display
        const display = document.createElement('div');
        display.className = 'selected-fish-display';

        // Add content
        display.innerHTML = `
            <h4>Selected Fish</h4>
            <div class="fish-name ${this.selectedFish.rarity}">${this.selectedFish.displayName}</div>
            <div>Select another compatible fish to start breeding</div>
            <button class="cancel-selection-button">Cancel Selection</button>
        `;

        // Add cancel button handler
        const cancelButton = display.querySelector('.cancel-selection-button');
        if (cancelButton) {
            cancelButton.addEventListener('click', () => {
                this.selectedFish = null;
                this.updateSelectedFishDisplay();

                // Deselect all fish in the selection panel
                const selectionElements = this.selectionPanel.querySelectorAll('.breeding-fish-selection');
                for (const element of selectionElements) {
                    element.classList.remove('selected');
                }
            });
        }

        // Add to panel
        this.selectionPanel.appendChild(display);
    }

    /**
     * Show breeding outcome
     */
    showBreedingOutcome(outcome: BreedingOutcome): void {
        // Create modal overlay
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';

        // Create outcome modal
        const modal = document.createElement('div');
        modal.className = 'breeding-outcome-modal';

        // Add modal content
        modal.innerHTML = `
            <h3>Breeding Outcome</h3>
            <div class="parents-container">
                <div class="parent-fish">
                    <div class="fish-name ${outcome.parentFish1.rarity}">${outcome.parentFish1.displayName}</div>
                </div>
                <div class="plus-sign">+</div>
                <div class="parent-fish">
                    <div class="fish-name ${outcome.parentFish2.rarity}">${outcome.parentFish2.displayName}</div>
                </div>
            </div>
            
            <div class="outcome-result">
                <h4>Offspring</h4>
                <div class="offspring-count">${outcome.offspring.length} fish produced</div>
                ${outcome.hasMutation ? '<div class="mutation-notice">Mutation occurred!</div>' : ''}
            </div>
            
            <div class="offspring-container"></div>
            
            <button class="close-modal-button">Continue</button>
        `;

        // Add offspring to container
        const offspringContainer = modal.querySelector('.offspring-container');
        if (offspringContainer) {
            for (const fish of outcome.offspring) {
                const fishElement = document.createElement('div');
                fishElement.className = 'offspring-fish';

                fishElement.innerHTML = `
                    <div class="fish-name ${fish.rarity}">${fish.displayName}</div>
                    <div class="fish-details">
                        <span>${fish.weight}kg</span>
                        <span>Value: ${fish.value}</span>
                    </div>
                `;

                offspringContainer.appendChild(fishElement);
            }
        }

        // Add close button handler
        const closeButton = modal.querySelector('.close-modal-button');
        if (closeButton) {
            closeButton.addEventListener('click', () => {
                document.body.removeChild(overlay);
            });
        }

        // Add modal to overlay
        overlay.appendChild(modal);

        // Add to DOM
        document.body.appendChild(overlay);
    }

    /**
     * Set callback for starting breeding
     */
    setStartBreedingCallback(callback: (fish1: Fish, fish2: Fish) => boolean): void {
        this.startBreedingCallback = callback;
    }

    /**
     * Set callback for canceling breeding
     */
    private cancelBreedingCallback: ((tankId: string) => void) | null = null;

    setCancelBreedingCallback(callback: (tankId: string) => void): void {
        this.cancelBreedingCallback = callback;
    }

    /**
     * Reset selection
     */
    resetSelection(): void {
        this.selectedFish = null;
        this.updateSelectedFishDisplay();
    }
}