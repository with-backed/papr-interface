import { LandingPageContent } from 'components/LandingPageContent/MainLandingPage';
import { OpenGraph } from 'components/OpenGraph';
import React from 'react';

export default function Home() {
  return (
    <>
      <OpenGraph title="Papr" />
      <LandingPageContent />
    </>
  );
}
