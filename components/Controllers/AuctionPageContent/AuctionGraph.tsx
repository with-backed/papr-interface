import { useEffect, useMemo, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import styles from './AuctionGraph.module.css';
import { formatBigNum } from 'lib/numberFormat';
import { ethers } from 'ethers';
import { currentPrice } from 'lib/auctions';
import { convertOneScaledValue } from 'lib/controllers';
import { AuctionQuery } from 'types/generated/graphql/inKindSubgraph';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement);

export const chartOptions = {
  responsive: true,
  events: [],
  plugins: {
    legend: {
      display: false,
    },
  },
  scales: {
    x: { display: false },
    y: { display: false },
  },
  elements: {
    point: {
      radius: 0,
    },
  },
};

export function generateTimestampsAndPrices(
  auction: NonNullable<AuctionQuery['auction']>,
  currentTimestamp = 0,
) {
  const chartX: number[] = [];
  const chartY: number[] = [];
  const startTime = auction.start.timestamp;
  const startPrice = ethers.BigNumber.from(auction.startPrice);
  for (
    let t = startTime;
    t < startTime + 86400 * 3 || startTime < currentTimestamp;
    t += 10
  ) {
    chartX.push(t);
    chartY.push(
      parseFloat(
        formatBigNum(
          currentPrice(
            startPrice,
            t - startTime,
            parseInt(auction.secondsInPeriod),
            convertOneScaledValue(
              ethers.BigNumber.from(auction.perPeriodDecayPercentWad),
              4,
            ),
          ),
          18,
        ),
      ),
    );
  }
  return [chartX, chartY];
}

const baseChartProperties = {
  borderWidth: 2,
  borderCapStyle: 'square' as const,
};

type AuctionGraphProps = {
  auction: NonNullable<AuctionQuery['auction']>;
  liveAuctionPrice: ethers.BigNumber;
  liveTimestamp: number;
};

export function AuctionGraph({
  auction,
  liveAuctionPrice,
  liveTimestamp,
}: AuctionGraphProps) {
  const timestampAndPricesAllTime = useMemo(() => {
    return generateTimestampsAndPrices(auction);
  }, [auction]);
  const timestampAndPricesCurrent = useMemo(() => {
    return generateTimestampsAndPrices(auction, liveTimestamp);
  }, [auction, liveTimestamp]);

  const chartData = useMemo(() => {
    return {
      labels: timestampAndPricesAllTime[0],
      datasets: [
        {
          data: timestampAndPricesAllTime[1],
          borderColor: '#e4e4e4',
          ...baseChartProperties,
        },
        {
          data: timestampAndPricesCurrent[1],
          borderColor: '#0000c2',
          ...baseChartProperties,
        },
      ],
    };
  }, [timestampAndPricesAllTime, timestampAndPricesCurrent]);

  return (
    <>
      <Line options={chartOptions} data={chartData} />
    </>
  );
}
