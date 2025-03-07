import { GameService } from './GameService';

/**
 * ServiceManager - Manages game services lifecycle
 *
 * Centralizes service initialization, updates, and access
 */
export class ServiceManager {
    // Registered services by type
    private services: Map<string, GameService> = new Map();

    /**
     * Register a service with the manager
     * @param serviceType Unique identifier for the service
     * @param service Service instance
     */
    registerService<T extends GameService>(serviceType: string, service: T): void {
        if (this.services.has(serviceType)) {
            console.warn(`Service type ${serviceType} already registered, overriding`);
        }

        this.services.set(serviceType, service);
    }

    /**
     * Get a registered service by type
     * @param serviceType Type of service to retrieve
     * @returns The service instance or undefined if not found
     */
    getService<T extends GameService>(serviceType: string): T | undefined {
        return this.services.get(serviceType) as T | undefined;
    }

    /**
     * Initialize all registered services
     */
    initializeServices(): void {
        for (const service of this.services.values()) {
            service.initialize();
        }
    }

    /**
     * Update all services
     * @param deltaTime Time since last update in milliseconds
     */
    updateServices(deltaTime: number): void {
        for (const service of this.services.values()) {
            service.update(deltaTime);
        }
    }

    /**
     * Serialize all services
     * @returns Object with serialized data from all services
     */
    serializeServices(): Record<string, any> {
        const serialized: Record<string, any> = {};

        for (const [serviceType, service] of this.services.entries()) {
            serialized[serviceType] = service.serialize();
        }

        return serialized;
    }

    /**
     * Deserialize data into services
     * @param data Object with serialized data for services
     */
    deserializeServices(data: Record<string, any>): void {
        if (!data) return;

        for (const [serviceType, serviceData] of Object.entries(data)) {
            const service = this.services.get(serviceType);
            if (service) {
                service.deserialize(serviceData);
            }
        }
    }
}