import React from 'react';
import { OpenGraph } from 'components/OpenGraph';
import { LandingPageContent } from 'components/LandingPageContent/MainLandingPage';

export default function Home() {
  return (
    <>
      <OpenGraph title={`Papr | Home`} />
      <LandingPageContent />
    </>
  );
}
