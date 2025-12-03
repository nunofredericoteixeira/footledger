import { ethers } from 'ethers';

export interface WalletConnection {
  address: string;
  balance: string;
  connected: boolean;
}

const FOOTLEDGER_TOKEN_ADDRESS = '0x...'; // TODO: Add actual Footledger token contract address
const FOOTLEDGER_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
];

export async function connectWallet(): Promise<WalletConnection> {
  if (!window.ethereum) {
    throw new Error('MetaMask não está instalado. Por favor instale MetaMask para continuar.');
  }

  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const accounts = await provider.send('eth_requestAccounts', []);

    if (!accounts || accounts.length === 0) {
      throw new Error('Nenhuma conta encontrada. Por favor desbloqueie o MetaMask.');
    }

    const address = accounts[0];
    const balance = await getFootledgerBalance(address, provider);

    return {
      address,
      balance,
      connected: true,
    };
  } catch (error: any) {
    if (error.code === 4001) {
      throw new Error('Conexão rejeitada pelo utilizador.');
    }
    throw error;
  }
}

export async function getFootledgerBalance(address: string, provider?: ethers.BrowserProvider): Promise<string> {
  try {
    if (!provider && window.ethereum) {
      provider = new ethers.BrowserProvider(window.ethereum);
    }

    if (!provider) {
      return '0';
    }

    const contract = new ethers.Contract(FOOTLEDGER_TOKEN_ADDRESS, FOOTLEDGER_ABI, provider);
    const balance = await contract.balanceOf(address);
    const decimals = await contract.decimals();

    return ethers.formatUnits(balance, decimals);
  } catch (error) {
    console.error('Error fetching Footledger balance:', error);
    return '0';
  }
}

export async function isWalletConnected(): Promise<boolean> {
  if (!window.ethereum) {
    return false;
  }

  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const accounts = await provider.send('eth_accounts', []);
    return accounts && accounts.length > 0;
  } catch (error) {
    return false;
  }
}

export async function getCurrentWalletAddress(): Promise<string | null> {
  if (!window.ethereum) {
    return null;
  }

  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const accounts = await provider.send('eth_accounts', []);
    return accounts && accounts.length > 0 ? accounts[0] : null;
  } catch (error) {
    return null;
  }
}

declare global {
  interface Window {
    ethereum?: any;
  }
}
