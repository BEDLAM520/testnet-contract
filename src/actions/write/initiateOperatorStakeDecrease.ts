import { NETWORK_LEAVING_STATUS } from '../../constants';
import { ContractResult, IOState, PstAction } from '../../types';

declare const ContractError;
declare const SmartWeave: any;

// Begins the process to unlocks the vault of a gateway operator
export const initiateOperatorStakeDecrease = async (
  state: IOState,
  { caller, input }: PstAction,
): Promise<ContractResult> => {
  const { settings, gateways = {} } = state;
  const { registry: registrySettings } = settings;
  // TODO: object parse validation
  const { qty } = input as any;

  if (!(caller in gateways)) {
    throw new ContractError("This Gateway's wallet is not registered");
  }

  if (gateways[caller].status === NETWORK_LEAVING_STATUS) {
    throw new ContractError(
      'This Gateway is in the process of leaving the network and cannot have its stake adjusted',
    );
  }

  if (!Number.isInteger(qty) || qty <= 0) {
    throw new ContractError(
      'Invalid value for "qty". Must be an integer greater than zero',
    );
  }

  if (
    gateways[caller].operatorStake - qty <
    registrySettings.minNetworkJoinStakeAmount
  ) {
    throw new ContractError(
      `${qty} is not enough operator stake to maintain the minimum of ${registrySettings.minNetworkJoinStakeAmount}`,
    );
  }

  // Remove the tokens from the operator stake
  gateways[caller].operatorStake -= qty;

  // Add tokens to a vault that unlocks after the withdrawal period ends
  gateways[caller].vaults.push({
    balance: qty,
    start: +SmartWeave.block.height,
    end:
      +SmartWeave.block.height + registrySettings.operatorStakeWithdrawLength,
  });

  // update state
  state.gateways = gateways;
  return { state };
};
