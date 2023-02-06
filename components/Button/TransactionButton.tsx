import { SendTransactionResult } from '@wagmi/core';
import { Button } from 'components/Button';
import { EtherscanTransactionLink } from 'components/EtherscanLink';
import React, { useCallback, useEffect, useState } from 'react';

import { ButtonProps } from './Button';
import { CompletedButton } from './CompletedButton';

interface TransactionButtonProps extends ButtonProps {
  text: string;
  transactionData?: SendTransactionResult;
  disabled?: boolean;
  onClick?: () => void;
  // when ordinarily we would show a TransactionButton, but we don't
  // need to (e.g., token already approved in the past)
  completed?: boolean;
  // used to determine if user has denied tx request in their wallet
  error?: string | null;
}

export function TransactionButton({
  text,
  disabled = false,
  onClick,
  type,
  transactionData,
  completed,
  error,
  kind = 'regular',
  theme = 'papr',
  size = 'big',
  ...props
}: TransactionButtonProps) {
  const [status, setStatus] = useState<
    'ready' | 'confirming' | 'pending' | 'complete' | 'fail'
  >('ready');
  useEffect(() => {
    if (transactionData) {
      setStatus('pending');
      transactionData.wait().then((res) => {
        if (res.status) setStatus('complete');
        else setStatus('fail');
      });
    }
  }, [transactionData]);

  useEffect(() => {
    if (error?.startsWith('User rejected request')) setStatus('ready');
  }, [error]);

  const onClickWithConfirm = useCallback(() => {
    if (!onClick) return;
    setStatus('confirming');
    onClick();
  }, [onClick, setStatus]);

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

  if (status !== 'ready' && status !== 'confirming') {
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
    const transactionLink = transactionData ? (
      <EtherscanTransactionLink transactionHash={transactionData.hash}>
        view transaction
      </EtherscanTransactionLink>
    ) : (
      ''
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
      onClick={onClickWithConfirm}
      type={type}
      disabled={disabled || status !== 'ready'}
      kind={kind}
      theme={theme}
      size={size}
      additionalClassNames={status === 'confirming' ? ['confirming'] : []}
      {...props}>
      {status === 'confirming' && 'Confirm in Wallet'}
      {status !== 'confirming' && text}
    </Button>
  );
}
