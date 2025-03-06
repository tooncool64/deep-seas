/**
 * Economy System
 *
 * Manages the player's currency and transactions
 */
export class Economy {
    // Current money amount
    private _money: number;

    // Event callbacks
    private onMoneyChanged: ((money: number) => void)[] = [];

    constructor(initialMoney: number = 0) {
        this._money = initialMoney;
    }

    /**
     * Get current money amount
     */
    get money(): number {
        return this._money;
    }

    /**
     * Add money to the player's balance
     */
    addMoney(amount: number): void {
        if (amount <= 0) return;

        this._money += amount;
        this.notifyMoneyChanged();
    }

    /**
     * Spend money if player has enough
     * @returns true if transaction was successful, false if not enough money
     */
    spendMoney(amount: number): boolean {
        if (amount <= 0) return true;
        if (this._money < amount) return false;

        this._money -= amount;
        this.notifyMoneyChanged();
        return true;
    }

    /**
     * Check if player can afford an amount
     */
    canAfford(amount: number): boolean {
        return this._money >= amount;
    }

    /**
     * Format money amount as currency string
     */
    formatMoney(amount: number = this._money): string {
        return `$${amount.toFixed(2)}`;
    }

    /**
     * Register a callback for when money amount changes
     */
    registerMoneyChangedCallback(callback: (money: number) => void): void {
        this.onMoneyChanged.push(callback);
    }

    /**
     * Notify all callbacks that money amount has changed
     */
    private notifyMoneyChanged(): void {
        for (const callback of this.onMoneyChanged) {
            callback(this._money);
        }
    }

    /**
     * Set money amount directly (for loading saved game)
     */
    setMoney(amount: number): void {
        this._money = amount;
        this.notifyMoneyChanged();
    }

    /**
     * Serialize economy data for saving
     */
    serialize(): object {
        return {
            money: this._money
        };
    }

    /**
     * Deserialize economy from saved data
     */
    static deserialize(data: any): Economy {
        const economy = new Economy();

        if (data && typeof data.money === 'number') {
            economy.setMoney(data.money);
        }

        return economy;
    }
}