import { UpgradeType } from '../../utils/Constants';

/**
 * Upgrade data interface
 */
export interface UpgradeData {
    id: string;
    name: string;
    description: string;
    type: UpgradeType;
    cost: number;
    value: number;
    maxLevel: number;
}

/**
 * Represents a purchasable upgrade
 */
export class Upgrade {
    // Basic properties
    id: string;
    name: string;
    description: string;
    type: UpgradeType;
    baseCost: number;
    value: number;
    maxLevel: number;

    // Current level of the upgrade
    private _level: number = 0;

    // Cost scaling factor (can be adjusted for balance)
    private costScalingFactor: number = 1.5;

    constructor(data: UpgradeData) {
        this.id = data.id;
        this.name = data.name;
        this.description = data.description;
        this.type = data.type;
        this.baseCost = data.cost;
        this.value = data.value;
        this.maxLevel = data.maxLevel;
    }

    /**
     * Get current level of the upgrade
     */
    get level(): number {
        return this._level;
    }

    /**
     * Get cost of the next level
     */
    get nextCost(): number {
        if (this.isMaxLevel()) {
            return Infinity;
        }

        return Math.round(this.baseCost * Math.pow(this.costScalingFactor, this._level));
    }

    /**
     * Get total value provided by this upgrade at current level
     */
    get totalValue(): number {
        return this.value * this._level;
    }

    /**
     * Check if upgrade is at maximum level
     */
    isMaxLevel(): boolean {
        return this._level >= this.maxLevel;
    }

    /**
     * Increase upgrade level
     * @returns true if successful, false if already at max level
     */
    upgrade(): boolean {
        if (this.isMaxLevel()) {
            return false;
        }

        this._level++;
        return true;
    }

    /**
     * Set upgrade level directly (for loading saved game)
     */
    setLevel(level: number): void {
        this._level = Math.min(level, this.maxLevel);
    }

    /**
     * Get display text for the upgrade
     */
    get displayText(): string {
        return `${this.name} (Level ${this._level}/${this.maxLevel})
${this.description}
Current bonus: ${this.formatValue(this.totalValue)}
Next level: ${this.isMaxLevel() ? 'MAX' : this.formatValue(this.value)}
Cost: ${this.isMaxLevel() ? 'MAX' : `$${this.nextCost}`}`;
    }

    /**
     * Format the upgrade value based on type
     */
    private formatValue(value: number): string {
        switch (this.type) {
            case UpgradeType.FISHING_POWER:
                return `+${value} Fishing Power`;
            case UpgradeType.LINE_STRENGTH:
                return `+${value} Line Strength`;
            case UpgradeType.DEPTH_ACCESS:
                return `+${value}m Depth`;
            case UpgradeType.TANK_CAPACITY:
                return `+${value} Tank Capacity`;
            case UpgradeType.CATCH_SPEED:
                return `${(value * 100).toFixed(0)}% Faster Catch`;
            default:
                return `+${value}`;
        }
    }

    /**
     * Serialize upgrade for saving
     */
    serialize(): object {
        return {
            id: this.id,
            level: this._level
        };
    }

    /**
     * Create a copy of this upgrade
     */
    clone(): Upgrade {
        const clone = new Upgrade({
            id: this.id,
            name: this.name,
            description: this.description,
            type: this.type,
            cost: this.baseCost,
            value: this.value,
            maxLevel: this.maxLevel
        });

        clone.setLevel(this._level);
        return clone;
    }
}