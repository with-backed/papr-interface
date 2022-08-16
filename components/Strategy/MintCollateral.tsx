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
    const b = await token.contract.balanceOf(address!);
    setBalance(b.toString());
  }, [address]);

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
  }, [address, signer]);

  useEffect(() => {
    getBalance();
  });

  return (
    <fieldset>
      <legend>Mint yourself {token.symbol}</legend>
      <p> your balance: {balance} </p>
      <button onClick={mint}>mint</button>
    </fieldset>
  );
}
