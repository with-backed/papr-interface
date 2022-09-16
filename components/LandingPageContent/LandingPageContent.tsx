import React from 'react';
import { UpAndToTheRight } from './landing-page-images/UpAndToTheRight';
import styles from './LandingPageContent.module.css';
import { landingPageStrings } from './strings';
import Zoom from 'react-reveal/Zoom';

export function LandingPageContent() {
  return (
    <div className={styles.wrapper}>
      <h1>Perpetual APR Tokens</h1>
      <h2>for NFT-Backed Loans</h2>
      <UpAndToTheRight />
      <div className={styles.column}>
        {landingPageStrings.map(({ content, id, image }) => {
          if (typeof content === 'string') {
            return (
              <Entry id={id} key={id} illustration={image}>
                <p>{content}</p>
              </Entry>
            );
          } else {
            return (
              <Entry id={id} key={id} illustration={image}>
                {content.map((c) => (
                  <p key={c}>{c}</p>
                ))}
              </Entry>
            );
          }
        })}
      </div>
    </div>
  );
}

type EntryProps = {
  id?: string;
  illustration?: () => JSX.Element;
};
const Entry: React.FunctionComponent<EntryProps> = ({
  children,
  id,
  illustration: Illustration,
}) => (
  <div id={id} className={styles.entry}>
    {!!Illustration && (
      <Zoom>
        <Illustration />
      </Zoom>
    )}
    {!Illustration && <div />}
    <div className={styles['entry-content']}>{children}</div>
  </div>
);