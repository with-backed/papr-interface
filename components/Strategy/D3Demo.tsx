import { useEffect, useMemo } from 'react';
import * as d3 from 'd3';
import { useQuery } from 'urql';
import {
  LendingStrategyByIdQuery,
  NormFactorUpdatesByStrategyDocument,
  NormFactorUpdatesByStrategyQuery,
} from 'types/generated/graphql/inKindSubgraph';
import { ethers } from 'ethers';
import { computeEffectiveAPR } from 'lib/strategies';
import { ONE } from 'lib/strategies/constants';
import { humanizedTimestamp } from 'lib/duration';
import {
  PoolByIdQuery,
  SqrtPricesByPoolQuery,
} from 'types/generated/graphql/uniswapSubgraph';
import { Price, Token } from '@uniswap/sdk-core';
import { useConfig } from 'hooks/useConfig';
import { SECONDS_IN_A_YEAR } from 'lib/constants';

const Q96 = ethers.BigNumber.from(2).pow(96);
const Q192 = Q96.pow(2);
const containerId = '#d3demo';

type ChartValue = [number, number];

type D3DemoProps = {
  strategy: string;
  targetAnnualGrowth: ethers.BigNumber;
  targetGrowthPerPeriod: ethers.BigNumber;
  lendingStrategy: LendingStrategyByIdQuery['lendingStrategy'] | null;
  poolDayDatas: SqrtPricesByPoolQuery['poolDayDatas'] | null;
  pool: PoolByIdQuery['pool'] | null;
};
export function D3Demo({
  strategy,
  targetAnnualGrowth,
  lendingStrategy,
  poolDayDatas,
  pool,
}: D3DemoProps) {
  const { chainId } = useConfig();
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

  const marks: ChartValue[] | null = useMemo(() => {
    if (!token0 || !token1 || !poolDayDatas || !strategyCreatedAt) {
      return null;
    }

    return poolDayDatas.map(({ sqrtPrice, date }) => {
      const mark = parseFloat(
        new Price(
          token0,
          token1,
          Q192.toString(),
          ethers.BigNumber.from(sqrtPrice).mul(sqrtPrice).toString(),
        )
          .subtract(1)
          .divide(ethers.BigNumber.from(date).sub(strategyCreatedAt).toString())
          .multiply(SECONDS_IN_A_YEAR)
          .toFixed(8),
      );

      return [mark, date];
    });
  }, [poolDayDatas, strategyCreatedAt, token0, token1]);

  console.log({ marks });

  const [{ data: normData }] = useQuery<NormFactorUpdatesByStrategyQuery>({
    query: NormFactorUpdatesByStrategyDocument,
    variables: { strategy },
  });

  const sortedNormData = useMemo(
    () =>
      normData?.normFactorUpdates.sort(
        (a, b) => parseInt(a.timestamp) - parseInt(b.timestamp),
      ) || [],
    [normData],
  );

  const aprs = useMemo(() => {
    if (sortedNormData) {
      const aprs: ChartValue[] = [];
      for (let i = 1; i < sortedNormData.length; ++i) {
        const prev = sortedNormData[i - 1];
        const current = sortedNormData[i];
        const apr = computeEffectiveAPR(
          ethers.BigNumber.from(current.timestamp),
          ethers.BigNumber.from(prev.timestamp),
          ethers.BigNumber.from(current.newNorm).mul(ONE).div(current.oldNorm),
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
      const target = targetAnnualGrowth.toNumber() / 100;
      return sortedNormData.map((d) => [
        target,
        parseInt(d.timestamp),
      ]) as ChartValue[];
    }
    return [];
  }, [sortedNormData, targetAnnualGrowth]);

  useEffect(() => {
    var margin = { top: 10, right: 30, bottom: 30, left: 60 };
    const width = 500 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const svg = d3
      .select(containerId)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

    const datasets = [...aprs, ...targets, ...(marks || [])];
    const extent = d3.extent(datasets, (d) => d[0]);
    // have some breathing room on the bottom
    extent[0] = extent[0]! * 0.85;

    const timestampExtent = d3.extent(datasets, (d) => d[1]);

    // Add X axis --> it is a date format
    var x = d3
      .scaleLinear()
      .domain(timestampExtent as [number, number])
      .range([0, width]);
    svg
      .append('g')
      .attr('transform', 'translate(0,' + height + ')')
      .call(
        d3
          .axisBottom(x)
          .ticks(3)
          .tickFormat((d) => humanizedTimestamp(d.valueOf())),
      );

    // Add Y axis
    var y = d3
      .scaleLinear()
      .domain(extent as any)
      .range([height, 0]);
    svg.append('g').call(d3.axisLeft(y));

    svg
      .append('path')
      .datum(aprs)
      .attr('fill', 'none')
      .attr('stroke', '#007155')
      .attr('stroke-width', 1.5)
      .attr(
        'd',
        d3
          .line()
          .curve(d3.curveBasis)
          .x((d) => x(d[1]))
          .y((d) => y(d[0])),
      );

    svg
      .append('path')
      .datum(targets)
      .attr('fill', 'none')
      .attr('stroke', '#000000')
      .attr('stroke-width', 1.5)
      .attr(
        'd',
        d3
          .line()
          .curve(d3.curveBasis)
          .x((d) => x(d[1]))
          .y((d) => y(d[0])),
      );

    if (marks) {
      svg
        .append('path')
        .datum(marks)
        .attr('fill', 'none')
        .attr('stroke', 'crimson')
        .attr('stroke-width', 1.5)
        .attr(
          'd',
          d3
            .line()
            .curve(d3.curveBasis)
            .x((d) => x(d[1]))
            .y((d) => y(d[0])),
        );
    }

    return () => document.querySelector(`${containerId} svg`)?.remove();
  }, [aprs, marks, targets]);
  return <div id="d3demo" />;
}
