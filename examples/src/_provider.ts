import * as alicloud from '@pulumi/alicloud';
import * as pulumi from '@pulumi/pulumi';

export const Provider = {
  Alicloud: (region = 'cn-beijing') => {
    return new alicloud.Provider(`pulumi-helpers-alicloud-${region}`, {
      accessKey: process.env['ALICLOUD_NANMU_AK']!,
      secretKey: pulumi.secret(process.env['ALICLOUD_NANMU_SK']!),
      region,
    });
  },
};
