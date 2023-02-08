import { Button } from 'components/Button';
import Image from 'next/image';
import CoolCat from 'public/landing-page-nfts/cool-cat.png';
import Dickbutt from 'public/landing-page-nfts/dickbutt.png';
import Loot from 'public/landing-page-nfts/loot.png';
import Mfer from 'public/landing-page-nfts/mfer.png';
import Milady from 'public/landing-page-nfts/milady.png';
import PudgyPenguin from 'public/landing-page-nfts/pudgy-penguin.png';
import RoundThing from 'public/landing-page-nfts/round-thing.png';
import Toad from 'public/landing-page-nfts/toad.png';
import TubbyCat from 'public/landing-page-nfts/tubby-cat.png';
import Wizard from 'public/landing-page-nfts/wizard.png';
import { ComponentProps } from 'react';

import styles from './LandingPageContent.module.css';

const Background = () => <div className={styles['papr-meme-background']} />;

export function PaprMemeBanner() {
  return (
    <>
      <div className={styles['papr-meme-layered']}>
        <Background />
        <div className={styles['papr-meme-wrapper']}>
          <ImageGrid />
          <Text />
        </div>
      </div>
      <div className={styles['papr-meme-mobile']}>
        <ImageGrid />
        <Text />
      </div>
    </>
  );
}

function Text() {
  return (
    <div>
      <p>
        <u>First papr token ever!</u> paprMEME is a <br /> token for loans to
        these 10 collections
      </p>
      <p className={styles.pointer}>👈 INSTANT LOANS FOR MEMEish* NFTs</p>
      <ul className={styles['star-list']}>
        <li>popular but underserved</li>
        <li>durable value</li>
        <li>fun to experiment with</li>
        <li>maybe you have one</li>
      </ul>
      <Button disabled size="small">
        Coming Soon!
      </Button>
    </div>
  );
}

const CustomImage: React.FunctionComponent<
  Omit<ComponentProps<typeof Image>, 'alt'>
> = ({ src, ...props }) => (
  <Image
    src={src}
    {...props}
    alt=""
    height={90}
    width={90}
    placeholder="blur"
  />
);

function ImageGrid() {
  return (
    <div className={styles['meme-grid']}>
      <div>
        <CustomImage src={Milady} />
        <CustomImage src={Wizard} />
        <CustomImage src={Loot} />
      </div>
      <div>
        <CustomImage src={Toad} />
        <CustomImage src={PudgyPenguin} />
        <CustomImage src={RoundThing} />
        <CustomImage src={Dickbutt} />
      </div>
      <div>
        <CustomImage src={Mfer} />
        <CustomImage src={CoolCat} />
        <CustomImage src={TubbyCat} />
      </div>
    </div>
  );
}
