import pinataSDK from '@pinata/sdk';

const pinata = pinataSDK(
  process.env.PINATA_API_KEY!,
  process.env.PINATA_SECRET_KEY!,
);

export async function postControllerIPFS(
  name: string,
  description: string,
  root: string,
  nodes: string[],
) {
  const ipfsObj: { [key: string]: any } = {};

  ipfsObj['name'] = name;
  ipfsObj['description'] = description;
  ipfsObj['merkleRoot'] = root;
  ipfsObj['allowedContractAddresses'] = nodes;

  const res = await pinata.pinJSONToIPFS(ipfsObj);

  return res;
}
