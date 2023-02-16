import { Fieldset } from 'components/Fieldset';
import { FunctionComponent, PropsWithChildren } from 'react';

import styles from './StatusFieldset.module.css';

const ERROR_LEGEND = '💣 Error';
const LOADING_LEGEND = '⏳ Loading';

type StatusFieldsetProps = {
  kind: 'error' | 'loading';
};

export const StatusFieldset: FunctionComponent<
  PropsWithChildren<StatusFieldsetProps>
> = ({ children, kind }) => {
  return (
    <div className={styles.wrapper}>
      <Fieldset legend={kind === 'error' ? ERROR_LEGEND : LOADING_LEGEND}>
        {children}
      </Fieldset>
    </div>
  );
};
