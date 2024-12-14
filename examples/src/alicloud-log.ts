import { AlicloudLogComponent } from '@pulumi-helpers/component-alicloud-log';
import { providers } from './_provider';

const log = new AlicloudLogComponent('pulumi-helpers', { provider: providers.alicloud });

export const alicloudLog = {
  projectName: log.projectName,
  storeName: log.storeName,
};
