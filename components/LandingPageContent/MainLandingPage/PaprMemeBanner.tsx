import { Button } from 'components/Button';
import Image from 'next/image';
import CatThing from 'public/landing-page-nfts/cat-thing.png';
import Dickbutt from 'public/landing-page-nfts/dickbutt.png';
import Loot from 'public/landing-page-nfts/loot.png';
import Mfer from 'public/landing-page-nfts/mfer.png';
import Milady from 'public/landing-page-nfts/milady.png';
import OtherCatThing from 'public/landing-page-nfts/other-cat-thing.png';
import Penguin from 'public/landing-page-nfts/penguin.png';
import RoundThing from 'public/landing-page-nfts/round-thing.png';
import Toad from 'public/landing-page-nfts/toad.png';
import Wizard from 'public/landing-page-nfts/wizard.png';

import styles from './LandingPageContent.module.css';

const Background = () => <div className={styles['papr-meme-background']} />;

export function PaprMemeBanner() {
  return (
    <div className={styles['papr-meme-layered']}>
      <Background />
      <div className={styles['papr-meme-wrapper']}>
        <ImageGrid />
        <div>
          <p>
            <u>First papr token ever!</u> paprMEME is a <br /> token for loans
            to these 10 collections
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
      </div>
    </div>
  );
}

function ImageGrid() {
  return (
    <div className={styles['meme-grid']}>
      <div>
        <Image src={Milady} alt="" width={90} height={90} />
        <Image src={Wizard} alt="" width={90} height={90} />
        <Image src={Loot} alt="" width={90} height={90} />
      </div>
      <div>
        <Image src={Toad} alt="" width={90} height={90} />
        <Image src={Penguin} alt="" width={90} height={90} />
        <Image src={RoundThing} alt="" width={90} height={90} />
        <Image src={Dickbutt} alt="" width={90} height={90} />
      </div>
      <div>
        <Image src={Mfer} alt="" width={90} height={90} />
        <Image src={CatThing} alt="" width={90} height={90} />
        <Image src={OtherCatThing} alt="" width={90} height={90} />
      </div>
    </div>
  );
}
