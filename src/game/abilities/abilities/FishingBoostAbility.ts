import { FishAbility } from '../FishAbility';

/**
 * Ability that boosts fishing power
 */
export class FishingBoostAbility extends FishAbility {
    // Amount to boost fishing power by
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
        super(id, name, description, isPassive, isPassive ? 0 : 300000); // 5 minute cooldown for active abilities
        this.boostAmount = boostAmount;
        this.duration = duration;
    }

    /**
     * Get the ability type name for serialization
     */
    getTypeName(): string {
        return 'FishingBoostAbility';
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

    /**
     * Deserialize from saved data
     */
    deserialize(data: any): void {
        super.deserialize(data);

        // No additional deserialization needed for this class
        // since duration is immutable after construction
    }
}