import { RandomPasswordComponent } from '@pulumi-helpers/component-random-password';

export const randomPassword = new RandomPasswordComponent('pulumi-helpers', { length: 32 }).result;
