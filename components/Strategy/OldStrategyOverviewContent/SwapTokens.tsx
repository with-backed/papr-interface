import { Fieldset } from 'components/Fieldset';
import { ERC20Token } from 'lib/strategies';

type SwapTokensProps = {
  tokenOne: ERC20Token;
  tokenTwo: ERC20Token;
};

export default function SwapTokens({ tokenOne, tokenTwo }: SwapTokensProps) {
  return (
    <Fieldset legend={`🤝 Swap ${tokenOne.symbol} ⬅➡ ${tokenTwo.symbol}`}>
      <a
        target="_blank"
        rel="noreferrer"
        href={`https://app.uniswap.org/#/swap?chain=rinkeby&inputCurrency=${tokenTwo.contract.address}&outputCurrency=${tokenOne.contract.address}`}>
        Get {tokenOne.symbol}
      </a>
      <br />
      <a
        target="_blank"
        rel="noreferrer"
        href={`https://app.uniswap.org/#/swap?chain=rinkeby&inputCurrency=${tokenOne.contract.address}&outputCurrency=${tokenTwo.contract.address}`}>
        Get {tokenTwo.symbol}
      </a>
    </Fieldset>
  );
}
