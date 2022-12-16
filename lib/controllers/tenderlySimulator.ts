import { abi as IUniswapRouterABI } from '@uniswap/v3-periphery/artifacts/contracts/interfaces/ISwapRouter.sol/ISwapRouter.json';
import axios from 'axios';
import { ethers } from 'ethers';
import { IUniswapV3Pool__factory } from 'types/generated/abis';
import { erc20ABI } from 'wagmi';

import { ERC20Token } from '.';
import { getPool } from './uniswap';

export async function simulateSwap(
  token0: ERC20Token,
  token1: ERC20Token,
  amountIn: ethers.BigNumber,
  block: ethers.BigNumber,
  blockTimestamp: ethers.BigNumber,
  from: string,
  poolAddress: string,
) {
  const TENDERLY_USER = process.env.NEXT_PUBLIC_TENDERLY_USER as string;
  const TENDERLY_PROJECT = process.env.NEXT_PUBLIC_TENDERLY_PROJECT as string;
  const TENDERLY_ACCESS_KEY = process.env
    .NEXT_PUBLIC_TENDERLY_ACCESS_KEY as string;
  const UNIV3_ROUTER_ADDRESS = process.env.NEXT_PUBLIC_ROUTER as string;
  const CHAIN = (process.env.NEXT_PUBLIC_CHAIN_ID as string).substring(2);

  const TENDERLY_FORK_API = `https://api.tenderly.co/api/v1/account/${TENDERLY_USER}/project/${TENDERLY_PROJECT}/fork`;

  const opts = {
    headers: {
      'X-Access-Key': TENDERLY_ACCESS_KEY as string,
    },
  };

  const body = {
    network_id: CHAIN,
    block_number: block.toNumber(),
  };

  const forkRes = await axios.post(TENDERLY_FORK_API, body, opts);

  const forkId = forkRes.data.simulation_fork.id;
  const forkRPC = `https://rpc.tenderly.co/fork/${forkId}`;

  const provider = new ethers.providers.JsonRpcProvider(forkRPC);
  const signer = provider.getSigner();
  const params = [[from], ethers.utils.hexValue(100)];

  await provider.send('tenderly_addBalance', params);

  const routerContract = new ethers.Contract(
    UNIV3_ROUTER_ADDRESS,
    IUniswapRouterABI,
    signer,
  );

  const poolContract = IUniswapV3Pool__factory.connect(poolAddress, provider);

  let pool = await getPool(poolContract, token0, token1, 4);

  const erc20IFace = new ethers.utils.Interface(erc20ABI);
  const approveEncodedData = erc20IFace.encodeFunctionData(
    'approve(address spender, uint256 amount)',
    [UNIV3_ROUTER_ADDRESS, amountIn],
  );

  const approveParams = [
    {
      to: token0.id,
      from,
      data: approveEncodedData,
      gas: ethers.utils.hexValue(3000000),
      gasPrice: ethers.utils.hexValue(1),
      value: ethers.utils.hexValue(0),
    },
  ];
  await provider.send('eth_sendTransaction', approveParams);

  const iface = new ethers.utils.Interface(IUniswapRouterABI);
  const encodedData = iface.encodeFunctionData(
    'exactInputSingle(tuple(address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96))',
    [[token0.id, token1.id, pool.fee, from, blockTimestamp, amountIn, 0, 0]],
  );

  const transactionParameters = [
    {
      to: routerContract.address,
      from,
      data: encodedData,
      gas: ethers.utils.hexValue(3000000),
      gasPrice: ethers.utils.hexValue(1),
      value: ethers.utils.hexValue(0),
    },
  ];
  await provider.send('eth_sendTransaction', transactionParameters);

  const TENDERLY_FORK_ACCESS_URL = `https://api.tenderly.co/api/v1/account/${TENDERLY_USER}/project/${TENDERLY_PROJECT}/fork/${forkId}`;

  await axios.delete(TENDERLY_FORK_ACCESS_URL, opts);
}
