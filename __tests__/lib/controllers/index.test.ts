import { ethers } from 'ethers';
import { computeNewProjectedAPR } from 'lib/controllers';

jest.mock('lib/contracts', () => ({
  jsonRpcControllerContract: jest.fn().mockReturnValue({
    targetMarkRatioMax: () => ethers.utils.parseEther('3'),
    targetMarkRatioMin: () => ethers.utils.parseEther('0.5'),
    fundingPeriod: () => ethers.BigNumber.from(7776000),
  }),
}));

describe('computeNewProjectedAPR', () => {
  const target = 1.0;

  it('returns an APR of 0% if target and mark are the same', async () => {
    const mark = 1.0;
    const result = await computeNewProjectedAPR(mark, target, 600, 'paprTrash');
    expect(result).toEqual(expect.objectContaining({ newApr: 0 }));
  });

  it('returns a constrained APR indicating negative interest rates if mark goes up too much', async () => {
    let mark = 10.0;
    let result = await computeNewProjectedAPR(mark, target, 600, 'paprTrash');
    expect(result).toEqual(
      expect.objectContaining({ newApr: -2.8110217265187742 }),
    );

    mark = 20.0;
    result = await computeNewProjectedAPR(mark, target, 600, 'paprTrash');
    expect(result).toEqual(
      expect.objectContaining({ newApr: -2.8110217265187742 }),
    );
  });

  it('returns a constrained APR indicating positive interest rates if mark goes down too much', async () => {
    let mark = 0.1;
    let result = await computeNewProjectedAPR(mark, target, 600, 'paprTrash');
    expect(result).toEqual(
      expect.objectContaining({ newApr: 4.4556720205165234 }),
    );

    mark = 0.001;
    result = await computeNewProjectedAPR(mark, target, 600, 'paprTrash');
    expect(result).toEqual(
      expect.objectContaining({ newApr: 4.4556720205165234 }),
    );
  });
});
