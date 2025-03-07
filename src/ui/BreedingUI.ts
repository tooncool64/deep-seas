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

                // Add progress bar with time remaining
                const progress = tank.getProgress() * 100;
                const timeRemaining = Math.ceil(tank.getTimeRemaining() / 1000); // in seconds

                // Format time remaining nicely
                const minutes = Math.floor(timeRemaining / 60);
                const seconds = timeRemaining % 60;
                const timeDisplay = `${minutes}:${seconds.toString().padStart(2, '0')}`;

                const progressBar = document.createElement('div');
                progressBar.className = 'breeding-progress-bar';
                progressBar.dataset.tankId = tank.id; // Add tank ID for updates
                progressBar.innerHTML = `
                <div class="progress-fill" style="width: ${progress}%"></div>
                <div class="progress-text">${progress.toFixed(0)}% (${timeDisplay})</div>
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

        if (this.onSelectionChanged) {
            this.onSelectionChanged();
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

    getSelectedFish(): Fish | null {
        return this.selectedFish;
    }

    private onSelectionChanged: (() => void) | null = null;

    /**
     * Set callback for when selection changes
     */
    setSelectionChangedCallback(callback: () => void): void {
        this.onSelectionChanged = callback;
    }

    updateBreedingTimers(tanks: BreedingTank[]): void {
        for (const tank of tanks) {
            if (tank.isOccupied()) {
                const progressBar = document.querySelector(`.breeding-progress-bar[data-tank-id="${tank.id}"]`);
                if (progressBar) {
                    const progress = tank.getProgress() * 100;
                    const timeRemaining = Math.ceil(tank.getTimeRemaining() / 1000); // in seconds

                    // Format time remaining
                    const minutes = Math.floor(timeRemaining / 60);
                    const seconds = timeRemaining % 60;
                    const timeDisplay = `${minutes}:${seconds.toString().padStart(2, '0')}`;

                    // Update progress bar
                    const progressFill = progressBar.querySelector('.progress-fill') as HTMLElement;
                    const progressText = progressBar.querySelector('.progress-text') as HTMLElement;

                    if (progressFill) {
                        progressFill.style.width = `${progress}%`;
                    }

                    if (progressText) {
                        progressText.textContent = `${progress.toFixed(0)}% (${timeDisplay})`;
                    }
                }
            }
        }
    }

    getBreedingFishIds(): Set<string> {
        const breedingFishIds = new Set<string>();

        // Add currently selected fish
        if (this.selectedFish) {
            breedingFishIds.add(this.selectedFish.id);
        }

        // Get all fish that are currently breeding in tanks
        const tanks = document.querySelectorAll('.breeding-tank');
        tanks.forEach(tank => {
            const fishInfo = tank.querySelector('.breeding-fish-info');
            if (fishInfo) {
                // If we have fish info elements, this tank is active
                const fishIdElements = tank.querySelectorAll('[data-fish-id]');
                fishIdElements.forEach(el => {
                    const fishId = (el as HTMLElement).dataset.fishId;
                    if (fishId) {
                        breedingFishIds.add(fishId);
                    }
                });
            }
        });

        return breedingFishIds;
    }

    // Add a method to get breeding efficiency
    private getBreedingEfficiency(): number {
        // Default to 1 if not provided by game
        return this.breedingEfficiency || 1;
    }

// Add a property for breeding efficiency
    private breedingEfficiency: number = 1;

// Add a method to set breeding efficiency
    setBreedingEfficiency(efficiency: number): void {
        this.breedingEfficiency = efficiency;
    }

// Add methods to calculate breeding chances
    private calculateBreedingChances: ((fish1: Fish, fish2: Fish, efficiency: number) => {
        successChance: number,
        offspringRange: [number, number],
        mutationChance: number
    }) | null = null;

    setBreedingChanceCalculator(calculator: (fish1: Fish, fish2: Fish, efficiency: number) => {
        successChance: number,
        offspringRange: [number, number],
        mutationChance: number
    }): void {
        this.calculateBreedingChances = calculator;
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
        let content = `
        <h4>Selected Fish</h4>
        <div class="fish-name ${this.selectedFish.rarity}">${this.selectedFish.displayName}</div>
        <div>Select another compatible fish to start breeding</div>
    `;

        // Check compatible fish in the selection container
        const compatibleFishIds = new Set<string>();
        const selectionElements = this.selectionPanel.querySelectorAll('.breeding-fish-selection:not(.incompatible):not(.selected)');
        selectionElements.forEach(element => {
            const fishId = (element as HTMLElement).dataset.fishId;
            if (fishId) {
                compatibleFishIds.add(fishId);
            }
        });

        // If we have compatible fish and a calculator, show breeding chances
        if (compatibleFishIds.size > 0 && this.calculateBreedingChances) {
            content += `<div class="breeding-chances-header">Breeding Chances:</div>`;

            // Loop through each compatible fish and show chances
            const efficiency = this.getBreedingEfficiency();
            let chancesAdded = 0;

            selectionElements.forEach(element => {
                const fishElement = element as HTMLElement;
                const fishId = fishElement.dataset.fishId;
                const fishNameElement = fishElement.querySelector('.fish-name');

                if (fishId && fishNameElement && this.calculateBreedingChances) {
                    // Find the fish object for this element
                    const allFishElements = this.selectionPanel.querySelectorAll('[data-fish-id]');
                    let compatibleFish: Fish | null = null;

                    for (const el of Array.from(allFishElements)) {
                        if ((el as HTMLElement).dataset.fishId === fishId) {
                            // This is a hack - we should properly pass fish objects
                            const rarity = (el.querySelector('.fish-name')?.className.split(' ')[1] || 'common');
                            compatibleFish = {
                                id: fishId,
                                displayName: fishNameElement.textContent || 'Fish',
                                rarity: rarity,
                                caughtDepth: 0, // We don't have this info here
                            } as unknown as Fish;
                            break;
                        }
                    }

                    if (compatibleFish && this.selectedFish) {
                        // Calculate chances
                        const { successChance, offspringRange, mutationChance } =
                            this.calculateBreedingChances(this.selectedFish, compatibleFish, efficiency);

                        // Only show up to 3 examples to avoid cluttering the UI
                        if (chancesAdded < 3) {
                            content += `
                            <div class="breeding-chance-item">
                                <div class="chance-fish-name ${compatibleFish.rarity}">${compatibleFish.displayName}</div>
                                <div class="chance-details">
                                    <div>Success: ${(successChance * 100).toFixed(0)}%</div>
                                    <div>Offspring: ${offspringRange[0]}-${offspringRange[1]}</div>
                                    <div>Mutation: ${(mutationChance * 100).toFixed(0)}%</div>
                                </div>
                            </div>
                        `;
                            chancesAdded++;
                        }
                    }
                }
            });

            // If we have more examples than shown, add a note
            if (compatibleFishIds.size > 3) {
                content += `<div class="more-examples-note">${compatibleFishIds.size - 3} more compatible fish...</div>`;
            }
        }

        // Add cancel button
        content += `<button class="cancel-selection-button">Cancel Selection</button>`;
        display.innerHTML = content;

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