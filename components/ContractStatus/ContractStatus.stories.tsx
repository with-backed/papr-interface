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
        <RatesNegative
          marketPrice="1.39"
          targetPrice="1.03"
          contractRate="-231.09%"
        />
        <RatesPositive
          marketPrice="1.03"
          targetPrice="1.39"
          contractRate="231.09%"
        />
      </div>
    </ConfigProvider>
  );
};
