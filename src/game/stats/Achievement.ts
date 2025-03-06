/**
 * Represents a game achievement
 */
export class Achievement {
    // Basic properties
    id: string;
    name: string;
    description: string;

    // Achievement state
    isUnlocked: boolean = false;
    unlockedAt: Date | null = null;

    // Requirements
    private requirements: Map<string, number> = new Map();

    // Reward callback
    private onUnlock: (() => void) | null = null;

    constructor(id: string, name: string, description: string) {
        this.id = id;
        this.name = name;
        this.description = description;
    }

    /**
     * Add a requirement to unlock this achievement
     * @param statName Name of the stat to check
     * @param requiredValue Value that the stat must meet or exceed
     */
    addRequirement(statName: string, requiredValue: number): void {
        this.requirements.set(statName, requiredValue);
    }

    /**
     * Set the callback to call when achievement is unlocked
     */
    setUnlockCallback(callback: () => void): void {
        this.onUnlock = callback;
    }

    /**
     * Check if a specific requirement is met
     */
    checkRequirement(statName: string, currentValue: number): boolean {
        // If already unlocked, no need to check
        if (this.isUnlocked) {
            return true;
        }

        // If this achievement doesn't depend on this stat, return false
        if (!this.requirements.has(statName)) {
            return false;
        }

        // Check if requirement is met
        const requiredValue = this.requirements.get(statName)!;
        const isMet = currentValue >= requiredValue;

        // If all requirements are met, unlock achievement
        if (isMet && this.areAllRequirementsMet(statName, currentValue)) {
            return true;
        }

        return false;
    }

    /**
     * Check if all requirements are met
     * @param updatedStatName Name of the stat that was just updated
     * @param updatedValue New value of the updated stat
     */
    private areAllRequirementsMet(updatedStatName: string, updatedValue: number): boolean {
        // For now, we only support single-requirement achievements
        // This will be expanded in future development cycles
        return true;
    }

    /**
     * Unlock the achievement
     */
    unlock(): void {
        if (this.isUnlocked) {
            return;
        }

        this.isUnlocked = true;
        this.unlockedAt = new Date();

        // Call unlock callback if set
        if (this.onUnlock) {
            this.onUnlock();
        }
    }

    /**
     * Get a description of the requirements
     */
    getRequirementsDescription(): string {
        const descriptions: string[] = [];

        for (const [statName, requiredValue] of this.requirements.entries()) {
            descriptions.push(`${this.formatStatName(statName)}: ${requiredValue}`);
        }

        return descriptions.join(', ');
    }

    /**
     * Format stat name for display
     */
    private formatStatName(statName: string): string {
        // Convert camelCase to space-separated words with first letter capitalized
        return statName
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase());
    }

    /**
     * Serialize achievement for saving
     */
    serialize(): object {
        return {
            id: this.id,
            isUnlocked: this.isUnlocked,
            unlockedAt: this.unlockedAt ? this.unlockedAt.toISOString() : null
        };
    }

    /**
     * Deserialize achievement from saved data
     */
    deserialize(data: any): void {
        if (data) {
            this.isUnlocked = data.isUnlocked || false;
            this.unlockedAt = data.unlockedAt ? new Date(data.unlockedAt) : null;
        }
    }
}