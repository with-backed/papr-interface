import { renderHook } from '@testing-library/react-hooks';
import { useAsyncValue } from 'hooks/useAsyncValue';

let resolve = (s: string) => {};
const p = new Promise<string>((res) => {
  resolve = res;
});

describe('useAsyncValue', () => {
  it('starts null then updates', async () => {
    const { result, waitForValueToChange } = renderHook(() =>
      useAsyncValue(() => p, []),
    );

    expect(result.current).toEqual(null);

    resolve('a value');

    await waitForValueToChange(() => result.current);

    expect(result.current).toEqual('a value');
  });
});
