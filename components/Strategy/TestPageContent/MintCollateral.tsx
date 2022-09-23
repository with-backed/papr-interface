import { Fieldset } from 'components/Fieldset';
import { useCallback, useEffect, useState } from 'react';
import { ERC721, MockCollateral__factory } from 'types/generated/abis';
import { useAccount, useSigner } from 'wagmi';

type MintCollateralProps = {
  token: ERC721;
};

export default function MintCollateral({ token }: MintCollateralProps) {
  const [balance, setBalance] = useState<string>('');
  const { address } = useAccount();
  const { data: signer } = useSigner();

  const getBalance = useCallback(async () => {
    if (address) {
      const b = await token.balanceOf(address);
      setBalance(b.toString());
    }
  }, [address, token]);

  const mint = useCallback(async () => {
    if (signer == null || address == null) {
      console.log('address or sigenr null');
      return;
    }
    const contract = MockCollateral__factory.connect(token.address, signer);
    const t = await contract.mint(address);
    await t.wait();
    getBalance();
  }, [address, getBalance, token, signer]);

  useEffect(() => {
    getBalance();
  }, [getBalance]);

  return (
    <Fieldset legend={`➕ Mint yourself ${token.symbol}`}>
      <p> your balance: {balance || 'not connected'} </p>
      <button disabled={!address} onClick={mint}>
        mint
      </button>
    </Fieldset>
  );
}
