import { AlicloudOssComponent } from '@pulumi-helpers/component-alicloud-oss';
import { providers } from './_provider';

const oss = new AlicloudOssComponent(
  'pulumi-helpers',
  {
    enableRam: true,
  },
  { provider: providers.alicloud },
);

export const alicloudOss = {
  ak: oss.ak,
  sk: oss.sk,
};
