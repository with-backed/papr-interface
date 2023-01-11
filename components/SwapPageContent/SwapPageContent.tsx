import { SwapWidget } from '@uniswap/widgets';
import '@uniswap/widgets/fonts.css';
import styles from './SwapPageContent.module.css';

export function SwapPageContent() {
  return (
    <div className={styles.wrapper}>
      <SwapWidget />
    </div>
  );
}
