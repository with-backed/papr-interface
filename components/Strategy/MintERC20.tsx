import { ethers } from 'ethers';
import { ERC20Token } from 'lib/strategies';
import { useCallback, useEffect, useState } from 'react';
import { MockUnderlying__factory } from 'types/generated/abis';
import { useAccount, useSigner } from 'wagmi';

type TokenInfoProps = {
  token: ERC20Token;
};

export default function MintERC20({ token }: TokenInfoProps) {
  const [balance, setBalance] = useState<string>('');
  const [value, setValue] = useState<string>('');
  const { address } = useAccount();
  const { data: signer } = useSigner();

  const getBalance = useCallback(async () => {
    const b = await token.contract.balanceOf(address!);
    setBalance(ethers.utils.formatUnits(b, token.decimals));
  }, [address]);

  const mint = useCallback(async () => {
    if (signer == null || address == null) {
      console.log('address or sigenr null');
      return;
    }
    const contract = MockUnderlying__factory.connect(
      token.contract.address,
      signer,
    );
    ethers.utils.parseUnits(value, token.decimals);
    const t = await contract.mint(
      address,
      ethers.utils.parseUnits(value, token.decimals),
    );
    t.wait();
    getBalance();
  }, [address, signer, value]);

  useEffect(() => {
    getBalance();
  });

  return (
    <fieldset>
      <legend>Mint yourself {token.symbol}</legend>
      <p> your balance: {balance} </p>
      <input
        placeholder={'amount'}
        onChange={(e) => setValue(e.target.value)}></input>
      <button onClick={mint}>mint</button>
    </fieldset>
  );
}
