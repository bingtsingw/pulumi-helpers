import { AlicloudRdsDbComponent } from '@pulumi-helpers/component-alicloud-rds-db';
import { providers } from './_provider';

const instanceId = 'pgm-2zef4v0off1j60u0';

const pulumi = new AlicloudRdsDbComponent(
  'pulumi-helpers-dev',
  { instanceId: instanceId },
  { provider: providers.alicloud },
);

export const alicloudRds = {
  db: {
    name: pulumi.dbName,
    user: pulumi.accountName,
    pass: pulumi.accountPass,
  },
};
