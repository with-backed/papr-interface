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
  kind = 'regular',
  theme = 'papr',
  size = 'big',
  ...props
}: TransactionButtonProps) {
  const [status, setStatus] = useState<
    'ready' | 'pending' | 'complete' | 'fail'
  >('fail');
  useEffect(() => {
    if (transactionData) {
      setStatus('pending');
      transactionData.wait().then((res) => {
        if (res.status) setStatus('complete');
        else setStatus('fail');
      });
    }
  }, [transactionData]);

  if (completed) {
    return (
      <CompletedButton
        buttonText={text}
        success={true}
        message={<span>Done</span>}
        size={size}
      />
    );
  }

  if (status !== 'ready') {
    let message: string;
    switch (status) {
      case 'pending':
        message = 'Pending...';
        break;
      case 'complete':
        message = 'Success!';
        break;
      case 'fail':
        message = 'Failed';
        break;
    }
    const transactionLink = (
      <EtherscanTransactionLink transactionHash={''}>
        view transaction
      </EtherscanTransactionLink>
    );
    return (
      <CompletedButton
        buttonText={text}
        success={status === 'complete'}
        failure={status === 'fail'}
        size={size}
        message={
          <span>
            {message} {transactionLink}
          </span>
        }
      />
    );
  }

  return (
    <Button
      type={type}
      disabled={disabled}
      kind={kind}
      theme={theme}
      size={size}
      {...props}>
      {text}
    </Button>
  );
}
