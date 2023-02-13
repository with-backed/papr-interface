import { render, screen } from '@testing-library/react';
import { DisplayAddress } from 'components/DisplayAddress';
import { DisplayAddressType } from 'components/DisplayAddress/DisplayAddress';
import { addressToENS } from 'lib/account';
import React from 'react';

const address = '0x0DD7D78Ed27632839cd2a929EE570eAd346C19fC';
const formattedAddressEllipsis = '0x0DD7…19fC';
const formattedAddressTruncated = '0x0DD7D7';
const ens = 'moonparty.eth';

jest.mock('lib/account', () => ({
  ...jest.requireActual('lib/account'),
  addressToENS: jest.fn(),
}));

const mockAddressToENS = addressToENS as jest.MockedFunction<
  typeof addressToENS
>;

describe('DisplayAddress', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAddressToENS.mockResolvedValue(ens);
  });
  it('renders a regular address correctly when the passed display type is ELLIPSIS', () => {
    const { getByText, getByTitle } = render(
      <DisplayAddress
        address={address}
        displayType={DisplayAddressType.ELLIPSIS}
        useEns={false}
      />,
    );

    getByTitle(address);
    getByText(formattedAddressEllipsis);
    expect(mockAddressToENS).not.toHaveBeenCalled();
  });

  it('renders a regular address correctly when the passed display type is TRUNCATED', () => {
    const { getByText, getByTitle } = render(
      <DisplayAddress
        address={address}
        displayType={DisplayAddressType.TRUNCATED}
        useEns={false}
      />,
    );
    getByTitle(address);
    getByText(formattedAddressTruncated);
    expect(mockAddressToENS).not.toHaveBeenCalled();
  });

  it('renders the address if there is no corresponding ENS name', async () => {
    mockAddressToENS.mockResolvedValue(null);
    render(<DisplayAddress address={address} />);

    await screen.findByText(formattedAddressEllipsis);
  });

  it('renders the ENS name if an address resolves to one', async () => {
    render(<DisplayAddress address={address} />);

    await screen.findByText(ens);
  });

  it('renders the address if an error occurs querying ENS', async () => {
    mockAddressToENS.mockImplementation(() => {
      throw new Error('fail');
    });
    render(<DisplayAddress address={address} />);

    await screen.findByText(formattedAddressEllipsis);
  });
});
