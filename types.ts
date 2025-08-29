/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

export interface Pokemon {
  id: number;
  name: string;
  types: string[];
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
