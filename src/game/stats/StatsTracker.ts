// Updated StatsTracker.ts

import { Fish } from '../fish/Fish';
import { FishRarity } from '../../utils/Constants';
import { Achievement } from './Achievement';

/**
 * Tracks player statistics and achievements
 */
export class StatsTracker {
    // Game statistics
    private stats: Map<string, number> = new Map();

    // Track unique species caught (for layer requirements)
    private uniqueSpeciesCaught: Set<string> = new Set();

    // Available achievements
    private achievements: Map<string, Achievement> = new Map();

    // Event callbacks
    private onStatChanged: ((statName: string, value: number) => void)[] = [];
    private onAchievementUnlocked: ((achievement: Achievement) => void)[] = [];

    constructor() {
        this.initializeStats();
    }

    /**
     * Initialize default stats
     */
    private initializeStats(): void {
        // Fishing stats
        this.setStat('totalFishCaught', 0);
        this.setStat('commonFishCaught', 0);
        this.setStat('uncommonFishCaught', 0);
        this.setStat('rareFishCaught', 0);
        this.setStat('legendaryFishCaught', 0);
        this.setStat('mythicFishCaught', 0);
        this.setStat('uniqueSpeciesCaught', 0);

        // For each fish species (will be populated as fish are caught)

        // Depth stats
        this.setStat('maxDepthReached', 0);

        // Economy stats
        this.setStat('totalMoneyEarned', 0);
        this.setStat('totalMoneySpent', 0);

        // Breeding stats
        this.setStat('totalBreedingAttempts', 0);
        this.setStat('successfulBreeds', 0);
        this.setStat('totalOffspring', 0);
        this.setStat('mutationsObtained', 0);

        // Time stats
        this.setStat('totalPlayTime', 0); // in seconds

        // Abilities stats
        this.setStat('abilitiesActivated', 0);
    }

    /**
     * Get the value of a specific stat
     */
    getStat(statName: string): number {
        return this.stats.get(statName) || 0;
    }

    /**
     * Set the value of a specific stat
     */
    setStat(statName: string, value: number): void {
        this.stats.set(statName, value);
        this.notifyStatChanged(statName, value);
        this.checkAchievements(statName, value);
    }

    /**
     * Increment a stat by a given amount
     */
    incrementStat(statName: string, amount: number = 1): void {
        const currentValue = this.getStat(statName);
        this.setStat(statName, currentValue + amount);
    }

    /**
     * Get all stats
     */
    getAllStats(): Map<string, number> {
        return new Map(this.stats);
    }

    /**
     * Register a fish catch in the stats
     */
    registerFishCaught(fish: Fish): void {
        // Increment total fish caught
        this.incrementStat('totalFishCaught');

        // Increment rarity-specific count
        this.incrementStat(`${fish.rarity}FishCaught`);

        // Increment species-specific count
        const speciesStatName = `${fish.speciesId}Caught`;
        this.incrementStat(speciesStatName);

        // Track unique species caught
        if (!this.uniqueSpeciesCaught.has(fish.speciesId)) {
            this.uniqueSpeciesCaught.add(fish.speciesId);
            this.incrementStat('uniqueSpeciesCaught');
        }

        // Update max depth
        const currentMaxDepth = this.getStat('maxDepthReached');
        if (fish.caughtDepth > currentMaxDepth) {
            this.setStat('maxDepthReached', fish.caughtDepth);
        }
    }

    /**
     * Get all unique species ever caught
     */
    getUniqueSpeciesCaught(): Set<string> {
        return new Set(this.uniqueSpeciesCaught);
    }

    /**
     * Get count of unique species caught
     */
    getUniqueSpeciesCount(): number {
        return this.uniqueSpeciesCaught.size;
    }

    /**
     * Register money earned in the stats
     */
    registerMoneyEarned(amount: number): void {
        this.incrementStat('totalMoneyEarned', amount);
    }

    /**
     * Register money spent in the stats
     */
    registerMoneySpent(amount: number): void {
        this.incrementStat('totalMoneySpent', amount);
    }

    /**
     * Register a breeding attempt in the stats
     */
    registerBreedingAttempt(successful: boolean, offspringCount: number = 0, hasMutation: boolean = false): void {
        this.incrementStat('totalBreedingAttempts');

        if (successful) {
            this.incrementStat('successfulBreeds');
            this.incrementStat('totalOffspring', offspringCount);

            if (hasMutation) {
                this.incrementStat('mutationsObtained');
            }
        }
    }

    /**
     * Register ability activation in the stats
     */
    registerAbilityActivated(): void {
        this.incrementStat('abilitiesActivated');
    }

    /**
     * Update play time (call on game tick)
     */
    updatePlayTime(deltaTime: number): void {
        // Convert milliseconds to seconds
        const deltaSeconds = deltaTime / 1000;
        this.incrementStat('totalPlayTime', deltaSeconds);
    }

    /**
     * Add an achievement to the tracker
     */
    addAchievement(achievement: Achievement): void {
        this.achievements.set(achievement.id, achievement);
    }

    /**
     * Get all achievements
     */
    getAllAchievements(): Achievement[] {
        return Array.from(this.achievements.values());
    }

    /**
     * Get unlocked achievements
     */
    getUnlockedAchievements(): Achievement[] {
        return this.getAllAchievements().filter(achievement => achievement.isUnlocked);
    }

    /**
     * Check if any achievements should be unlocked
     */
    private checkAchievements(statName: string, value: number): void {
        for (const achievement of this.achievements.values()) {
            if (!achievement.isUnlocked && achievement.checkRequirement(statName, value)) {
                achievement.unlock();
                this.notifyAchievementUnlocked(achievement);
            }
        }
    }

    private checkAchievementsForStat(statName: string, value: number): void {
        let achievementUpdated = false;

        for (const achievement of this.achievements.values()) {
            if (!achievement.isUnlocked && achievement.checkRequirement(statName, value)) {
                achievement.unlock();
                this.notifyAchievementUnlocked(achievement);
                achievementUpdated = true;
            }
        }
    }

    /**
     * Register callback for stat changed event
     */
    registerStatChangedCallback(callback: (statName: string, value: number) => void): void {
        this.onStatChanged.push(callback);
    }

    /**
     * Register callback for achievement unlocked event
     */
    registerAchievementUnlockedCallback(callback: (achievement: Achievement) => void): void {
        this.onAchievementUnlocked.push(callback);
    }

    /**
     * Notify listeners that a stat has changed
     */
    private notifyStatChanged(statName: string, value: number): void {
        // Notify registered callbacks
        for (const callback of this.onStatChanged) {
            callback(statName, value);
        }

        // Check if any achievements should be unlocked based on this stat
        this.checkAchievementsForStat(statName, value);
    }


    /**
     * Notify listeners that an achievement was unlocked
     */
    private notifyAchievementUnlocked(achievement: Achievement): void {
        for (const callback of this.onAchievementUnlocked) {
            callback(achievement);
        }
    }

    /**
     * Serialize stats for saving
     */
    serialize(): object {
        return {
            stats: Object.fromEntries(this.stats),
            uniqueSpeciesCaught: Array.from(this.uniqueSpeciesCaught),
            achievements: Array.from(this.achievements.values()).map(achievement => achievement.serialize())
        };
    }

    /**
     * Deserialize stats from saved data
     */
    deserialize(data: any): void {
        if (!data) return;

        // Restore stats
        if (data.stats) {
            for (const [key, value] of Object.entries(data.stats)) {
                this.stats.set(key, value as number);
            }
        }

        // Restore unique species caught
        if (data.uniqueSpeciesCaught && Array.isArray(data.uniqueSpeciesCaught)) {
            this.uniqueSpeciesCaught = new Set(data.uniqueSpeciesCaught);
        }

        // Restore achievements (assumes achievements have already been added)
        if (data.achievements && Array.isArray(data.achievements)) {
            for (const achievementData of data.achievements) {
                const achievement = this.achievements.get(achievementData.id);
                if (achievement) {
                    achievement.deserialize(achievementData);
                }
            }
        }
    }
}