import { AlicloudRamUserComponent } from '@pulumi-helpers/component-alicloud-ram-user';
import { providers } from './_provider';

const ramUser = new AlicloudRamUserComponent(
  'pulumi-helpers',
  {
    policy: JSON.stringify({
      Version: '1',
      Statement: [
        {
          Action: ['fc:CreateService', 'fc:GetService'],
          Resource: ['acs:fc:*:*:services/serverless-devs-check'],
          Effect: 'Allow',
        },
      ],
    }),
    enableAk: true,
  },
  { provider: providers.alicloud },
);

export const alicloudRamUser = {
  userName: ramUser.userName,
  ak: ramUser.ak,
  sk: ramUser.sk,
};
