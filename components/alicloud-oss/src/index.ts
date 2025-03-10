import { AlicloudCdnComponent } from '@pulumi-helpers/component-alicloud-cdn';
import { AlicloudRamUserComponent } from '@pulumi-helpers/component-alicloud-ram-user';
import { RandomSuffixComponent } from '@pulumi-helpers/component-random-suffix';
import * as alicloud from '@pulumi/alicloud';
import type { Bucket } from '@pulumi/alicloud/oss';
import * as pulumi from '@pulumi/pulumi';

interface AlicloudOssProps {
  withSuffix?: boolean;
  log?: string;
  acl?: 'private' | 'public-read' | 'public-read-write';
  storageClass?: 'Standard' | 'IA' | 'Archive' | 'ColdArchive' | 'DeepColdArchive';
  redundancyType?: 'LRS' | 'ZRS';
  enableCorsRules?: boolean;
  enableRam?: boolean;
  enableCdn?: {
    resourceGroupId: string;
    type: 'web' | 'download' | 'video';
    scope: 'domestic' | 'overseas' | 'global';
    domain: { host: string; record: string };
    cert?: { pub: string; pri: string };
  };
}

export class AlicloudOssComponent extends pulumi.ComponentResource {
  public ak?: pulumi.Output<string>;
  public sk?: pulumi.Output<string>;
  public bucket?: pulumi.Output<string>;

  public constructor(
    private name: string,
    private props: AlicloudOssProps,
    opts?: pulumi.ComponentResourceOptions,
  ) {
    super('pkg:index:AlicloudOssComponent', name, {}, opts);

    const oss = this.createOss();

    if (props.enableRam) {
      this.createRam(oss);
    }

    if (props.enableCdn) {
      this.createCdn(oss);
    }

    this.registerOutputs();
  }

  private createOss() {
    const { acl = 'public-read', storageClass = 'Standard', redundancyType = 'LRS', log } = this.props;

    let bucket: pulumi.Input<string>;

    if (this.props.withSuffix) {
      const suffix = new RandomSuffixComponent(this.name, { length: 7 }, { parent: this });
      bucket = pulumi.interpolate`${this.name}-${suffix.result}`;
    } else {
      bucket = pulumi.output(this.name);
    }

    const bucketArgs: alicloud.oss.BucketArgs = {
      bucket,
      storageClass,
      redundancyType,
      serverSideEncryptionRule: { sseAlgorithm: 'AES256' },
      transferAcceleration: { enabled: false },
    };

    if (log) {
      bucketArgs.logging = {
        targetBucket: log,
        targetPrefix: pulumi.interpolate`oss-access/${bucket}/`,
      };
    }

    if (this.props.enableCorsRules) {
      bucketArgs.corsRules = [
        {
          allowedHeaders: ['*'],
          allowedMethods: ['GET', 'POST'],
          allowedOrigins: ['*'],
          exposeHeaders: [],
          maxAgeSeconds: 0,
        },
      ];
    }

    const oss = new alicloud.oss.Bucket(this.name, bucketArgs, { parent: this });

    new alicloud.oss.BucketAcl(this.name, { bucket: oss.id, acl }, { parent: this });

    this.bucket = oss.id;

    return oss;
  }

  private createRam(oss: Bucket) {
    const bucketName = this.name;
    const ramName = `oss-${bucketName}-ram`;

    const ram = new AlicloudRamUserComponent(
      ramName,
      {
        policy: oss.id.apply((_id) =>
          JSON.stringify({
            Statement: [
              {
                Effect: 'Allow',
                Action: 'oss:*',
                Resource: [`acs:oss:*:*:${_id}`, `acs:oss:*:*:${_id}/*`],
              },
            ],
            Version: '1',
          }),
        ),
        enableAk: true,
      },
      { parent: this },
    );

    this.ak = ram.ak;
    this.sk = ram.sk;
  }

  private createCdn(oss: alicloud.oss.Bucket) {
    if (!this.props.enableCdn) {
      return;
    }

    const cdnName = `oss-${this.name}-cdn`;

    new AlicloudCdnComponent(
      cdnName,
      {
        resourceGroupId: this.props.enableCdn.resourceGroupId,
        type: this.props.enableCdn.type,
        scope: this.props.enableCdn.scope,
        sources: [
          { content: pulumi.interpolate`${oss.bucket}.${oss.extranetEndpoint}` as any, type: 'oss', port: 443 },
        ],
        domain: { host: this.props.enableCdn.domain.host, record: this.props.enableCdn.domain.record },
        cert: this.props.enableCdn.cert,
      },
      { parent: this },
    );
  }
}
