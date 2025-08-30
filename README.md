# Holo-Grid Pokédex

A futuristic Pokédex web application featuring a holographic, "glassmorphism" user interface for browsing and tracking Pokémon from all official regions.

## Features

- **Futuristic UI**: A responsive, holographic interface with a translucent "glass" theme that is fully customizable.
- **Complete National Pokédex**: Browse, search, and filter Pokémon from Kanto to Paldea.
- **On-Demand Data Loading**: The application starts with Kanto data and fetches subsequent regions as needed to ensure a fast initial load.
- **Global Search**: Instantly find any Pokémon by its name or National Pokédex number.
- **Advanced Filtering**: Filter the grid by region and Pokémon type.
- **Progress Tracking**: Mark Pokémon as "Seen" or "Caught" and track your collection progress for each region.
- **Detailed Profiles**: View in-depth information for each Pokémon, including:
  - High-resolution sprites (with a shiny toggle).
  - Pokédex entries from the games.
  - A visual stats radar chart.
  - The complete evolution chain with evolution methods.
  - Authentic Pokémon cries.
- **Favorites System**: Mark your favorite Pokémon for quick access from the navigation panel.
- **Live News Feed**: Stay updated with the latest videos from the official Pokémon YouTube channel.
- **Powerful Theme Editor**:
  - Customize every color, font, and background image in the UI.
  - Save your custom themes as presets.
  - Load built-in and user-created presets.
  - Import and export themes as JSON files to share with others.

## Tech Stack

- **React 19**: For building the user interface.
- **TypeScript**: For type safety and improved developer experience.
- **Modern CSS**: Extensive use of CSS Custom Properties (Variables) for dynamic theming, along with Flexbox and Grid for layout.
- **No Build Step**: The project uses ES Modules directly in the browser via `importmap` for a simple, dependency-free setup.

## Data Sources

- **Pokémon Data**: Core data (ID, name, types) is stored locally within the `data/` directory. Detailed profile information (Pokédex entries, stats, evolution chains) is fetched from the [PokéAPI](https://pokeapi.co/).
- **News Feed**: The news panel is powered by the RSS feed from the [Official Pokémon YouTube Channel](https://www.youtube.com/c/pokemon).

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
├── components/         # Reusable React components
│   ├── Navigation.tsx
│   ├── PokemonGrid.tsx
│   ├── Profile.tsx
│   └── ...
├── data/               # Static Pokémon data
│   ├── regions/        # Data separated by region
│   └── pokemon.ts      # Aggregates all regional data
├── App.tsx             # Main application component, manages state
├── index.css           # Global styles and theme variables
├── index.html          # HTML entry point with importmap
├── index.tsx           # React root renderer
├── README.md           # This file
└── types.ts            # TypeScript type definitions
```

## License

This project is licensed under the Apache-2.0 License. See the license headers in the source files for more details.
