import { TextButton } from 'components/Button';
import { TimeSeriesValue } from 'lib/controllers/charts';
import { getTimestampNDaysAgo } from 'lib/duration';
import { ComponentProps, useCallback, useMemo, useState } from 'react';
import { Line } from 'react-chartjs-2';

import styles from './MarketStatus.module.css';

const BASE_CHART_OPTIONS = {
  events: [],
  borderColor: '#000',
  borderWidth: 1.5,
  responsive: true,
  plugins: {
    legend: {
      display: false,
    },
    tooltips: {
      enabled: false,
    },
    datalabels: {
      display: false,
    },
  },
  scales: {
    x: {
      display: false,
    },
    y: {
      display: false,
    },
  },
  layout: {
    padding: {
      bottom: 10,
      top: 10,
    },
  },
};

const BASE_DATASET_OPTIONS = {
  fill: true,
  pointRadius: 0,
  spanGaps: true,
  tension: 0.2,
};

type SparklineProps = {
  data: TimeSeriesValue[];
};

type ChartView = '1d' | '7d' | '30d' | 'All';

const StyledTextButton: React.FunctionComponent<
  { active: boolean } & ComponentProps<typeof TextButton>
> = ({ children, active, ...props }) => {
  return (
    <TextButton
      className={styles[active ? 'chart-button-active' : 'chart-button']}
      {...props}>
      {children}
    </TextButton>
  );
};

export function Sparkline({ data }: SparklineProps) {
  const [view, setView] = useState<ChartView>('All');

  const dataForPeriod = useMemo(() => {
    const cutoff =
      view === 'All'
        ? 0
        : getTimestampNDaysAgo(parseInt(view.slice(0, view.length)));
    return data.filter((d) => d.time > cutoff);
  }, [data, view]);

  const borderColor = useMemo(() => {
    const first = dataForPeriod[0];
    const last = dataForPeriod[dataForPeriod.length - 1];

    if (last.value >= first.value) {
      // --highlight-success-100
      return '#317049';
    }
    // --highlight-alert-100
    return '#db004d';
  }, [dataForPeriod]);

  const chartData = useMemo(() => {
    return {
      labels: dataForPeriod.map((d) => d.time),
      datasets: [
        {
          ...BASE_DATASET_OPTIONS,
          data: dataForPeriod.map((d) => d.value),
          borderColor: borderColor,
        },
      ],
    };
  }, [borderColor, dataForPeriod]);

  const viewSelectorFactory = useCallback(
    (view: ChartView) => () => setView(view),
    [],
  );
  const [handle1DClick, handle7DClick, handle30DClick, handleAllClick] =
    useMemo(
      () => [
        viewSelectorFactory('1d'),
        viewSelectorFactory('7d'),
        viewSelectorFactory('30d'),
        viewSelectorFactory('All'),
      ],
      [viewSelectorFactory],
    );

  return (
    <div className={styles['chart-wrapper']}>
      <div className={styles['chart-selectors']}>
        <StyledTextButton active={view === '1d'} onClick={handle1DClick}>
          1d
        </StyledTextButton>
        <StyledTextButton active={view === '7d'} onClick={handle7DClick}>
          7d
        </StyledTextButton>
        <StyledTextButton active={view === '30d'} onClick={handle30DClick}>
          30d
        </StyledTextButton>
        <StyledTextButton active={view === 'All'} onClick={handleAllClick}>
          All
        </StyledTextButton>
      </div>
      <Line data={chartData} options={BASE_CHART_OPTIONS} />
    </div>
  );
}
