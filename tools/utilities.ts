import axios, { AxiosResponse } from 'axios';
import axiosRetry, { exponentialDelay } from 'axios-retry';

declare const ContractError;

export function isArweaveAddress(address: string) {
  const trimmedAddress = address.toString().trim();
  if (!/[a-z0-9_-]{43}/i.test(trimmedAddress)) {
    throw new ContractError('Invalid Arweave address.');
  }
  return trimmedAddress;
}

export function isipV4Address(ipV4Address: string) {
  if (
    /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(
      ipV4Address,
    )
  ) {
    return true;
  }
  alert('You have entered an invalid IP address!');
  return false;
}

export function getTotalSupply(state: any) {
  let totalSupply = 0;
  for (const key of Object.keys(state.balances)) {
    totalSupply += state.balances[key];
  }
  return totalSupply;
}

export async function retryFetch(reqURL: string): Promise<AxiosResponse<any>> {
  const axiosInstance = axios.create();
  const maxRetries = 10;
  axiosRetry(axiosInstance, {
    retries: maxRetries,
    retryDelay: (retryNumber) => {
      console.error(
        `Retry attempt ${retryNumber}/${maxRetries} of request to ${reqURL}`,
      );
      return exponentialDelay(retryNumber);
    },
  });
  return await axiosInstance.get(reqURL, {
    responseType: 'arraybuffer',
  });
}

// Gets the latest block height
export async function getCurrentBlockHeight() {
  let height = 0;
  try {
    const response = await retryFetch(`https://arweave.net/height`);
    height = await response.data;
    return height;
  } catch (err) {
    console.error(err);
  }
  return height;
}