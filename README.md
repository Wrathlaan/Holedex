# Holo-Grid Pokédex

A futuristic Pokédex web application featuring a holographic, "glassmorphism" user interface for browsing and managing all aspects of your Pokémon journey.

## Features

-   **Futuristic UI**: A responsive, holographic interface with a translucent "glass" theme.
-   **Complete National Pokédex**: Browse, search, and filter Pokémon from Kanto to Paldea. Detailed profiles include sprites (with shiny toggle), stats, evolution chains, and authentic cries.
-   **Progress Tracking**: Mark Pokémon as "Seen" or "Caught" and track your collection progress for each region.
-   **Advanced Filtering**: Filter the Pokédex grid by region and Pokémon type.
-   **Favorites System**: Mark your favorite Pokémon for quick access.
-   **Shiny Hunting Mode**: A dedicated interface for tracking shiny hunts. Features include:
    -   Multiple concurrent hunts.
    -   Encounter counters and odds calculators (with Shiny Charm support).
    -   A "Trophy Case" to log and display all your shiny Pokémon.
    -   Shareable shiny cards and a real-time streamer overlay.
-   **Team Builder Mode**: Create and manage competitive teams.
    -   **Gemini-Powered Build Suggestions**: Instantly generate a full competitive build (moves, ability, item, nature, EVs) for any Pokémon on your team.
-   **In-Depth Training Mode**:
    -   **Gemini-Powered Training Plans**: Generate a complete competitive training plan for any Pokémon, including an analysis, EV spread, and an in-game guide for training in the latest games.
    -   **Stat Scanner**: Use your device's camera or upload a screenshot to automatically extract a Pokémon's stats, nature, IVs, and more using Gemini's multimodal capabilities.
-   **Item & Move Dex**:
    -   Browse, search, and filter a comprehensive database of all items and moves.
    -   Beautifully designed master-detail interfaces for easy navigation.
    -   **Gemini-Powered Insights**: The Move Dex shows "Notable Users" for each move, suggesting Pokémon known for using it effectively.
-   **Settings & Configuration**:
    -   Configure your connection to the Gemini API using either an API Key or Google OAuth 2.0.
    -   Customize the app's appearance with theme and text size options.
-   **Live News Feed**: Stay updated with the latest videos from the official Pokémon YouTube channel.

## Tech Stack

-   **React 19**: For building the user interface.
-   **TypeScript**: For type safety and improved developer experience.
-   **@google/genai**: The Google Gemini SDK for powering intelligent, generative AI features.
-   **Modern CSS**: Extensive use of CSS Custom Properties (Variables) for dynamic theming, along with Flexbox and Grid for layout.
-   **No Build Step**: The project uses ES Modules directly in the browser via `importmap` for a simple, dependency-free setup.

## Data Sources

-   **Pokémon Data**: Core data is stored locally. Detailed profile information is fetched from the [PokéAPI](https://pokeapi.co/).
-   **AI Features**: Powered by the Google Gemini API.
-   **News Feed**: Powered by the RSS feed from the [Official Pokémon YouTube Channel](https://www.youtube.com/c/pokemon).

## Getting Started

This project is configured to run without any build tools like Webpack or Vite.

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd <repository-directory>
    ```

2.  **Serve the project:**
    You need to serve the files from a local web server. Opening `index.html` directly from the file system will not work due to browser security restrictions on ES Modules.

    A simple way to do this is with the `http.server` module if you have Python installed:
    ```bash
    # For Python 3
    python -m http.server

    # For Python 2
    python -m SimpleHTTPServer
    ```
    Alternatively, you can use a tool like `live-server` for VS Code or any other static file server.

3.  **Open in your browser:**
    Navigate to the local address provided by your server (e.g., `http://localhost:8000`).

## Project Structure

```
.
├── components/         # Common reusable components
│   └── ...
├── data/               # Static Pokémon data
├── hooks/              # Custom React hooks for logic and state
├── lib/                # Core logic (Gemini API, prompts)
├── modes/              # Top-level components for each app mode
│   ├── item_dex/
│   ├── move_dex/
│   ├── pokedex/
│   ├── shiny_hunting/
│   ├── team_builder/
│   └── training/
├── App.tsx             # Main application component, manages state and views
├── index.css           # Global styles and theme variables
├── index.html          # HTML entry point with importmap
├── index.tsx           # React root renderer
├── README.md           # This file
├── CHANGELOG.md        # Version history
└── types.ts            # TypeScript type definitions
```

## License

This project is licensed under the Apache-2.0 License. See the license headers in the source files for more details.
