import { Fieldset } from 'components/Fieldset';
import { ERC721Token } from 'lib/strategies';
import { useCallback, useEffect, useState } from 'react';
import { MockCollateral__factory } from 'types/generated/abis';
import { useAccount, useSigner } from 'wagmi';

type MintCollateralProps = {
  token: ERC721Token;
};

export default function MintCollateral({ token }: MintCollateralProps) {
  const [balance, setBalance] = useState<string>('');
  const { address } = useAccount();
  const { data: signer } = useSigner();

  const getBalance = useCallback(async () => {
    if (address) {
      const b = await token.contract.balanceOf(address);
      setBalance(b.toString());
    }
  }, [address, token]);

  const mint = useCallback(async () => {
    if (signer == null || address == null) {
      console.log('address or sigenr null');
      return;
    }
    const contract = MockCollateral__factory.connect(
      token.contract.address,
      signer,
    );
    const t = await contract.mint(address);
    t.wait();
    getBalance();
  }, [address, getBalance, token, signer]);

  useEffect(() => {
    getBalance();
  });

  return (
    <Fieldset legend={`➕ Mint yourself ${token.symbol}`}>
      <p> your balance: {balance || 'not connected'} </p>
      <button disabled={!address} onClick={mint}>
        mint
      </button>
    </Fieldset>
  );
}
