/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

/**
 * Calculates the cumulative probability of finding a shiny Pokémon.
 * @param odds The denominator of the shiny chance (e.g., 4096).
 * @param encounters The number of encounters.
 * @returns The cumulative probability as a percentage.
 */
export const calculateCumulativeProbability = (odds: number, encounters: number): number => {
  if (encounters <= 0 || odds <= 0) return 0;
  const probabilityOfNoShiny = Math.pow(1 - (1 / odds), encounters);
  const probabilityOfShiny = 1 - probabilityOfNoShiny;
  return probabilityOfShiny * 100;
};
