import { FishAbility } from '../FishAbility';

/**
 * Ability that boosts catch rate (reduces catch time)
 */
export class CatchRateAbility extends FishAbility {
    // Amount to boost catch rate by (percentage as decimal, e.g., 0.2 = 20% faster)
    readonly boostAmount: number;

    // Duration of boost in milliseconds (0 for permanent)
    private duration: number;

    constructor(
        id: string,
        name: string,
        description: string,
        boostAmount: number,
        isPassive: boolean = false,
        duration: number = 0
    ) {
        super(id, name, description, isPassive, isPassive ? 0 : 240000); // 4 minute cooldown for active abilities
        this.boostAmount = boostAmount;
        this.duration = duration;
    }

    /**
     * Get ability duration
     */
    getDuration(): number {
        return this.duration;
    }

    /**
     * Called when ability is activated
     */
    protected onActivate(): void {
        // Activation logic is handled by AbilityManager
    }

    /**
     * Called when ability is deactivated
     */
    protected onDeactivate(): void {
        // Deactivation logic is handled by AbilityManager
    }

    /**
     * Serialize for saving
     */
    serialize(): object {
        return {
            ...super.serialize(),
            boostAmount: this.boostAmount,
            duration: this.duration
        };
    }
}