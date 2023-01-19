import { render } from '@testing-library/react';
import { Footer } from 'components/Footer';

describe('Footer', () => {
  it('renders', () => {
    const { getByTestId } = render(<Footer />);

    getByTestId('footer');
  });
});
