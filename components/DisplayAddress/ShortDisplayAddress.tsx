import { EtherscanAddressLink } from 'components/EtherscanLink';
import { ethers } from 'ethers';
import React, {
  FunctionComponent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useTooltipState, TooltipReference } from 'reakit/Tooltip';
import { Tooltip } from 'components/Tooltip';
import { useAccount } from 'wagmi';
import { useJsonRpcProvider } from 'hooks/useSignerOrProvider';

interface ShortDisplayAddress {
  address: string;
}

function useAddressRepresentation(address: string) {
  const { address: connectedAddress } = useAccount();
  const provider = useJsonRpcProvider();
  const [rendered, setRendered] = useState({ shortened: '...', base: address });

  const isConnectedAddress = useMemo(() => {
    if (!connectedAddress) return false;
    return address.toLowerCase() == connectedAddress.toLowerCase();
  }, [address, connectedAddress]);

  const representAddress = useCallback(async () => {
    const ens = await provider.lookupAddress(address);
    const base = ens ?? ethers.utils.getAddress(address);
    setRendered({
      base,
      shortened: isConnectedAddress ? 'You' : shortenAddress(base),
    });
  }, [address, isConnectedAddress, provider]);

  useEffect(() => {
    representAddress();
  }, [representAddress]);

  return rendered;
}

export const ShortDisplayAddress: FunctionComponent<ShortDisplayAddress> = ({
  address,
}) => {
  const addressTooltip = useTooltipState();
  const { base, shortened } = useAddressRepresentation(address);
  return (
    <div>
      <TooltipReference {...addressTooltip}>
        <EtherscanAddressLink address={address}>
          <span>{shortened}</span>
        </EtherscanAddressLink>
      </TooltipReference>
      <Tooltip {...addressTooltip}>{base}</Tooltip>
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