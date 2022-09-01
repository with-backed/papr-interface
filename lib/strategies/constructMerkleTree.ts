import { ethers } from 'ethers';
import { postStrategyIPFS } from 'lib/ipfs';
import MerkleTree from 'lib/merkleTree';

const toBuffer = (address: string) => {
  return Buffer.from(
    ethers.utils.solidityKeccak256(['address'], [address]).substr(2),
    'hex',
  );
};

export async function constructMerkleTreeFromStrategy(
  name: string,
  description: string,
  allowedNFTs: string[],
) {
  const merkleTree = new MerkleTree(allowedNFTs.map((a) => toBuffer(a)));

  const ipfsRes = await postStrategyIPFS(
    name,
    description,
    merkleTree.getRoot().toString(),
    allowedNFTs,
  );

  return ipfsRes.IpfsHash;
}
