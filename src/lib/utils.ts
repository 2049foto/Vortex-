import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Mock data for the app
export const MOCK_TOKENS = [
  {
    id: "eth",
    symbol: "ETH",
    name: "Ethereum",
    balance: "1.45",
    valueUsd: 3245.50,
    price: 2238.27,
    chain: "Base",
    tier: "LEGIT",
    riskScore: 5,
    logo: "https://cryptologos.cc/logos/ethereum-eth-logo.png"
  },
  {
    id: "usdc",
    symbol: "USDC",
    name: "USD Coin",
    balance: "450.00",
    valueUsd: 450.00,
    price: 1.00,
    chain: "Base",
    tier: "LEGIT",
    riskScore: 2,
    logo: "https://cryptologos.cc/logos/usd-coin-usdc-logo.png"
  },
  {
    id: "pepe",
    symbol: "PEPE",
    name: "Pepe",
    balance: "5000000",
    valueUsd: 8.50,
    price: 0.0000017,
    chain: "Base",
    tier: "DUST",
    riskScore: 35,
    logo: "https://cryptologos.cc/logos/pepe-pepe-logo.png"
  },
  {
    id: "doge-elon",
    symbol: "ELON",
    name: "Dogelon Mars",
    balance: "10000000",
    valueUsd: 2.15,
    price: 0.000000215,
    chain: "Base",
    tier: "DUST",
    riskScore: 42,
    logo: "" 
  },
  {
    id: "safemoon-v9",
    symbol: "SAFE",
    name: "SafeMoon V9",
    balance: "1000",
    valueUsd: 0.05,
    price: 0.00005,
    chain: "Base",
    tier: "MICRODUST",
    riskScore: 65,
    logo: ""
  },
  {
    id: "scam-token",
    symbol: "WIN",
    name: "Winner Token",
    balance: "100",
    valueUsd: 0,
    price: 0,
    chain: "Base",
    tier: "RISK",
    riskScore: 98,
    logo: ""
  }
];
