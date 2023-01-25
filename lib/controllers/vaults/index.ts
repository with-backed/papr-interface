export const generateVaultId = (
  controller: string,
  account: string,
  asset: string,
) =>
  `${controller.toLowerCase()}-${account.toLowerCase()}-${asset.toLowerCase()}`;
