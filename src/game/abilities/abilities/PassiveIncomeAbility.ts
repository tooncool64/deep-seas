import { FishAbility } from '../FishAbility';

/**
 * Ability that generates passive income over time
 */
export class PassiveIncomeAbility extends FishAbility {
    // Amount of income generated per second
    readonly incomeRate: number;

    // Time tracking for income generation
    private lastIncomeTime: number = 0;

    // Callback for adding money to the economy
    private onGenerateIncome: ((amount: number) => void) | null = null;

    constructor(
        id: string,
        name: string,
        description: string,
        incomeRate: number
    ) {
        // All passive income abilities are passive (no activation needed)
        super(id, name, description, true, 0);
        this.incomeRate = incomeRate;
        this.lastIncomeTime = Date.now();
    }

    /**
     * Set callback for income generation
     */
    setIncomeCallback(callback: (amount: number) => void): void {
        this.onGenerateIncome = callback;
    }

    /**
     * Called when ability is activated
     */
    protected onActivate(): void {
        this.lastIncomeTime = Date.now();
    }

    /**
     * Called when ability is deactivated
     */
    protected onDeactivate(): void {
        // Nothing needed for deactivation
    }

    /**
     * Update to generate income over time
     */
    protected onUpdate(deltaTime: number): void {
        if (!this.isActiveNow() || !this.onGenerateIncome) {
            return;
        }

        // Calculate income based on time elapsed
        const income = (this.incomeRate * deltaTime) / 1000; // Convert to seconds

        if (income > 0) {
            this.onGenerateIncome(income);
        }
    }

    /**
     * Serialize for saving
     */
    serialize(): object {
        return {
            ...super.serialize(),
            incomeRate: this.incomeRate,
            lastIncomeTime: this.lastIncomeTime
        };
    }

    /**
     * Deserialize from saved data
     */
    deserialize(data: any): void {
        super.deserialize(data);

        if (data && typeof data.lastIncomeTime === 'number') {
            this.lastIncomeTime = data.lastIncomeTime;
        }
    }
}