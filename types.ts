/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';

export interface Pokemon {
  id: number;
  name: string;
  types: string[];
}

export interface PokemonModelForm {
  name: string;
  model: string;
  formName: 'regular' | 'shiny';
}

export interface PokemonModelData {
  id: number;
  forms: PokemonModelForm[];
}

export interface ShinyPokemon {
  id: string;
  pokemonId: number;
  name: string;
  nickname?: string;
  date: string;
  encounters: number;
  method: string;
}

export interface NewsItem {
  category: string;
  title: string;
  description: string;
  timestamp: string;
  image: string;
  imageAlt: string;
  link: string;
}

export type Theme = {
  [key: string]: string;
};

export type AppMode = 'pokedex' | 'shiny-hunting' | 'team-builder' | 'battle-sim';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': React.HTMLAttributes<HTMLElement> & {
        src?: string;
        alt?: string;
        cameraControls?: boolean;
        autoRotate?: boolean;
        autoplay?: boolean;
        ar?: boolean;
        arModes?: string;
        cameraOrbit?: string;
        exposure?: string;
        shadowIntensity?: string;
        onError?: (event: React.SyntheticEvent<HTMLElement, Event>) => void;
      };
    }
  }
}