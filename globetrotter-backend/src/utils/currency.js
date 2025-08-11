// utils/currency.js
// Utility to fetch exchange rates and convert amounts
import fetch from 'node-fetch';

const BASE_URL = 'https://api.exchangerate.host/latest';

/**
 * Convert an amount from base currency to multiple currencies
 * @param {number} amount - The amount in base currency
 * @param {string} base - The base currency code (e.g., 'USD')
 * @param {string[]} targets - Array of target currency codes
 * @returns {Promise<Object>} - { USD: 123, EUR: 111, ... }
 */
export async function convertToCurrencies(amount, base = 'USD', targets = ['USD', 'EUR', 'INR']) {
  const symbols = targets.join(',');
  const url = `${BASE_URL}?base=${base}&symbols=${symbols}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch exchange rates');
  const data = await res.json();
  const rates = data.rates;
  const result = {};
  for (const cur of targets) {
    result[cur] = +(amount * (rates[cur] || 1)).toFixed(2);
  }
  return result;
}
