import { AlicloudLogComponent } from '@pulumi-helpers/component-alicloud-log';
import { Provider } from './_provider';

const log = new AlicloudLogComponent('pulumi-examples', { provider: Provider.Alicloud() });

export const alicloudLog = {
  projectName: log.projectName,
  storeName: log.storeName,
};
