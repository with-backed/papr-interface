import React from 'react';
import { OpenGraph } from 'components/OpenGraph';
import { LandingPageContent } from 'components/LandingPageContent/MainLandingPage';

export default function Home() {
  return (
    <>
      <OpenGraph
        title="Papr"
        description="NFT lending powered by Uniswap V3."
        imageUrl="/papr-scale-og.png"
      />
      <LandingPageContent />
    </>
  );
}
