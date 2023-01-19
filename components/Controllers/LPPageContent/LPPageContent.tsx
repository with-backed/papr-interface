import controllerStyles from 'components/Controllers/Controller.module.css';
import { HowToLP } from './HowToLP';
import { PoolStats } from './PoolStats';

export function LPPageContent() {
  return (
    <div className={controllerStyles.wrapper}>
      <HowToLP />
      <PoolStats />
    </div>
  );
}
