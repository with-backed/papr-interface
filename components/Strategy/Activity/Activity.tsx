import { Fieldset } from 'components/Fieldset';
import { LendingStrategy } from 'lib/LendingStrategy';
import React from 'react';
import styles from './Activity.module.css';

type ActivityProps = {
  lendingStrategy: LendingStrategy;
};

export function Activity({ lendingStrategy }: ActivityProps) {
  return <Fieldset legend="🐝 Activity"></Fieldset>;
}
