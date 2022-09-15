import React, { useEffect, useState } from 'react';
import { Parallax } from 'react-scroll-parallax';
import { Borrow } from './landing-page-images/Borrow';
import { Math } from './landing-page-images/Math';
import { PaprGoesDown } from './landing-page-images/PaprGoesDown';
import { PaprGoesUp } from './landing-page-images/PaprGoesUp';
import { Swap } from './landing-page-images/Swap';
import { TargetGrowthText } from './landing-page-images/TargetGrowthText';
import { Uniswap } from './landing-page-images/Uniswap';
import styles from './LandingPageContent.module.css';
import { landingPageStrings } from './strings';

const calculateTargetHeights = () => {
  landingPageStrings.map(({ id }) => {
    const element = document.getElementById(id);
  });
};

export function Parallaxes() {
  const [heights, setHeights] = useState({ targetGrowth: 0 });

  useEffect(() => {}, []);

  return (
    <div className={styles.parallaxes}>
      <Parallax style={{ position: 'absolute', top: heights.targetGrowth }}>
        <TargetGrowthText />
      </Parallax>
      {/* <Parallax>
        <Swap />
      </Parallax>
      <Parallax>
        <Borrow />
      </Parallax>
      <Parallax>
        <Math />
      </Parallax>
      <Parallax>
        <PaprGoesUp />
      </Parallax>
      <Parallax>
        <PaprGoesDown />
      </Parallax>
      <Parallax>
        <Uniswap />
      </Parallax> */}
    </div>
  );
}
