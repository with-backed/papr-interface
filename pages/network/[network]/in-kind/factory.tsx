import { TransactionButton } from 'components/Button';
import { useCallback } from 'react';
import { StrategyFactory__factory } from 'types/generated/abis';

export default function Factory() {
  const create = useCallback(() => {
    // StrategyFactory__factory
  }, []);

  return (
    <div>
      <TransactionButton
        text={'hi'}
        onClick={create}
        txHash={''}
        isPending={false}
      />
    </div>
  );
}
