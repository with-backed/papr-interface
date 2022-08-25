import axios from 'axios';
import { ethers } from 'ethers';
import { abi as IUniswapRouterABI } from '@uniswap/v3-periphery/artifacts/contracts/interfaces/ISwapRouter.sol/ISwapRouter.json';
import { Pool } from '@uniswap/v3-sdk';
import { ERC20__factory, IUniswapV3Pool__factory } from 'types/generated/abis';
import { buildToken } from '.';
import { getPool } from './uniswap';

export async function testTenderlySimulator() {
  const TENDERLY_USER = process.env.NEXT_PUBLIC_TENDERLY_USER as string;
  const TENDERLY_PROJECT = process.env.NEXT_PUBLIC_TENDERLY_PROJECT as string;
  const TENDERLY_ACCESS_KEY = process.env
    .NEXT_PUBLIC_TENDERLY_ACCESS_KEY as string;

  const TENDERLY_FORK_API = `https://api.tenderly.co/api/v1/account/${TENDERLY_USER}/project/${TENDERLY_PROJECT}/fork`;

  const opts = {
    headers: {
      'X-Access-Key': TENDERLY_ACCESS_KEY as string,
    },
  };

  const body = {
    network_id: '4',
    block_number: 11264939,
  };

  const forkRes = await axios.post(TENDERLY_FORK_API, body, opts);

  const forkId = forkRes.data.simulation_fork.id;
  const forkRPC = `https://rpc.tenderly.co/fork/${forkId}`;

  const provider = new ethers.providers.JsonRpcProvider(forkRPC);
  const signer = provider.getSigner();
  const params = [
    ['0xe89cb2053a04daf86abaa1f4bc6d50744e57d39e'],
    ethers.utils.hexValue(100), // hex encoded wei amount
  ];

  await provider.send('tenderly_addBalance', params);

  const routerContract = new ethers.Contract(
    '0xE592427A0AEce92De3Edee1F18E0157C05861564',
    IUniswapRouterABI,
    signer,
  );

  const poolContract = IUniswapV3Pool__factory.connect(
    '0xa5a0ae6fffe6bec302e69165038255558f6bc276',
    provider,
  );
  const token0 = await buildToken(
    ERC20__factory.connect(
      '0x3f7a71e5277fB4Adc274217928765578aA1365C3',
      provider,
    ),
  );
  const token1 = await buildToken(
    ERC20__factory.connect(
      '0xe357188e6A0B663bc7dF668abc6D76a4f534F588',
      provider,
    ),
  );

  let pool = await getPool(poolContract, token0, token1, 4);
  console.log({
    liquidity: pool.liquidity.toString(),
    tick: pool.tickCurrent,
    token0Price: pool.token0Price.toFixed(),
  });

  const iface = new ethers.utils.Interface(IUniswapRouterABI);
  const encodedData = iface.encodeFunctionData(
    'exactInputSingle(tuple(address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96))',
    [
      [
        '0x3f7a71e5277fB4Adc274217928765578aA1365C3',
        '0xe357188e6A0B663bc7dF668abc6D76a4f534F588',
        pool.fee,
        '0xe89cb2053a04daf86abaa1f4bc6d50744e57d39e',
        11274942,
        100,
        0,
        0,
      ],
    ],
  );

  const transactionParameters = [
    {
      to: routerContract.address,
      from: '0xe89cb2053a04daf86abaa1f4bc6d50744e57d39e',
      data: encodedData,
      gas: ethers.utils.hexValue(3000000),
      gasPrice: ethers.utils.hexValue(1),
      value: ethers.utils.hexValue(0),
    },
  ];
  const txHash = await provider.send(
    'eth_sendTransaction',
    transactionParameters,
  );
  console.log({ txHash });

  pool = await getPool(poolContract, token0, token1, 4);
  console.log({
    liquidity: pool.liquidity.toString(),
    tick: pool.tickCurrent,
    token0Price: pool.token0Price.toFixed(),
  });

  //   const TENDERLY_FORK_ACCESS_URL = `https://api.tenderly.co/api/v1/account/${TENDERLY_USER}/project/${TENDERLY_PROJECT}/fork/${forkId}`;

  //   await axios.delete(TENDERLY_FORK_ACCESS_URL, opts);
}
