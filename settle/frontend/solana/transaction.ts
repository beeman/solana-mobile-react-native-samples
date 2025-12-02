import axios from 'axios';
import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';
import { SOLANA_RPC_ENDPOINT } from '@/constants/wallet';
import { isValidAddress } from '@/utils/address';

const COINGECKO_PRICE_API = 'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd';

export interface SendSolResult {
  success: boolean;
  signature?: string;
  message?: string;
}

/**
 * Fetches the current SOL to USD conversion rate from CoinGecko
 */
export const getSolToUsdRate = async (): Promise<number> => {
  try {
    const response = await axios.get(COINGECKO_PRICE_API);
    const rate = response.data.solana.usd;
    if (!rate) {
      throw new Error('Could not fetch SOL to USD rate.');
    }
    console.log(`Current SOL/USD rate: ${rate}`);
    return rate;
  } catch (error) {
    console.error('Error fetching SOL to USD rate:', error);
    const fallbackRate = 50; // Example fallback
    console.warn(`Using fallback SOL/USD rate: ${fallbackRate}`);
    return fallbackRate;
  }
};

/**
 * Converts a USD amount to its SOL equivalent
 */
export const convertUsdToSol = (amountInUsd: number, solToUsdRate: number): number => {
  if (solToUsdRate <= 0) return 0;
  return amountInUsd / solToUsdRate;
};

/**
 * Converts a SOL amount to its USD equivalent
 */
export const convertSolToUsd = (amountInSol: number, solToUsdRate: number): number => {
  return amountInSol * solToUsdRate;
};


/**
 * Send SOL to another wallet address
 * @param fromAddress - Sender's wallet address (pubkey)
 * @param toAddress - Recipient's wallet address (pubkey)
 * @param amountInUsd - Amount in USD to send
 * @param signAndSend - Function to sign and send the transaction
 * @returns Transaction signature if successful
 */
export const sendSol = async (
  fromAddress: string,
  toAddress: string,
  amountInUsd: number,
  signAndSend: (transaction: Transaction) => Promise<Uint8Array>
): Promise<SendSolResult> => {
  if (!isValidAddress(fromAddress)) {
    throw new Error('Your wallet address is invalid. Please reconnect your wallet.');
  }

  if (!isValidAddress(toAddress)) {
    throw new Error(
      'Invalid recipient wallet address. The address must be a valid Solana public key (base58 encoded, 32-44 characters).'
    );
  }

  const solPriceInUsd = await getSolToUsdRate();
  if (!solPriceInUsd) {
    throw new Error('Could not determine SOL to USD conversion rate.');
  }

  const amountInSol = convertUsdToSol(amountInUsd, solPriceInUsd);

  const connection = new Connection(SOLANA_RPC_ENDPOINT, 'confirmed');

  const fromPubkey = new PublicKey(fromAddress);
  const toPubkey = new PublicKey(toAddress);

  const lamports = Math.floor(amountInSol * LAMPORTS_PER_SOL);

  console.log('Creating SOL transfer transaction:', {
    from: fromPubkey.toBase58(),
    to: toPubkey.toBase58(),
    amountInUsd,
    amountInSol,
    lamports,
  });

  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();

  const transferInstruction = SystemProgram.transfer({
    fromPubkey,
    toPubkey,
    lamports,
  });

  const transaction = new Transaction({
    feePayer: fromPubkey,
    blockhash,
    lastValidBlockHeight,
  }).add(transferInstruction);

  try {
    const signature = await signAndSend(transaction);
    console.log('Transaction sent successfully:', signature);

    // Confirm transaction
    const confirmation = await connection.confirmTransaction({
      signature,
      blockhash,
      lastValidBlockHeight,
    });

    if (confirmation.value.err) {
      throw new Error('Transaction failed: ' + JSON.stringify(confirmation.value.err));
    }

    return {
      success: true,
      signature,
      message: 'Payment sent successfully',
    };
  } catch (error: any) {
    console.error('Send SOL error:', error);
    return {
      success: false,
      message: error.message || 'Failed to send payment',
    };
  }
};

/**
 * Get SOL balance for an address
 */
export const getSolBalance = async (address: string): Promise<number> => {
  try {
    const connection = new Connection(SOLANA_RPC_ENDPOINT, 'confirmed');
    const pubkey = new PublicKey(address);
    const balance = await connection.getBalance(pubkey);
    return balance / LAMPORTS_PER_SOL;
  } catch (error) {
    console.error('Get balance error:', error);
    return 0;
  }
};
