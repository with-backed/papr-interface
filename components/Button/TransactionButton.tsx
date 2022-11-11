import { Button } from 'components/Button';
import { EtherscanTransactionLink } from 'components/EtherscanLink';
import React, { useEffect, useState } from 'react';
import { ButtonProps } from './Button';
import { CompletedButton } from './CompletedButton';
import { SendTransactionResult } from '@wagmi/core';

interface TransactionButtonProps extends ButtonProps {
  text: string;
  transactionData?: SendTransactionResult;
  disabled?: boolean;
  onClick?: () => void;
  // when ordinarily we would show a TransactionButton, but we don't
  // need to (e.g., token already approved in the past)
  completed?: boolean;
}

export function TransactionButton({
  text,
  disabled = false,
  type,
  transactionData,
  completed,
  ...props
}: TransactionButtonProps) {
  const [status, setStatus] = useState<'ready' | 'pending' | 'complete'>(
    'ready',
  );
  useEffect(() => {
    if (transactionData) {
      setStatus('pending');
      transactionData.wait().then(() => setStatus('complete'));
    }
  }, [transactionData]);

  if (completed) {
    return (
      <CompletedButton
        buttonText={text}
        success={true}
        message={<span>Done</span>}
      />
    );
  }

  if (status !== 'ready') {
    const message = status === 'pending' ? 'Pending...' : 'Success!';
    const transactionLink = (
      <EtherscanTransactionLink transactionHash={transactionData!.hash}>
        view transaction
      </EtherscanTransactionLink>
    );
    return (
      <CompletedButton
        buttonText={text}
        success={status === 'complete'}
        message={
          <span>
            {message} {transactionLink}
          </span>
        }
      />
    );
  }

  return (
    <Button type={type} disabled={disabled} {...props}>
      {text}
    </Button>
  );
}
