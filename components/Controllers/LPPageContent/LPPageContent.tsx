import controllerStyles from 'components/Controllers/Controller.module.css';
import { PoolStats } from 'components/PoolStats';

import { HowToLP } from './HowToLP';

export function LPPageContent() {
  return (
    <div className={controllerStyles.wrapper}>
      <HowToLP />
      <PoolStats />
    </div>
  );
}
