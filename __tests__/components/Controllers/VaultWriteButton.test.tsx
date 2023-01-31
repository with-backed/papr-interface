import React from 'react';
import { render } from '@testing-library/react';
import { useVaultWrite } from 'hooks/useVaultWrite';
import { VaultWriteButton } from 'components/Controllers/OpenVault/VaultWriteButton';
import { ethers } from 'ethers';
import { VaultWriteType } from 'hooks/useVaultWrite/helpers';
import userEvent from '@testing-library/user-event';

jest.mock('hooks/useVaultWrite/useVaultWrite', () => ({
  useVaultWrite: jest.fn(),
}));

const mockedUseVaultWrite = useVaultWrite as jest.MockedFunction<
  typeof useVaultWrite
>;

describe('VaultWriteButton', () => {
  const data = undefined;
  const write = jest.fn();
  const error = null;

  beforeAll(() => {
    mockedUseVaultWrite.mockReturnValue({
      data,
      write,
      error,
    });
  });
  it('renders Borrow button when vault has no debt and calls write when button is clicked', () => {
    const { getByText } = render(
      <VaultWriteButton
        amount={ethers.BigNumber.from(0)}
        quote={ethers.BigNumber.from(0)}
        collateralContractAddress={'0xape'}
        depositNFTs={[]}
        writeType={VaultWriteType.Borrow}
        refresh={() => null}
        withdrawNFTs={[]}
        vaultHasDebt={false}
        disabled={false}
      />,
    );
    const button = getByText('Borrow');
    userEvent.click(button);
    expect(write).toHaveBeenCalled();
  });

  it('renders Update Loan button when vault has debt and calls write when button is clicked', () => {
    const { getByText } = render(
      <VaultWriteButton
        amount={ethers.BigNumber.from(0)}
        quote={ethers.BigNumber.from(0)}
        collateralContractAddress={'0xape'}
        depositNFTs={[]}
        writeType={VaultWriteType.Borrow}
        refresh={() => null}
        withdrawNFTs={[]}
        vaultHasDebt
        disabled={false}
      />,
    );
    const button = getByText('Update Loan');
    userEvent.click(button);
    expect(write).toHaveBeenCalled();
  });
});
