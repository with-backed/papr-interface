export type WebhookEntity = 'add_collateral_event' | 'remove_collateral_event';

export type WebhookOp = 'INSERT' | 'UPDATE' | 'DELETE';

export type WebhookRequestBody = {
  op: WebhookOp;
  data: {
    old: any;
    new: any;
  };
  entity: WebhookEntity;
};
