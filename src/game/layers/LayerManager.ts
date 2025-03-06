import { DepthLayer } from '../../utils/Constants';
import { FishManager } from '../fish/FishManager';
import { SurfaceLayer } from './SurfaceLayer';

/**
 * Interface that all depth layers must implement
 */
export interface Layer {
    id: string;
    name: string;
    minDepth: number;
    maxDepth: number;
    isUnlocked: boolean;

    // Initialize the layer
    initialize(): void;

    // Check if a depth is within this layer's range
    containsDepth(depth: number): boolean;

    // Generate a fish at the given depth
    generateFish(depth: number, fishingPower: number, rarityBoost?: number): any;

    // Calculate catch time based on depth and speed bonus
    calculateCatchTime(depth: number, catchSpeedBonus: number): number;

    // Serialize layer for saving
    serialize(): object;

    // Deserialize layer from saved data
    deserialize(data: any): void;
}

/**
 * Manages the different depth layers in the game
 */
export class LayerManager {
    // Available layers
    private layers: Map<string, Layer> = new Map();

    // Currently active layer
    private activeLayerId: string | null = null;

    // Reference to fish manager
    private fishManager: FishManager;

    constructor(fishManager: FishManager) {
        this.fishManager = fishManager;
        this.initializeLayers();
    }

    /**
     * Initialize available layers
     */
    private initializeLayers(): void {
        // Add surface layer (always unlocked by default)
        const surfaceLayer = new SurfaceLayer(this.fishManager);
        surfaceLayer.initialize();
        this.layers.set(surfaceLayer.id, surfaceLayer);
        this.activeLayerId = surfaceLayer.id;

        // Additional layers will be added in future development cycles
    }

    /**
     * Get all available layers
     */
    getLayers(): Layer[] {
        return Array.from(this.layers.values());
    }

    /**
     * Get a specific layer by ID
     */
    getLayer(layerId: string): Layer | undefined {
        return this.layers.get(layerId);
    }

    /**
     * Get the currently active layer
     */
    getActiveLayer(): Layer | null {
        if (!this.activeLayerId) return null;
        return this.layers.get(this.activeLayerId) || null;
    }

    /**
     * Set the active layer
     */
    setActiveLayer(layerId: string): boolean {
        const layer = this.layers.get(layerId);

        if (!layer || !layer.isUnlocked) {
            return false;
        }

        this.activeLayerId = layerId;
        return true;
    }

    /**
     * Get the layer that contains a specific depth
     */
    getLayerForDepth(depth: number): Layer | null {
        for (const layer of this.layers.values()) {
            if (layer.isUnlocked && layer.containsDepth(depth)) {
                return layer;
            }
        }

        return null;
    }

    /**
     * Unlock a layer
     */
    unlockLayer(layerId: string): boolean {
        const layer = this.layers.get(layerId);

        if (!layer) {
            return false;
        }

        // Set layer as unlocked
        (layer as any).isUnlocked = true;
        return true;
    }

    /**
     * Add a new layer to the game
     * This allows for easy expansion in future development cycles
     */
    addLayer(layer: Layer): void {
        this.layers.set(layer.id, layer);
    }

    /**
     * Serialize layer manager for saving
     */
    serialize(): object {
        const serializedLayers: any = {};

        for (const [id, layer] of this.layers.entries()) {
            serializedLayers[id] = layer.serialize();
        }

        return {
            activeLayerId: this.activeLayerId,
            layers: serializedLayers
        };
    }

    /**
     * Deserialize layer manager from saved data
     */
    static deserialize(data: any, fishManager: FishManager): LayerManager {
        const manager = new LayerManager(fishManager);

        // Restore layer data
        if (data.layers) {
            for (const layerId in data.layers) {
                const layer = manager.getLayer(layerId);
                if (layer) {
                    layer.deserialize(data.layers[layerId]);
                }
            }
        }

        // Restore active layer
        if (data.activeLayerId) {
            manager.setActiveLayer(data.activeLayerId);
        }

        return manager;
    }
}