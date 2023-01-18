import { useEffect, useMemo, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ChartOptions,
  Tooltip,
  Chart,
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { Line } from 'react-chartjs-2';
import styles from './AuctionGraph.module.css';
import { formatBigNum } from 'lib/numberFormat';
import { ethers } from 'ethers';
import { currentPrice } from 'lib/auctions';
import { convertOneScaledValue } from 'lib/controllers';
import { AuctionQuery } from 'types/generated/graphql/inKindSubgraph';
import { PaprController, useController } from 'hooks/useController';
import { OracleInfo } from 'hooks/useOracleInfo/useOracleInfo';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  ChartDataLabels,
);

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
    t < startTime + 86400 * 3 &&
    (currentTimestamp ? t < currentTimestamp : true);
    t += 900
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
  auctionUnderlyingPrice: ethers.BigNumber | null;
  liveTimestamp: number;
  oracleInfo: OracleInfo;
  latestUniswapPrice: number;
  floorEthPrice: number;
  timeAgo: string;
};

export function AuctionGraph({
  auction,
  auctionUnderlyingPrice,
  liveTimestamp,
  oracleInfo,
  floorEthPrice,
  timeAgo,
}: AuctionGraphProps) {
  const controller = useController();
  const timestampAndPricesAllTime = useMemo(() => {
    return generateTimestampsAndPrices(auction);
  }, [auction]);
  const timestampAndPricesCurrent = useMemo(() => {
    return generateTimestampsAndPrices(auction, liveTimestamp);
  }, [auction, liveTimestamp]);

  const floorDataPoint = useMemo(() => {
    const prices = timestampAndPricesAllTime[1];
    const floorPrice = oracleInfo[auction.auctionAssetContract.id].price;
    const closestPoint = Array.from(Array(prices.length).keys()).reduce(
      (prev, curr) => {
        return Math.abs(prices[curr] - floorPrice) <
          Math.abs(prices[prev] - floorPrice)
          ? curr
          : prev;
      },
    );
    return closestPoint;
  }, [oracleInfo, timestampAndPricesAllTime, auction.auctionAssetContract.id]);

  const startLabel = useMemo(() => {
    const floorPrice =
      oracleInfo[auction.auctionAssetContract.id].price.toFixed(2);
    return `\n\n\nStart @ 3x Floor\n\t\t\t\t${timeAgo}\n\t\t\t\t\t\t\t${floorEthPrice} ETH\n\t\t\t\t\t\t\t\t\t$${floorPrice}`;
  }, [timeAgo, oracleInfo, floorEthPrice, auction.auctionAssetContract.id]);

  const buyNowLabel = useMemo(
    () =>
      auctionUnderlyingPrice
        ? `Buy now: $${formatBigNum(
            auctionUnderlyingPrice,
            controller.underlying.decimals,
          )}`
        : 'Buy now: ......',
    [auctionUnderlyingPrice, controller.underlying.decimals],
  );

  const floorLabel = useMemo(() => {
    const floorPrice =
      oracleInfo[auction.auctionAssetContract.id].price.toFixed(2);
    return `\t\tTop Bid   - - - - - - - - - - - - - - - - - - - - - - - - - - -\n${floorEthPrice} ETH\n\t\t$${floorPrice}`;
  }, [oracleInfo, floorEthPrice, auction.auctionAssetContract.id]);

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      events: [],
      layout: {
        padding: {
          left: 180,
          right: 40,
        },
      },
      animation: {
        duration: 0,
      },
      plugins: {
        legend: {
          display: false,
        },
        datalabels: {
          font: {
            family: 'Courier Prime, Courier New, monospace',
          },
          align: 'right',
          color: function (context: any) {
            if (context.datasetIndex === 1 && context.dataIndex === 0) {
              return 'black';
            } else if (
              context.datasetIndex === 0 &&
              context.dataIndex ===
                context.chart.data.datasets[0].data.length - 1
            ) {
              return 'white';
            } else if (
              context.datasetIndex === 1 &&
              context.dataIndex === floorDataPoint
            ) {
              return 'black';
            } else if (
              context.datasetIndex === 1 &&
              context.dataIndex ===
                context.chart.data.datasets[1].data.length - 1
            ) {
              return 'black';
            }
          },
          backgroundColor: function (context: any) {
            if (context.datasetIndex === 1 && context.dataIndex === 0) {
              return 'white';
            } else if (
              context.datasetIndex === 0 &&
              context.dataIndex ===
                context.chart.data.datasets[0].data.length - 1
            ) {
              return '#0000c2';
            } else if (
              context.datasetIndex === 1 &&
              context.dataIndex === floorDataPoint
            ) {
              return '';
            } else if (
              context.datasetIndex === 1 &&
              context.dataIndex ===
                context.chart.data.datasets[1].data.length - 1
            ) {
              return 'white';
            }
          },
          offset: function (context: any) {
            if (context.datasetIndex === 1 && context.dataIndex === 0) {
              return -160;
            } else if (
              context.datasetIndex === 0 &&
              context.dataIndex ===
                context.chart.data.datasets[0].data.length - 1
            ) {
              return 20;
            } else if (
              context.datasetIndex === 1 &&
              context.dataIndex === floorDataPoint
            ) {
              return -220;
            } else if (
              context.datasetIndex === 1 &&
              context.dataIndex ===
                context.chart.data.datasets[1].data.length - 1
            ) {
              return 10;
            }
          },
          formatter: function (_value: any, context: any) {
            if (context.datasetIndex === 1 && context.dataIndex === 0) {
              return startLabel;
            } else if (
              context.datasetIndex === 0 &&
              context.dataIndex ===
                context.chart.data.datasets[0].data.length - 1
            ) {
              return buyNowLabel;
            } else if (
              context.datasetIndex === 1 &&
              context.dataIndex === floorDataPoint
            ) {
              return floorLabel;
            } else if (
              context.datasetIndex === 1 &&
              context.dataIndex ===
                context.chart.data.datasets[1].data.length - 1
            ) {
              return '$0';
            }
          },
          display: function (context: any) {
            return (
              (context.datasetIndex === 0 &&
                context.dataIndex ===
                  context.chart.data.datasets[0].data.length - 1) ||
              (context.datasetIndex === 1 &&
                context.dataIndex === floorDataPoint) ||
              (context.datasetIndex === 1 && context.dataIndex === 0) ||
              (context.datasetIndex === 1 &&
                context.dataIndex ===
                  context.chart.data.datasets[1].data.length - 1)
            );
          },
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
    }),
    [startLabel, buyNowLabel, floorLabel, floorDataPoint],
  );

  const chartData = useMemo(() => {
    return {
      labels: timestampAndPricesAllTime[0],
      datasets: [
        {
          data: timestampAndPricesCurrent[1],
          borderColor: '#0000c2',
          ...baseChartProperties,
          pointRadius: Array(timestampAndPricesCurrent[1].length)
            .fill('')
            .map((_elem, i) =>
              i === timestampAndPricesCurrent[1].length - 1 ? 2 : 0,
            ),
        },
        {
          data: timestampAndPricesAllTime[1],
          borderColor: '#e4e4e4',
          ...baseChartProperties,
        },
      ],
    };
  }, [timestampAndPricesAllTime, timestampAndPricesCurrent]);

  return (
    <div className={styles.curve}>
      <Line
        options={chartOptions as any}
        data={chartData}
        height={300}
        width={560}
      />
    </div>
  );
}
