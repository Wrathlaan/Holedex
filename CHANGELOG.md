# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2024-07-26

### Added

-   **Brand New "Item Dex" Mode**: A comprehensive database for all in-game items, featuring a robust master-detail layout, filtering by category, and detailed information panels.
-   **Brand New "Move Dex" Mode**: A complete database of all Pokémon moves, with a master-detail layout, filtering by type and damage class, and detailed information panels.
-   **Gemini-Powered "Notable Users"**: In the Move Dex detail view, Gemini now suggests iconic Pokémon known for using the selected move effectively in battle, complete with their sprites.
-   **Gemini-Powered "Suggest Build"**: The Team Builder now features a "Suggest Build" button that uses Gemini to generate a complete, competitive build for a Pokémon, including its ability, held item, nature, EV spread, moveset, and a strategic analysis.

### Changed

-   **UI/UX Overhaul for Item & Move Dex**: Completely rebuilt the previously unusable Item Dex and Move Dex. Replaced the broken, collapsing list views with stable, beautiful, and highly functional two-panel interfaces that are easy to navigate and use.
-   Refactored all data fetching, caching, and state management for the Item and Move Dex to support the new, feature-rich interfaces.

## [1.0.0] - 2024-07-25

### Added

-   **Initial Release**: First version of the Holodex application.
-   **Pokédex Mode**: Browse all Pokémon with regional and type-based filtering. Includes progress tracking (seen/caught), a favorites system, and detailed entry pages with stats, evolution chains, and cries.
-   **Shiny Hunting Mode**: Track multiple shiny hunts with encounter counters, odds calculation (with Shiny Charm support), a "Trophy Case" for logged shinies, shareable cards, and a streamer overlay.
-   **Team Builder Mode**: A foundational system for creating and managing Pokémon teams.
-   **Training Mode**: A dedicated view for competitive training, featuring a Gemini-powered Stat Scanner to extract Pokémon data from screenshots.
-   **Battle Simulator**: Placeholder for the future battle simulation feature.
-   **Settings Panel**: Configure app appearance (theme, text size) and connection to the Google Gemini API (API Key and OAuth 2.0 supported).
-   **Live News Feed**: A panel displaying the latest videos from the official Pokémon YouTube channel.
