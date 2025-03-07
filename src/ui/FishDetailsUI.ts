import { Fish } from '../game/fish/Fish';
import { FishAbility } from '../game/abilities/FishAbility';

/**
 * UI for displaying detailed fish information
 */
export class FishDetailsUI {
    // DOM elements
    private detailsModal: HTMLElement | null = null;
    private overlay: HTMLElement | null = null;

    // Callback for ability activation
    private activateAbilityCallback: ((abilityId: string) => boolean) | null = null;

    /**
     * Show detailed information for a fish
     */
    showFishDetails(fish: Fish, ability: FishAbility | null = null): void {
        // Create overlay if it doesn't exist
        if (!this.overlay) {
            this.overlay = document.createElement('div');
            this.overlay.className = 'modal-overlay';

            // Add click handler to close when clicking outside
            this.overlay.addEventListener('click', (event) => {
                if (event.target === this.overlay) {
                    this.closeDetails();
                }
            });
        }

        // Create details modal
        const modal = document.createElement('div');
        modal.className = 'fish-details-modal';

        // Add fish details
        modal.innerHTML = `
            <div class="fish-details-header">
                <h3 class="${fish.rarity}">${fish.displayName}</h3>
                <button class="close-details-button">×</button>
            </div>
            
            <div class="fish-details-content">
                <div class="fish-details-section">
                    <h4>Basic Information</h4>
                    <div class="fish-detail-item">
                        <span class="detail-label">Species:</span>
                        <span class="detail-value">${fish.speciesName}</span>
                    </div>
                    <div class="fish-detail-item">
                        <span class="detail-label">Rarity:</span>
                        <span class="detail-value ${fish.rarity}">${fish.rarity.charAt(0).toUpperCase() + fish.rarity.slice(1)}</span>
                    </div>
                    <div class="fish-detail-item">
                        <span class="detail-label">Weight:</span>
                        <span class="detail-value">${fish.weight}kg</span>
                    </div>
                    <div class="fish-detail-item">
                        <span class="detail-label">Value:</span>
                        <span class="detail-value">$${fish.value}</span>
                    </div>
                    <div class="fish-detail-item">
                        <span class="detail-label">Caught At:</span>
                        <span class="detail-value">${fish.caughtDepth}m</span>
                    </div>
                    <div class="fish-detail-item">
                        <span class="detail-label">Caught On:</span>
                        <span class="detail-value">${fish.caughtAt.toLocaleDateString()}</span>
                    </div>
                </div>
                
                ${this.getAbilitySection(ability)}
                
                <div class="fish-details-section">
                    <h4>Actions</h4>
                    <div class="fish-actions-container">
                        <button class="sell-fish-button" data-fish-id="${fish.id}">Sell for $${fish.value}</button>
                        <button class="add-to-breeding-button" data-fish-id="${fish.id}">Use for Breeding</button>
                    </div>
                </div>
            </div>
        `;

        // Add close button handler
        const closeButton = modal.querySelector('.close-details-button');
        if (closeButton) {
            closeButton.addEventListener('click', () => {
                this.closeDetails();
            });
        }

        // Add ability button handler if ability exists
        if (ability) {
            const activateButton = modal.querySelector('.activate-ability-button');
            if (activateButton) {
                activateButton.addEventListener('click', () => {
                    if (this.activateAbilityCallback) {
                        const success = this.activateAbilityCallback(ability.id);
                        if (success) {
                            this.closeDetails();
                        }
                    }
                });

                // Disable button if on cooldown or already active
                if (ability.isOnCooldown() || (ability.isActiveNow() && !ability.isPassive)) {
                    (activateButton as HTMLButtonElement).disabled = true;
                }
            }
        }

        // Store reference to the modal
        this.detailsModal = modal;

        // Add modal to overlay
        this.overlay.innerHTML = '';
        this.overlay.appendChild(modal);

        // Add to DOM
        document.body.appendChild(this.overlay);

        // Add handlers for action buttons
        this.addActionButtonHandlers(modal);
    }

    /**
     * Generate HTML for ability section
     */
    private getAbilitySection(ability: FishAbility | null): string {
        if (!ability) {
            return `
            <div class="fish-details-section">
                <h4>Ability</h4>
                <div class="no-ability-message">This fish has no special abilities.</div>
            </div>
        `;
        }

        let statusText = '';
        let buttonText = 'Activate';
        let buttonDisabled = false;

        if (ability.isPassive) {
            statusText = 'Place in tank to activate';
            buttonText = 'Requires Tank';
            buttonDisabled = true;
        } else if (ability.isActiveNow()) {
            statusText = 'Currently Active';
            buttonText = 'Active';
            buttonDisabled = true;
        } else if (ability.isOnCooldown()) {
            const cooldownSeconds = Math.ceil(ability.getCooldownRemaining() / 1000);
            statusText = `On Cooldown (${cooldownSeconds}s remaining)`;
            buttonDisabled = true;
        }

        return `
        <div class="fish-details-section">
            <h4>Ability</h4>
            <div class="ability-info">
                <div class="ability-name">${ability.name}</div>
                <div class="ability-description">${ability.description}</div>
                <div class="ability-status">${statusText}</div>
            </div>
            <div class="ability-actions">
                <button class="activate-ability-button" data-ability-id="${ability.id}" ${buttonDisabled ? 'disabled' : ''}>
                    ${buttonText}
                </button>
            </div>
        </div>
    `;
    }

    /**
     * Close the details modal
     */
    closeDetails(): void {
        if (this.overlay && this.overlay.parentNode) {
            this.overlay.parentNode.removeChild(this.overlay);
        }

        this.detailsModal = null;
    }

    /**
     * Add handlers for action buttons
     */
    private addActionButtonHandlers(modal: HTMLElement): void {
        // Sell button
        const sellButton = modal.querySelector('.sell-fish-button');
        if (sellButton && this.sellFishCallback) {
            sellButton.addEventListener('click', () => {
                const fishId = (sellButton as HTMLElement).dataset.fishId;
                if (fishId && this.sellFishCallback) {
                    this.sellFishCallback(fishId);
                    this.closeDetails();
                }
            });
        }

        // Add to breeding button
        const breedingButton = modal.querySelector('.add-to-breeding-button');
        if (breedingButton && this.addToBreedingCallback) {
            breedingButton.addEventListener('click', () => {
                const fishId = (breedingButton as HTMLElement).dataset.fishId;
                if (fishId && this.addToBreedingCallback) {
                    this.addToBreedingCallback(fishId);
                    this.closeDetails();
                }
            });
        }
    }

    /**
     * Set callback for ability activation
     */
    setActivateAbilityCallback(callback: (abilityId: string) => boolean): void {
        this.activateAbilityCallback = callback;
    }

    /**
     * Callback for selling a fish
     */
    private sellFishCallback: ((fishId: string) => void) | null = null;

    /**
     * Set callback for selling a fish
     */
    setSellFishCallback(callback: (fishId: string) => void): void {
        this.sellFishCallback = callback;
    }

    /**
     * Callback for adding a fish to breeding
     */
    private addToBreedingCallback: ((fishId: string) => void) | null = null;

    /**
     * Set callback for adding a fish to breeding
     */
    setAddToBreedingCallback(callback: (fishId: string) => void): void {
        this.addToBreedingCallback = callback;
    }
}