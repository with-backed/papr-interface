import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  axisBottom,
  axisLeft,
  axisRight,
  extent,
  scaleLinear,
  sort,
  max,
  min,
} from 'd3';
import { useQuery } from 'urql';
import {
  LendingStrategyByIdQuery,
  NormalizationUpdatesByStrategyDocument,
  NormalizationUpdatesByStrategyQuery,
} from 'types/generated/graphql/inKindSubgraph';
import { ethers } from 'ethers';
import { computeEffictiveDPR } from 'lib/strategies';
import { ONE } from 'lib/strategies/constants';
import { humanizedTimestamp } from 'lib/duration';
import {
  PoolByIdQuery,
  SqrtPricesByPoolQuery,
  SwapsByPoolQuery,
} from 'types/generated/graphql/uniswapSubgraph';
import { Price, Token } from '@uniswap/sdk-core';
import { useConfig } from 'hooks/useConfig';
import { Q192, SECONDS_IN_A_DAY, SECONDS_IN_A_YEAR } from 'lib/constants';
import { attachSVG, drawLine, drawDashedLine } from 'lib/d3';
import { strategyContract } from 'lib/contracts';
import { SupportedNetwork } from 'lib/config';
import { useTimestamp } from 'hooks/useTimestamp';

const containerId = '#d3demo';

type ChartValue = [number, number];

type D3DemoProps = {
  strategy: string;
  targetAnnualGrowth: ethers.BigNumber;
  targetGrowthPerPeriod: ethers.BigNumber;
  lendingStrategy: LendingStrategyByIdQuery['lendingStrategy'] | null;
  poolSwapData: SwapsByPoolQuery['swaps'] | null;
  pool: PoolByIdQuery['pool'] | null;
};
export function D3Demo({
  strategy,
  targetAnnualGrowth,
  lendingStrategy,
  poolSwapData,
  pool,
}: D3DemoProps) {
  const { jsonRpcProvider, network, chainId } = useConfig();
  const timestamp = useTimestamp();
  const token0 = useMemo(() => {
    if (!pool) {
      return null;
    }
    const { id, decimals, symbol, name } = pool.token0;
    return new Token(chainId, id, parseInt(decimals), symbol, name);
  }, [chainId, pool]);

  const token1 = useMemo(() => {
    if (!pool) {
      return null;
    }
    const { id, decimals, symbol, name } = pool.token1;
    return new Token(chainId, id, parseInt(decimals), symbol, name);
  }, [chainId, pool]);

  const strategyCreatedAt = useMemo(() => {
    if (lendingStrategy) {
      return ethers.BigNumber.from(lendingStrategy.createdAt);
    }
  }, [lendingStrategy]);

  const [sortedNormData, setSortedNormData] = useState<
    NormUpdate[] | undefined
  >();

  interface Swap {
    sqrtPriceX96: string;
    timestamp: string;
  }

  const marks: ChartValue[] | null = useMemo(() => {
    if (!token0 || !token1 || !poolSwapData || !strategyCreatedAt) {
      return null;
    }

    poolSwapData.sort((a, b) => parseInt(a.timestamp) - parseInt(b.timestamp));

    const result: ChartValue[] = poolSwapData.map(
      ({ sqrtPriceX96, timestamp }: Swap) => {
        const mark = parseFloat(
          new Price(
            token0,
            token1,
            Q192.toString(),
            ethers.BigNumber.from(sqrtPriceX96).mul(sqrtPriceX96).toString(),
          )
            .subtract(1)
            .divide(
              ethers.BigNumber.from(timestamp)
                .sub(strategyCreatedAt)
                .toString(),
            )
            .multiply(SECONDS_IN_A_YEAR)
            .toFixed(8),
        );
        return [mark, parseInt(timestamp)];
      },
    );
    if (targets.length > 0) {
      result.unshift([
        targets[0][0],
        parseInt(strategyCreatedAt.toString()),
      ] as ChartValue);
    }

    result.push([
      result[result.length - 1][0],
      timestamp || Math.floor(Date.now() / 1000),
    ] as ChartValue);
    return result;
  }, [poolSwapData, strategyCreatedAt, token0, token1]);

  const [{ data: normData }] = useQuery<NormalizationUpdatesByStrategyQuery>({
    query: NormalizationUpdatesByStrategyDocument,
    variables: { strategy },
  });

  interface NormUpdate {
    timestamp: string;
    newNorm: string;
  }

  const getSortedNormData = useCallback(async () => {
    const sortedData: NormUpdate[] =
      normData?.normalizationUpdates.sort(
        (a, b) => parseInt(a.timestamp) - parseInt(b.timestamp),
      ) || [];
    const contract = strategyContract(
      strategy,
      jsonRpcProvider,
      network as SupportedNetwork,
    );
    const newNorm = await contract.newNorm();
    sortedData.push({
      newNorm: newNorm.toString(),
      timestamp: (timestamp || Math.floor(Date.now() / 1000)).toString(),
    });
    setSortedNormData(sortedData);
  }, [normData]);

  const aprs = useMemo(() => {
    if (sortedNormData) {
      const aprs: ChartValue[] = [];

      if (sortedNormData.length > 0 && targets.length > 0) {
        aprs.push([targets[0][0], parseInt(sortedNormData[0].timestamp)]);
      }

      for (let i = 1; i < sortedNormData.length; ++i) {
        const prev = sortedNormData[i - 1];
        const current = sortedNormData[i];
        const apr = computeEffictiveDPR(
          ethers.BigNumber.from(current.timestamp),
          ethers.BigNumber.from(prev.timestamp),
          ethers.BigNumber.from(current.newNorm).mul(ONE).div(prev.newNorm),
        )
          .div(100)
          .toNumber();
        aprs.push([apr, parseInt(current.timestamp)] as ChartValue);
      }

      return aprs;
    }
    return [];
  }, [sortedNormData]);

  const targets = useMemo(() => {
    if (sortedNormData) {
      const target =
        targetAnnualGrowth.toNumber() /
        (SECONDS_IN_A_YEAR / SECONDS_IN_A_DAY) /
        100;
      return sortedNormData.map((d) => [
        target,
        parseInt(d.timestamp),
      ]) as ChartValue[];
    }
    return [];
  }, [sortedNormData, targetAnnualGrowth]);

  useEffect(() => {
    getSortedNormData();
  }, [normData]);

  useEffect(() => {
    const margin = { top: 10, right: 50, bottom: 30, left: 60 };
    const width = 500 - margin.left - margin.right;
    // TODO dynamically adjust height based on extent of y values
    const height = 1000 - margin.top - margin.bottom;

    const svg = attachSVG({ containerId, height, margin, width });

    const datasets = [...aprs, ...targets, ...(marks || [])];
    const yValues: number[] = datasets.map((r) => r[0]);
    const maxY = (max(yValues) as number) * 1.2;
    var minY = min(yValues) as number;
    // give minY some padding
    if (minY < 0) {
      minY = Math.min(minY * 1.2, -5);
    } else if (minY < 1) {
      minY = -5;
    } else {
      minY = minY * 0.8;
    }
    const dataExtent = extent([minY, maxY]);
    const timestampExtent = extent(datasets, (d) => d[1]);

    var xScale = scaleLinear()
      .domain(timestampExtent as [number, number])
      .range([0, width]);
    var yScale = scaleLinear()
      .domain(dataExtent as [number, number])
      .range([height, minY]);

    // Draw scale lines on chart
    svg
      .append('g')
      .attr('transform', 'translate(0,' + height + ')')
      .call(
        axisBottom(xScale)
          .ticks(3)
          .tickFormat((d) => humanizedTimestamp(d.valueOf())),
      );
    // y axis on right
    svg
      .append('g')
      .attr('transform', `translate(${width}, 0)`)
      .call(axisRight(yScale));

    // y axis on left
    // svg
    //   .append('g')
    //   .call(axisLeft(yScale));

    drawLine({
      data: aprs,
      svg: svg as any,
      stroke: '#007155',
      xScale,
      yScale,
    });

    drawDashedLine({
      data: targets,
      svg: svg as any,
      stroke: '#000000',
      xScale,
      yScale,
    });

    if (marks) {
      drawLine({
        data: marks,
        svg: svg as any,
        stroke: '#000000',
        xScale,
        yScale,
      });
    }

    return () => document.querySelector(`${containerId} svg`)?.remove();
  }, [aprs, marks, targets]);
  return <div id="d3demo" />;
}
