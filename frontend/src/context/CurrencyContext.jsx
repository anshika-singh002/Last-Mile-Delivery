import React, { createContext, useContext, useState, useEffect } from 'react';

const CURRENCIES = {
  USD: { code: 'USD', symbol: '$', rate: 1.0, name: 'US Dollar' },
  EUR: { code: 'EUR', symbol: '€', rate: 0.92, name: 'Euro' },
  GBP: { code: 'GBP', symbol: '£', rate: 0.79, name: 'British Pound' },
  INR: { code: 'INR', symbol: '₹', rate: 83.5, name: 'Indian Rupee' },
  CAD: { code: 'CAD', symbol: 'CA$', rate: 1.36, name: 'Canadian Dollar' },
  AUD: { code: 'AUD', symbol: 'A$', rate: 1.52, name: 'Australian Dollar' },
  JPY: { code: 'JPY', symbol: '¥', rate: 155.0, name: 'Japanese Yen' }
};

const CurrencyContext = createContext();

export const CurrencyProvider = ({ children }) => {
  const [currencyCode, setCurrencyCode] = useState(() => {
    return localStorage.getItem('delivery_currency') || 'USD';
  });

  const currency = CURRENCIES[currencyCode] || CURRENCIES.USD;

  const changeCurrency = (code) => {
    if (CURRENCIES[code]) {
      setCurrencyCode(code);
      localStorage.setItem('delivery_currency', code);
    }
  };

  const formatPrice = (amountInUSD) => {
    if (amountInUSD == null || isNaN(amountInUSD)) return `${currency.symbol}0.00`;
    const converted = amountInUSD * currency.rate;
    
    // JPY doesn't typically use decimals
    if (currency.code === 'JPY') {
      return `${currency.symbol}${Math.round(converted).toLocaleString()}`;
    }

    return `${currency.symbol}${converted.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        currencyCode,
        changeCurrency,
        formatPrice,
        currencies: Object.values(CURRENCIES)
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => useContext(CurrencyContext);
