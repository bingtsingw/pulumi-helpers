import { AlicloudLogComponent } from '@pulumi-helpers/component-alicloud-log';
import { Provider } from './provider';

new AlicloudLogComponent('pulumi-examples', { provider: Provider.Alicloud() });
