import { ethers } from 'ethers';
import { postControllerIPFS } from 'lib/ipfs';
import MerkleTree from 'lib/merkleTree';

const toBuffer = (address: string) => {
  return Buffer.from(
    ethers.utils.solidityKeccak256(['address'], [address]).substr(2),
    'hex',
  );
};

export async function constructMerkleTreeFromController(
  name: string,
  description: string,
  allowedNFTs: string[],
) {
  const merkleTree = new MerkleTree(allowedNFTs.map((a) => toBuffer(a)));

  const ipfsRes = await postControllerIPFS(
    name,
    description,
    merkleTree.getRoot().toString(),
    allowedNFTs,
  );

  return ipfsRes.IpfsHash;
}
