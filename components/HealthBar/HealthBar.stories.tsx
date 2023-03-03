import { HealthBar } from './HealthBar';

export const HealthBars = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <HealthBar ratio={-0.25} />
      <HealthBar ratio={0} />
      <HealthBar ratio={0.25} />
      <HealthBar ratio={0.5} />
      <HealthBar ratio={0.75} />
      <HealthBar ratio={0.95} />
      <HealthBar ratio={1} />
      <HealthBar ratio={25} />
    </div>
  );
};
