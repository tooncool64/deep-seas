import { GameService } from './GameService';
import { Economy } from './economy/Economy';
import { AbilityManager } from './abilities/AbilityManager';
import { StatsTracker } from './stats/StatsTracker';
import { Fish } from './fish/Fish';

/**
 * EconomyService - Handles game economy
 */
export class EconomyService extends GameService {
    // Core dependencies
    private economy: Economy;
    private abilityManager: AbilityManager;
    private statsTracker: StatsTracker;

    // Event callbacks
    private onFishSold: ((fish: Fish, value: number) => void)[] = [];
    private onMoneyChanged: ((money: number) => void)[] = [];

    constructor(
        economy: Economy,
        abilityManager: AbilityManager,
        statsTracker: StatsTracker
    ) {
        super();
        this.economy = economy;
        this.abilityManager = abilityManager;
        this.statsTracker = statsTracker;
    }

    /**
     * Initialize the service
     */
    initialize(): void {
        // Register for economy callbacks
        this.economy.registerMoneyChangedCallback((money) => {
            this.notifyMoneyChanged(money);
        });
    }

    /**
     * Update the service (called on game tick)
     * @param deltaTime Time since last update in milliseconds
     */
    update(deltaTime: number): void {
        // Apply passive income from abilities
        const passiveIncome = this.abilityManager.getBuffValue('passiveIncome');
        if (passiveIncome > 0) {
            // Convert to amount per frame
            const incomeThisFrame = (passiveIncome * deltaTime) / 1000;
            if (incomeThisFrame > 0) {
                this.economy.addMoney(incomeThisFrame);
                this.statsTracker.registerMoneyEarned(incomeThisFrame);
            }
        }
    }

    /**
     * Get current money amount
     */
    getMoney(): number {
        return this.economy.money;
    }

    /**
     * Add money to the player's balance
     */
    addMoney(amount: number): void {
        if (amount <= 0) return;

        this.economy.addMoney(amount);
        this.statsTracker.registerMoneyEarned(amount);
    }

    /**
     * Spend money if player has enough
     * @returns true if transaction was successful, false if not enough money
     */
    spendMoney(amount: number): boolean {
        if (amount <= 0) return true;

        const success = this.economy.spendMoney(amount);

        if (success) {
            this.statsTracker.registerMoneySpent(amount);
        }

        return success;
    }

    /**
     * Check if player can afford an amount
     */
    canAfford(amount: number): boolean {
        return this.economy.canAfford(amount);
    }

    /**
     * Sell a fish for money
     */
    sellFish(fish: Fish): number {
        // Apply money multiplier from abilities
        const moneyMultiplier = this.abilityManager.getBuffValue('moneyMultiplier');
        const finalValue = Math.round(fish.value * moneyMultiplier);

        // Add money from fish value
        this.economy.addMoney(finalValue);

        // Track money earned
        this.statsTracker.registerMoneyEarned(finalValue);

        // Notify listeners
        this.notifyFishSold(fish, finalValue);

        return finalValue;
    }

    /**
     * Format money as string
     */
    formatMoney(amount: number = this.economy.money): string {
        return this.economy.formatMoney(amount);
    }

    /**
     * Register callback for when a fish is sold
     */
    registerFishSoldCallback(callback: (fish: Fish, value: number) => void): void {
        this.onFishSold.push(callback);
    }

    /**
     * Register callback for when money changes
     */
    registerMoneyChangedCallback(callback: (money: number) => void): void {
        this.onMoneyChanged.push(callback);
    }

    /**
     * Notify callbacks when a fish is sold
     */
    private notifyFishSold(fish: Fish, value: number): void {
        for (const callback of this.onFishSold) {
            callback(fish, value);
        }
    }

    /**
     * Notify callbacks when money changes
     */
    private notifyMoneyChanged(money: number): void {
        for (const callback of this.onMoneyChanged) {
            callback(money);
        }
    }

    /**
     * Serialize service for saving
     */
    serialize(): object {
        return {
            money: this.economy.money
        };
    }

    /**
     * Deserialize service from saved data
     */
    deserialize(data: any): void {
        if (!data) return;

        if (typeof data.money === 'number') {
            this.economy.setMoney(data.money);
        }
    }
}