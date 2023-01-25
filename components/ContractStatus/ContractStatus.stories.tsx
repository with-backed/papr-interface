import { ConfigProvider } from 'hooks/useConfig';
import { RatesNegative } from './RatesNegative';
import { RatesPositive } from './RatesPositive';

export const Rates = () => {
  return (
    <ConfigProvider token="paprTrash">
      <div
        style={{
          maxWidth: 640,
          display: 'flex',
          flexDirection: 'column',
          gap: 50,
        }}>
        <RatesNegative />
        <RatesPositive />
      </div>
    </ConfigProvider>
  );
};
