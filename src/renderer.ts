import { Game } from './game/Game';

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', () => {
    // Initialize game
    const game = new Game();

    // Store game instance on window for debugging
    (window as any).game = game;
});
