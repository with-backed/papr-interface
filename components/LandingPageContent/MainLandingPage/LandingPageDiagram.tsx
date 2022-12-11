import Image from 'next/legacy/image';
import Diagram from 'public/landingpage-diagram.png';
import React from 'react';

import styles from './LandingPageContent.module.css';

const DiagramBackground = () => (
  <div className={styles['diagram-background']} />
);

export const LandingPageDiagram = () => (
  <div className={styles.layered}>
    <DiagramBackground />
    <div className={styles['diagram-container']}>
      <Image src={Diagram} alt="" placeholder="blur" />
    </div>
  </div>
);
