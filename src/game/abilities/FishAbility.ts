/**
 * Base class for all fish abilities
 */
export abstract class FishAbility {
    // Basic properties
    id: string;
    name: string;
    description: string;
    isPassive: boolean;
    cooldownTime: number; // in milliseconds, 0 for passive abilities

    // Current state
    private isActive: boolean = false;
    private cooldownRemaining: number = 0;
    private lastActivationTime: number = 0;

    constructor(
        id: string,
        name: string,
        description: string,
        isPassive: boolean = false,
        cooldownTime: number = 0
    ) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.isPassive = isPassive;
        this.cooldownTime = cooldownTime;

        // Auto-activate passive abilities
        if (this.isPassive) {
            this.activate();
        }
    }

    /**
     * Get the ability type name (for serialization)
     * Should be overridden by subclasses
     */
    getTypeName(): string {
        return 'FishAbility';
    }

    /**
     * Activate the ability
     * @returns true if activation was successful
     */
    activate(): boolean {
        // Check if ability is on cooldown
        if (this.isOnCooldown()) {
            return false;
        }

        // Already active
        if (this.isActive) {
            return true;
        }

        // Activate the ability
        this.isActive = true;
        this.lastActivationTime = Date.now();

        // Apply ability effect
        this.onActivate();

        // Start cooldown for non-passive abilities
        if (!this.isPassive) {
            this.cooldownRemaining = this.cooldownTime;
        }

        return true;
    }

    /**
     * Deactivate the ability
     */
    deactivate(): void {
        if (!this.isActive) {
            return;
        }

        this.isActive = false;

        // Remove ability effect
        this.onDeactivate();
    }

    /**
     * Check if ability is currently active
     */
    isActiveNow(): boolean {
        return this.isActive;
    }

    /**
     * Check if ability is on cooldown
     */
    isOnCooldown(): boolean {
        return this.cooldownRemaining > 0;
    }

    /**
     * Get remaining cooldown time in milliseconds
     */
    getCooldownRemaining(): number {
        return this.cooldownRemaining;
    }

    /**
     * Update ability state (called on game tick)
     * @param deltaTime Time since last update in milliseconds
     */
    update(deltaTime: number): void {
        // Update cooldown
        if (this.cooldownRemaining > 0) {
            this.cooldownRemaining = Math.max(0, this.cooldownRemaining - deltaTime);
        }

        // Update active effect for non-passive abilities with duration
        if (this.isActive && !this.isPassive && this.getDuration() > 0) {
            const elapsedTime = Date.now() - this.lastActivationTime;

            // Deactivate if duration has expired
            if (elapsedTime >= this.getDuration()) {
                this.deactivate();
            }
        }

        // Call ability-specific update
        this.onUpdate(deltaTime);
    }

    /**
     * Get ability duration in milliseconds (0 for permanent/passive)
     */
    getDuration(): number {
        return 0; // Base implementation, override in subclasses if needed
    }

    /**
     * Called when ability is activated
     */
    protected abstract onActivate(): void;

    /**
     * Called when ability is deactivated
     */
    protected abstract onDeactivate(): void;

    /**
     * Called during update cycle
     */
    protected onUpdate(deltaTime: number): void {
        // Base implementation does nothing, override in subclasses if needed
    }

    /**
     * Serialize ability for saving
     */
    serialize(): object {
        return {
            id: this.id,
            type: this.getTypeName(), // Include type name for reconstruction
            name: this.name,
            description: this.description,
            isPassive: this.isPassive,
            cooldownTime: this.cooldownTime,
            isActive: this.isActive,
            cooldownRemaining: this.cooldownRemaining,
            lastActivationTime: this.lastActivationTime
        };
    }

    /**
     * Apply saved state to ability
     */
    deserialize(data: any): void {
        if (data) {
            this.isActive = data.isActive || false;
            this.cooldownRemaining = data.cooldownRemaining || 0;
            this.lastActivationTime = data.lastActivationTime || 0;

            // Re-apply effect if active
            if (this.isActive) {
                this.onActivate();
            }
        }
    }
}