/**
 * GameService - Base class for all game service classes
 *
 * Provides common functionality and interface for game services
 */
export abstract class GameService {
    /**
     * Initialize the service
     */
    abstract initialize(): void;

    /**
     * Update the service (called on game tick)
     * @param deltaTime Time since last update in milliseconds
     */
    abstract update(deltaTime: number): void;

    /**
     * Serialize service data for saving
     */
    abstract serialize(): object;

    /**
     * Deserialize service from saved data
     */
    abstract deserialize(data: any): void;
}