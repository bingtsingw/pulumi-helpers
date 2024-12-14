import { AlicloudFc3Component } from '@pulumi-helpers/component-alicloud-fc3';
import { providers } from './_provider';

const fc = new AlicloudFc3Component(
  'fc-pulumi-helpers',
  {
    enableLog: true,
    enableRam: true,
  },
  { provider: providers.alicloud },
);

export const alicloudFc3 = {
  ak: fc.ak,
  sk: fc.sk,
};
