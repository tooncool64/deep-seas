import { FishAbility } from './FishAbility';
import { Fish } from '../fish/Fish';
import { PassiveIncomeAbility } from './abilities/PassiveIncomeAbility';
import { FishingBoostAbility } from './abilities/FishingBoostAbility';
import { CatchRateAbility } from './abilities/CatchRateAbility';
import { RarityBoostAbility } from './abilities/RarityBoostAbility';
import { generateId } from '../../utils/Random';

/**
 * Manages fish abilities and their effects
 */
export class AbilityManager {
    // Active abilities
    private abilities: Map<string, FishAbility> = new Map();

    // Fish that provide abilities
    private abilityFish: Map<string, string> = new Map(); // Fish ID -> Ability ID

    // Currently active ability buffs
    private activeBuffs: Map<string, number> = new Map();

    // Event callbacks
    private onAbilityActivated: ((ability: FishAbility) => void)[] = [];
    private onAbilityDeactivated: ((ability: FishAbility) => void)[] = [];
    private onBuffsChanged: ((buffs: Map<string, number>) => void)[] = [];

    constructor() {
        // Initialize buffs
        this.resetBuffs();
    }

    /**
     * Reset all buffs to default values
     */
    private resetBuffs(): void {
        this.activeBuffs.clear();

        // Set default values (no buffs)
        this.activeBuffs.set('fishingPowerBonus', 0);
        this.activeBuffs.set('catchRateBonus', 0);
        this.activeBuffs.set('rarityChanceBonus', 0);
        this.activeBuffs.set('moneyMultiplier', 1);
        this.activeBuffs.set('passiveIncome', 0);
        this.activeBuffs.set('breedingEfficiencyBonus', 0);

        // Notify listeners
        this.notifyBuffsChanged();
    }

    /**
     * Get current value of a specific buff
     */
    getBuffValue(buffName: string): number {
        return this.activeBuffs.get(buffName) || 0;
    }

    /**
     * Get a map of all current buffs
     */
    getAllBuffs(): Map<string, number> {
        return new Map(this.activeBuffs);
    }

    /**
     * Process a fish to determine if it has abilities
     * @returns ability ID if the fish has an ability, null otherwise
     */
    processFish(fish: Fish): string | null {
        // Check if this fish already has an assigned ability
        if (this.abilityFish.has(fish.id)) {
            return this.abilityFish.get(fish.id) || null;
        }

        // Determine if fish should have an ability based on species and rarity
        const ability = this.createAbilityForFish(fish);

        if (!ability) {
            return null;
        }

        // Store the ability
        const abilityId = ability.id;
        this.abilities.set(abilityId, ability);
        this.abilityFish.set(fish.id, abilityId);

        // Activate passive abilities automatically
        if (ability.isPassive) {
            ability.activate();
            this.notifyAbilityActivated(ability);
            this.updateBuffsFromAbilities();
        }

        return abilityId;
    }

    /**
     * Create an appropriate ability for a fish based on species and rarity
     */
    private createAbilityForFish(fish: Fish): FishAbility | null {
        // For now, just a simple mapping of certain species to abilities
        // This will be expanded in the future with more sophisticated matching

        const abilityId = generateId('ability-');

        // Surface fish abilities
        if (fish.speciesId === 'sunfish' && fish.rarity !== 'common') {
            return new PassiveIncomeAbility(
                abilityId,
                'Solar Income',
                `Generates ${this.getAbilityValueForRarity(fish.rarity, 0.1, 2)} money per second`,
                this.getAbilityValueForRarity(fish.rarity, 0.1, 2)
            );
        }

        if (fish.speciesId === 'bass' && fish.rarity !== 'common') {
            return new FishingBoostAbility(
                abilityId,
                'Bass Boost',
                `Increases fishing power by ${this.getAbilityValueForRarity(fish.rarity, 1, 5)}`,
                this.getAbilityValueForRarity(fish.rarity, 1, 5),
                false,
                60000 // 1 minute duration
            );
        }

        if (fish.speciesId === 'salmon' && fish.rarity !== 'common') {
            return new CatchRateAbility(
                abilityId,
                'Swift Current',
                `Increases catch rate by ${this.getAbilityValueForRarity(fish.rarity, 0.2, 1.0) * 100}%`,
                this.getAbilityValueForRarity(fish.rarity, 0.2, 1.0),
                false,
                60000 // 1 minute duration
            );
        }

        if (fish.speciesId === 'catfish' && fish.rarity !== 'common') {
            return new RarityBoostAbility(
                abilityId,
                'Lucky Whiskers',
                `Increases rare fish chance by ${this.getAbilityValueForRarity(fish.rarity, 0.05, 0.25) * 100}%`,
                this.getAbilityValueForRarity(fish.rarity, 0.05, 0.25),
                false,
                120000 // 2 minute duration
            );
        }

        // Deep sea fish abilities - more will be added as game expands
        if (fish.speciesId === 'anglerfish') {
            return new FishingBoostAbility(
                abilityId,
                'Lure Light',
                `Increases fishing power by ${this.getAbilityValueForRarity(fish.rarity, 2, 10)}`,
                this.getAbilityValueForRarity(fish.rarity, 2, 10),
                false,
                90000 // 1.5 minute duration
            );
        }

        if (fish.speciesId === 'bioluminescent_jellyfish') {
            return new PassiveIncomeAbility(
                abilityId,
                'Glowing Income',
                `Generates ${this.getAbilityValueForRarity(fish.rarity, 0.3, 5)} money per second`,
                this.getAbilityValueForRarity(fish.rarity, 0.3, 5)
            );
        }

        // No ability for this fish
        return null;
    }

    /**
     * Calculate ability value based on fish rarity
     */
    private getAbilityValueForRarity(
        rarity: string,
        baseValue: number,
        maxValue: number
    ): number {
        const rarityMultipliers: Record<string, number> = {
            'common': 1,
            'uncommon': 1.5,
            'rare': 2.5,
            'legendary': 4,
            'mythic': 8
        };

        const multiplier = rarityMultipliers[rarity] || 1;
        const value = baseValue * multiplier;

        // Cap at max value
        return Math.min(value, maxValue);
    }

    /**
     * Activate an ability by ID
     * @returns true if activation was successful
     */
    activateAbility(abilityId: string): boolean {
        const ability = this.abilities.get(abilityId);

        if (!ability) {
            return false;
        }

        const success = ability.activate();

        if (success) {
            this.notifyAbilityActivated(ability);
            this.updateBuffsFromAbilities();
        }

        return success;
    }

    /**
     * Deactivate an ability by ID
     */
    deactivateAbility(abilityId: string): boolean {
        const ability = this.abilities.get(abilityId);

        if (!ability || !ability.isActiveNow()) {
            return false;
        }

        ability.deactivate();
        this.notifyAbilityDeactivated(ability);
        this.updateBuffsFromAbilities();

        return true;
    }

    /**
     * Get all abilities
     */
    getAllAbilities(): FishAbility[] {
        return Array.from(this.abilities.values());
    }

    /**
     * Get active abilities
     */
    getActiveAbilities(): FishAbility[] {
        return this.getAllAbilities().filter(ability => ability.isActiveNow());
    }

    /**
     * Get ability by ID
     */
    getAbility(abilityId: string): FishAbility | undefined {
        return this.abilities.get(abilityId);
    }

    /**
     * Get ability for a specific fish
     */
    getAbilityForFish(fishId: string): FishAbility | undefined {
        const abilityId = this.abilityFish.get(fishId);

        if (!abilityId) {
            return undefined;
        }

        return this.abilities.get(abilityId);
    }

    /**
     * Remove abilities from a fish (when fish is removed)
     */
    removeFishAbility(fishId: string): void {
        const abilityId = this.abilityFish.get(fishId);

        if (!abilityId) {
            return;
        }

        const ability = this.abilities.get(abilityId);

        if (ability) {
            // Deactivate the ability if it's active
            if (ability.isActiveNow()) {
                ability.deactivate();
                this.notifyAbilityDeactivated(ability);
            }

            // Remove the ability
            this.abilities.delete(abilityId);
        }

        // Remove fish-ability mapping
        this.abilityFish.delete(fishId);

        // Update buffs
        this.updateBuffsFromAbilities();
    }

    /**
     * Update all active buffs based on active abilities
     */
    private updateBuffsFromAbilities(): void {
        // Reset buffs to default
        this.resetBuffs();

        // Apply all active ability effects
        for (const ability of this.getActiveAbilities()) {
            this.applyAbilityBuffs(ability);
        }

        // Notify listeners
        this.notifyBuffsChanged();
    }

    /**
     * Apply buffs from a specific ability
     */
    private applyAbilityBuffs(ability: FishAbility): void {
        // This is a simple implementation that will be expanded
        // as more ability types are added

        if (ability instanceof PassiveIncomeAbility) {
            const currentIncome = this.activeBuffs.get('passiveIncome') || 0;
            this.activeBuffs.set('passiveIncome', currentIncome + ability.incomeRate);
        }
        else if (ability instanceof FishingBoostAbility) {
            const currentBonus = this.activeBuffs.get('fishingPowerBonus') || 0;
            this.activeBuffs.set('fishingPowerBonus', currentBonus + ability.boostAmount);
        }
        else if (ability instanceof CatchRateAbility) {
            const currentBonus = this.activeBuffs.get('catchRateBonus') || 0;
            this.activeBuffs.set('catchRateBonus', currentBonus + ability.boostAmount);
        }
        else if (ability instanceof RarityBoostAbility) {
            const currentBonus = this.activeBuffs.get('rarityChanceBonus') || 0;
            this.activeBuffs.set('rarityChanceBonus', currentBonus + ability.boostAmount);
        }
    }

    /**
     * Update abilities (call on game tick)
     */
    update(deltaTime: number): void {
        let needsBuffUpdate = false;

        // Update all abilities
        for (const ability of this.abilities.values()) {
            const wasActive = ability.isActiveNow();
            ability.update(deltaTime);
            const isNowActive = ability.isActiveNow();

            // Check if active state changed
            if (wasActive !== isNowActive) {
                needsBuffUpdate = true;

                if (isNowActive) {
                    this.notifyAbilityActivated(ability);
                } else {
                    this.notifyAbilityDeactivated(ability);
                }
            }
        }

        // Update buffs if any ability state changed
        if (needsBuffUpdate) {
            this.updateBuffsFromAbilities();
        }
    }

    /**
     * Register callback for ability activation
     */
    registerAbilityActivatedCallback(callback: (ability: FishAbility) => void): void {
        this.onAbilityActivated.push(callback);
    }

    /**
     * Register callback for ability deactivation
     */
    registerAbilityDeactivatedCallback(callback: (ability: FishAbility) => void): void {
        this.onAbilityDeactivated.push(callback);
    }

    /**
     * Register callback for buffs changed
     */
    registerBuffsChangedCallback(callback: (buffs: Map<string, number>) => void): void {
        this.onBuffsChanged.push(callback);
    }

    /**
     * Notify listeners about ability activation
     */
    private notifyAbilityActivated(ability: FishAbility): void {
        for (const callback of this.onAbilityActivated) {
            callback(ability);
        }
    }

    /**
     * Notify listeners about ability deactivation
     */
    private notifyAbilityDeactivated(ability: FishAbility): void {
        for (const callback of this.onAbilityDeactivated) {
            callback(ability);
        }
    }

    /**
     * Notify listeners about buffs changed
     */
    private notifyBuffsChanged(): void {
        for (const callback of this.onBuffsChanged) {
            callback(this.activeBuffs);
        }
    }

    /**
     * Serialize ability manager for saving
     */
    serialize(): object {
        const serializedAbilities: Record<string, any> = {};

        for (const [id, ability] of this.abilities.entries()) {
            serializedAbilities[id] = ability.serialize();
        }

        return {
            abilities: serializedAbilities,
            abilityFish: Object.fromEntries(this.abilityFish),
            activeBuffs: Object.fromEntries(this.activeBuffs)
        };
    }

    /**
     * Deserialize ability manager from saved data
     */
    deserialize(data: any): void {
        if (!data) return;

        // Clear current data
        this.abilities.clear();
        this.abilityFish.clear();
        this.resetBuffs();

        // Restore ability-fish mappings
        if (data.abilityFish) {
            for (const [fishId, abilityId] of Object.entries(data.abilityFish)) {
                this.abilityFish.set(fishId, abilityId as string);
            }
        }

        // Note: This is a simplified implementation. In a real scenario,
        // you would need to reconstruct the actual ability objects with their proper types.
        // This would typically involve storing the ability type in the serialized data
        // and using a factory pattern to recreate the correct ability subclass.
    }
}