import {
  CategoryScale,
  Chart,
  LinearScale,
  LineElement,
  PointElement,
} from 'chart.js';
import { TextButton } from 'components/Button';
import { useTheme } from 'hooks/useTheme';
import { TimeSeriesValue } from 'lib/controllers/charts';
import { getTimestampNDaysAgo } from 'lib/duration';
import { ComponentProps, useCallback, useMemo, useState } from 'react';
import { Line } from 'react-chartjs-2';

import styles from './MarketStatus.module.css';

Chart.register(CategoryScale, LinearScale, LineElement, PointElement);

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
  const theme = useTheme();

  const borderColor = useMemo(() => {
    switch (theme) {
      case 'hero':
        return '#4c45d9';
      case 'meme':
        return '#06846f';
      case 'papr':
        return '#0064fa';
      case 'trash':
        return '#e03400';
    }
  }, [theme]);

  const chartData = useMemo(() => {
    let cutoff = 0;
    if (view === '1d') {
      cutoff = getTimestampNDaysAgo(1);
    } else if (view === '7d') {
      cutoff = getTimestampNDaysAgo(7);
    } else if (view === '30d') {
      cutoff = getTimestampNDaysAgo(30);
    }
    const filteredData = data.filter((d) => d.time > cutoff);
    console.log({ filteredData, cutoff });
    return {
      labels: filteredData.map((d) => d.time),
      datasets: [
        {
          ...BASE_DATASET_OPTIONS,
          data: filteredData.map((d) => d.value),
          borderColor: borderColor,
        },
      ],
    };
  }, [borderColor, data, view]);

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
