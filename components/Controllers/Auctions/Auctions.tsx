import { Fieldset } from 'components/Fieldset';
import React from 'react';
import styles from './Auctions.module.css';

export function Auctions() {
  return (
    <div>
      <Fieldset legend="🔨 Active Auctions"></Fieldset>
      <Fieldset legend="🕰 Past Auctions"></Fieldset>
    </div>
  );
}
