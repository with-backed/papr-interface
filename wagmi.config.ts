import { defineConfig } from '@wagmi/cli';
import { etherscan, react } from '@wagmi/cli/plugins';
import { erc20ABI } from 'wagmi';

export default defineConfig({
  out: 'types/generatedABI.ts',
  contracts: [
    {
      name: 'erc20',
      abi: erc20ABI,
    },
  ],
  plugins: [
    etherscan({
      apiKey: process.env.ETHERSCAN_API_KEY || '',
      chainId: 1,
      contracts: [
        {
          name: 'PaprController',
          address:
            '0x3b29c19ff2fcea0ff98d0ef5b184354d74ea74b0' as `0x${string}`,
        },
      ],
    }),
    react(),
  ],
});
