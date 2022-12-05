import { EtherscanAddressLink } from 'components/EtherscanLink';
import { ethers } from 'ethers';
import { useAsyncValue } from 'hooks/useAsyncValue';
import { addressToENS } from 'lib/account';
import React, { FunctionComponent, useMemo } from 'react';
import { useTooltipState, TooltipReference } from 'reakit/Tooltip';
import { Tooltip } from 'components/Tooltip';
import { useAccount } from 'wagmi';

interface ShortDisplayAddress {
  address: string;
}

export const ShortDisplayAddress: FunctionComponent<ShortDisplayAddress> = ({
  address,
}) => {
  const addressTooltip = useTooltipState();
  const connectedAddress = useAccount().address;
  const isConnectedAddress = useMemo(() => {
    if (!connectedAddress) return false;
    return address.toLowerCase() == connectedAddress.toLowerCase();
  }, [address, connectedAddress]);
  const ensOrAddress = useAsyncValue(async () => {
    if (isConnectedAddress) return 'You';

    const ens = await addressToENS(address);
    return ens ?? ethers.utils.getAddress(address);
  }, [address, isConnectedAddress]);

  const formattedEnsOrAddress = useMemo(() => {
    if (!ensOrAddress) return '...';
    if (isConnectedAddress) return ensOrAddress;

    return shortenAddress(ensOrAddress);
  }, [ensOrAddress, isConnectedAddress]);
  return (
    <div>
      <TooltipReference {...addressTooltip}>
        <EtherscanAddressLink address={address}>
          <span>{formattedEnsOrAddress}</span>
        </EtherscanAddressLink>
      </TooltipReference>
      <Tooltip {...addressTooltip}>{ensOrAddress}</Tooltip>
    </div>
  );
};

const shortenAddress = (address: string) => {
  if (address.length < 9) {
    return address;
  } else {
    return address.substring(0, 8) + '...';
  }
};
