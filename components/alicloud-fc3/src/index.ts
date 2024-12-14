import { AlicloudLogComponent } from '@pulumi-helpers/component-alicloud-log';
import { AlicloudRamUserComponent } from '@pulumi-helpers/component-alicloud-ram-user';
import { RandomSuffixComponent } from '@pulumi-helpers/component-random-suffix';
import * as alicloud from '@pulumi/alicloud';
import type { V3Function } from '@pulumi/alicloud/fc';
import * as pulumi from '@pulumi/pulumi';

interface AlicloudFcProps {
  enableLog?: boolean;
  enableRam?: boolean;
  runtime?: 'custom.debian10';
  domain?: {
    cname: string;
    host: string;
    certName: string;
    certCert: string;
    certKey: string;

    routes: {
      record: string;
      qualifier: 'online' | 'preview';
    }[];
  };
}

export class AlicloudFc3Component extends pulumi.ComponentResource {
  public ak!: pulumi.Output<string>;
  public sk!: pulumi.Output<string>;
  public functionName!: pulumi.Output<string>;

  public constructor(
    private name: string,
    private props: AlicloudFcProps,
    opts: pulumi.ComponentResourceOptions,
  ) {
    super('pkg:index:AlicloudFc3Component', name, {}, opts);
    const { enableLog = true, enableRam = true } = props;

    let log: AlicloudLogComponent | undefined;
    if (enableLog) {
      log = this.createLog();
    }

    const fc = this.createFunction(log);
    this.functionName = fc.functionName;

    this.createDomain(fc);

    if (enableRam) {
      this.createRamUser(fc);
    }

    this.registerOutputs();
  }

  private createRamUser(fc: V3Function) {
    const user = new AlicloudRamUserComponent(
      this.name,
      {
        policy: fc.functionName.apply((funcName) =>
          JSON.stringify({
            Version: '1',
            Statement: [
              // serverless-devs-check
              {
                Action: ['fc:CreateService', 'fc:GetService'],
                Resource: ['acs:fc:*:*:services/serverless-devs-check'],
                Effect: 'Allow',
              },
              {
                Action: ['fc:CreateFunction', 'fc:GetFunction', 'fc:UpdateFunction', 'fc:DeleteFunction'],
                Resource: ['acs:fc:*:*:services/serverless-devs-check/functions/*'],
                Effect: 'Allow',
              },
              {
                Action: ['fc:CreateTrigger', 'fc:GetTrigger', 'fc:DeleteTrigger'],
                Resource: ['acs:fc:*:*:services/serverless-devs-check/functions/*/triggers/*'],
                Effect: 'Allow',
              },

              // layer
              {
                Action: ['fc:ListLayers'],
                Resource: ['acs:fc:*:*:layers/*'],
                Effect: 'Allow',
              },
              {
                Action: ['fc:CreateLayerVersion'],
                Resource: ['acs:fc:*:*:layers/*/versions/*'],
                Effect: 'Allow',
              },

              // domain
              {
                Action: ['fc:GetCustomDomain', 'fc:CreateCustomDomain', 'fc:UpdateCustomDomain'],
                Resource: [`acs:fc:*:*:custom-domains/*`],
                Effect: 'Allow',
              },

              // function
              {
                Action: ['fc:GetFunction', 'fc:UpdateFunction'],
                Resource: [`acs:fc:*:*:functions/${funcName}`],
                Effect: 'Allow',
              },
              {
                Action: ['fc:GetAlias', 'fc:CreateAlias', 'fc:UpdateAlias'],
                Resource: [`acs:fc:*:*:functions/${funcName}/aliases/*`],
                Effect: 'Allow',
              },
              {
                Action: ['fc:GetTrigger', 'fc:CreateTrigger', 'fc:UpdateTrigger', 'fc:DeleteTrigger'],
                Resource: [`acs:fc:*:*:functions/${funcName}/triggers/*`],
                Effect: 'Allow',
              },
              {
                Action: ['fc:PublishFunctionVersion'],
                Resource: [`acs:fc:*:*:functions/${funcName}/versions/*`],
                Effect: 'Allow',
              },
            ],
          }),
        ),
        enableAk: true,
      },
      { parent: this },
    );

    this.ak = user.ak;
    this.sk = user.sk;

    return user;
  }

  private createFunction(log?: AlicloudLogComponent) {
    const suffix = new RandomSuffixComponent(this.name, {});

    return new alicloud.fc.V3Function(
      this.name,
      {
        functionName: pulumi.interpolate`${this.name}-${suffix.result}`,
        internetAccess: true,
        runtime: this.props.runtime || 'custom.debian10',
        handler: 'index.handler',
        code: {
          zipFile:
            'UEsDBBQACAAIAJOGJVUAAAAAAAAAAKICAAAIACAAaW5kZXguanNVVA0AB9e4FWPiuBVj17gVY3V4CwABBPUBAAAEFAAAAG2SwU7DMAyG730K35Kirr0zjQNIiHEAtMEJcchWbw1kSZekbBXau5PUKSC0Sxv7/2zHf1tdADoltZ/U0omVQrioMoUetugX4nBt6h5mYHHfSYucWXGYrEKO5dORujV29x+LSLUJwsitzgBRy/DYGutd2QhdK7SB4QEqAunaAtZGezz6HGZX8JVBjJ1RWCqz5axBpQwcjFX10AogTmqFFTsX+kQeQuibyzi3jKdiyO07tBIdpVNASoOiRpuUFJCyQ9+YmgQ6Uz5uhM6/LOakdVaRsFYStZ8/UXqMonYa7vrrLy3M0dpi8OlnW4BgIfC41Qf2IPXfC+cJoa0/heqQDB6B11DzNk1MtLN06O+GnXiQCqrJiThlZyh2E+0Pv8Zz3yIrgIm2VXItvDS6endGs1RNnpfpI8dX6c3SW6m3PCGpta75/fLxoXSDKDc9p9oCdKdUGBFZlg9Fp/AMXn0DUEsHCNdrlPNeAQAAogIAAFBLAQIUAxQACAAIAJOGJVXXa5TzXgEAAKICAAAIACAAAAAAAAAAAACkgQAAAABpbmRleC5qc1VUDQAH17gVY+K4FWPXuBVjdXgLAAEE9QEAAAQUAAAAUEsFBgAAAAABAAEAVgAAALQBAAAAAA==',
        },
        cpu: 0.05,
        memorySize: 128,
        diskSize: 512,
        ...(log
          ? {
              logConfig: {
                logstore: log.storeName,
                project: log.projectName,
                enableInstanceMetrics: true,
                enableRequestMetrics: true,
              },
            }
          : {}),
      },
      { parent: this },
    );
  }

  private createLog() {
    return new AlicloudLogComponent(this.name, { parent: this });
  }

  private createDomain(fc: V3Function) {
    if (!this.props.domain) {
      return;
    }

    for (const route of this.props.domain.routes) {
      const name = `${this.name}-${route.record}`;
      new alicloud.dns.Record(
        name,
        {
          hostRecord: route.record,
          name: this.props.domain.host,
          type: 'CNAME',
          value: this.props.domain.cname,
        },
        { parent: this },
      );

      new alicloud.fc.V3CustomDomain(
        name,
        {
          routeConfig: {
            routes: [
              {
                path: '/*',
                functionName: fc.functionName,
                qualifier: route.qualifier,
              },
            ],
          },
          certConfig: {
            certName: this.props.domain.certName,
            certificate: this.props.domain.certCert,
            privateKey: this.props.domain.certKey,
          },
        },
        { parent: this, ignoreChanges: ['certConfig'] },
      );
    }
  }
}
