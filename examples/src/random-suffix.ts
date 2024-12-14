import { RandomSuffixComponent } from '@pulumi-helpers/component-random-suffix';

export const randomSuffix = new RandomSuffixComponent('pulumi-helpers', { length: 10 }).result;
