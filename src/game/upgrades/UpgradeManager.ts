import { Upgrade, UpgradeData } from './Upgrade';
import { INITIAL_UPGRADES, UpgradeType } from '../../utils/Constants';
import { Economy } from '../economy/Economy';

/**
 * Manages available upgrades and handles purchasing
 */
export class UpgradeManager {
  // Available upgrades
  private upgrades: Map<string, Upgrade> = new Map();

  // Reference to economy for transactions
  private economy: Economy;

  // Event callbacks
  private onUpgradePurchased: ((upgrade: Upgrade) => void)[] = [];

  constructor(economy: Economy) {
    this.economy = economy;
    this.initializeUpgrades();
  }

  /**
   * Initialize the available upgrades
   */
  private initializeUpgrades(): void {
    // Load initial upgrades
    for (const upgradeData of INITIAL_UPGRADES) {
      const upgrade = new Upgrade(upgradeData);
      this.upgrades.set(upgrade.id, upgrade);
    }

    // Additional upgrades will be added in future development cycles
  }

  /**
   * Get all available upgrades
   */
  getUpgrades(): Upgrade[] {
    return Array.from(this.upgrades.values());
  }

  /**
   * Get a specific upgrade by ID
   */
  getUpgrade(upgradeId: string): Upgrade | undefined {
    return this.upgrades.get(upgradeId);
  }

  /**
   * Purchase an upgrade if player can afford it
   * @returns true if purchase was successful
   */
  purchaseUpgrade(upgradeId: string): boolean {
    const upgrade = this.upgrades.get(upgradeId);

    if (!upgrade) {
      return false; // Upgrade not found
    }

    if (upgrade.isMaxLevel()) {
      return false; // Already at max level
    }

    const cost = upgrade.nextCost;

    if (!this.economy.canAfford(cost)) {
      return false; // Not enough money
    }

    // Process transaction
    if (this.economy.spendMoney(cost)) {
      upgrade.upgrade();
      this.notifyUpgradePurchased(upgrade);
      return true;
    }

    return false;
  }

  /**
   * Register a callback for when an upgrade is purchased
   */
  registerUpgradePurchasedCallback(callback: (upgrade: Upgrade) => void): void {
    this.onUpgradePurchased.push(callback);
  }

  /**
   * Notify all callbacks that an upgrade was purchased
   */
  private notifyUpgradePurchased(upgrade: Upgrade): void {
    for (const callback of this.onUpgradePurchased) {
      callback(upgrade);
    }
  }

  /**
   * Get total bonus for a specific upgrade type
   */
  getTotalBonusForType(type: UpgradeType): number {
    let total = 0;

    for (const upgrade of this.upgrades.values()) {
      if (upgrade.type === type) {
        total += upgrade.totalValue;
      }
    }

    return total;
  }

  /**
   * Add a new upgrade to the available upgrades
   * This allows for easy expansion in future development cycles
   */
  addUpgrade(upgradeData: UpgradeData): void {
    const upgrade = new Upgrade(upgradeData);
    this.upgrades.set(upgrade.id, upgrade);
  }

  /**
   * Serialize upgrade manager for saving
   */
  serialize(): object {
    const serializedUpgrades = Array.from(this.upgrades.entries()).map(
      ([id, upgrade]) => upgrade.serialize()
    );

    return {
      upgrades: serializedUpgrades
    };
  }

  /**
   * Deserialize upgrade manager from saved data
   */
  static deserialize(data: any, economy: Economy): UpgradeManager {
    const manager = new UpgradeManager(economy);

    // Restore upgrade levels
    if (data.upgrades && Array.isArray(data.upgrades)) {
      for (const upgradeData of data.upgrades) {
        const upgrade = manager.getUpgrade(upgradeData.id);
        if (upgrade) {
          upgrade.setLevel(upgradeData.level);
        }
      }
    }

    return manager;
  }
}