import React from 'react';
import styles from './LandingPageContent.module.css';
import { Disclosure } from 'components/Disclosure';

const FAQ_ENTRIES = [
  ['What are the risks?', ''],
  ['How are the interest rates set?', ''],
  ["What's the benefit of doing this with a token?", ''],
  ['How do liquidations happen?', ''],
  ['What does "working smoothly" look like?', ''],
];

export function FAQ() {
  return (
    <div className={styles['faq-container']}>
      <h2>
        Wait, how does papr
        <br />
        work exactly?
      </h2>
      <div className={styles.rules}>
        {FAQ_ENTRIES.map(([question, answer]) => (
          <Disclosure key={question} title={question}>
            {answer}
          </Disclosure>
        ))}
      </div>
    </div>
  );
}
