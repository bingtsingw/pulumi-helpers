import * as alicloud from '@pulumi/alicloud';
import * as pulumi from '@pulumi/pulumi';

interface AlicloudCdnProps {
  resourceGroupId: string;
  type: 'web' | 'download' | 'video';
  scope: 'domestic' | 'overseas' | 'global';
  sources: { content: string; type: 'oss' | 'ipaddr' | 'domain'; port: number }[];
  domain: { host: string; record: string };
  cert?: { pub: string; pri: string };
}

/**
 * 创建cdn, 并且配置dns, https.
 */
export class AlicloudCdnComponent extends pulumi.ComponentResource {
  private cdnName: string;
  private dnsName: string;
  private host: string;

  public constructor(
    private name: string,
    private props: AlicloudCdnProps,
    opts?: pulumi.ComponentResourceOptions,
  ) {
    super('pkg:index:AlicloudCdnComponent', name, {}, opts);

    this.cdnName = `${this.name}-cdn`;
    this.dnsName = `${this.cdnName}-dns`;
    this.host = `${this.props.domain.record}.${this.props.domain.host}`;

    const cdn = this.createCdn();

    this.configBasic(cdn);

    this.configHttps(cdn);

    this.registerOutputs();
  }

  private createCdn() {
    const cdn = new alicloud.cdn.DomainNew(
      this.cdnName,
      {
        resourceGroupId: this.props.resourceGroupId,
        cdnType: this.props.type,
        scope: this.props.scope,
        sources: this.props.sources,
        domainName: this.host,
        ...(this.props.cert
          ? {
              certificateConfig: {
                certType: 'upload',
                privateKey: this.props.cert.pri,
                serverCertificate: this.props.cert.pub,
              },
            }
          : {}),
      },
      { parent: this },
    );

    new alicloud.dns.Record(
      this.dnsName,
      {
        hostRecord: this.props.domain.record,
        name: this.props.domain.host,
        type: 'CNAME',
        value: cdn.cname,
      },
      { parent: this },
    );

    return cdn;
  }

  private configBasic(cdn: alicloud.cdn.DomainNew) {
    // IPv6开关
    new alicloud.cdn.DomainConfig(
      `${this.cdnName}-ipv6`,
      {
        domainName: cdn.domainName,
        functionName: 'ipv6',
        functionArgs: [
          { argName: 'switch', argValue: 'on' },
          { argName: 'region', argValue: '*' },
        ],
      },
      { parent: this },
    );

    // 回源HOST
    new alicloud.cdn.DomainConfig(
      `${this.cdnName}-set_req_host_header`,
      {
        domainName: cdn.domainName,
        functionName: 'set_req_host_header',
        functionArgs: [{ argName: 'domain_name', argValue: this.props.sources[0]!.content }],
      },
      { parent: this },
    );

    // 回源协议
    new alicloud.cdn.DomainConfig(
      `${this.cdnName}-forward_scheme`,
      {
        domainName: cdn.domainName,
        functionName: 'forward_scheme',
        functionArgs: [
          { argName: 'enable', argValue: 'on' },
          { argName: 'scheme_origin', argValue: 'https' },
        ],
      },
      { parent: this },
    );
  }

  private configHttps(cdn: alicloud.cdn.DomainNew) {
    // HTTP/2 OCSP设置
    new alicloud.cdn.DomainConfig(
      `${this.cdnName}-https_option`,
      {
        domainName: cdn.domainName,
        functionName: 'https_option',
        functionArgs: [
          { argName: 'http2', argValue: 'on' },
          { argName: 'ocsp_stapling', argValue: 'on' },
        ],
      },
      { parent: this, ignoreChanges: ['functionArgs'] },
    );

    // 强制跳转
    new alicloud.cdn.DomainConfig(
      `${this.cdnName}-https_force`,
      {
        domainName: cdn.domainName,
        functionName: 'https_force',
        functionArgs: [{ argName: 'enable', argValue: 'on' }],
      },
      { parent: this },
    );

    // TLS版本
    new alicloud.cdn.DomainConfig(
      `${this.cdnName}-https_tls_version`,
      {
        domainName: cdn.domainName,
        functionName: 'https_tls_version',
        functionArgs: [
          { argName: 'tls10', argValue: 'on' },
          { argName: 'tls11', argValue: 'on' },
          { argName: 'tls12', argValue: 'on' },
          { argName: 'tls13', argValue: 'on' },
        ],
      },
      { parent: this },
    );

    // HSTS
    new alicloud.cdn.DomainConfig(
      `${this.cdnName}-hsts`,
      {
        domainName: cdn.domainName,
        functionName: 'HSTS',
        functionArgs: [
          { argName: 'enabled', argValue: 'on' },
          { argName: 'https_hsts_max_age', argValue: '5184000' },
        ],
      },
      { parent: this },
    );
  }
}
