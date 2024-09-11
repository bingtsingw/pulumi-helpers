import * as pulumi from '@pulumi/pulumi';
import { PrivateKey } from '@pulumi/tls';
import { Certificate, Registration } from '@pulumiverse/acme';

interface AcmeCertComponentProps {
  email: string;
  dnsNames: string[];
  dnsChallenge: {
    provider: string;
    config?: Record<string, string | pulumi.Output<string>>;
  };
}

export class AcmeCertComponent extends pulumi.ComponentResource {
  public commonName: pulumi.Output<string>;
  public issuerPem: pulumi.Output<string>;
  public certificatePem: pulumi.Output<string>;
  public privateKeyPem: pulumi.Output<string>;

  public constructor(
    private name: string,
    props: AcmeCertComponentProps,
    opts?: pulumi.ComponentResourceOptions,
  ) {
    super('pkg:index:AcmeCertComponent', name, {}, opts);

    const privateKey = new PrivateKey(name, { algorithm: 'RSA', rsaBits: 4096 }, { parent: this });

    const reg = new Registration(
      name,
      {
        accountKeyPem: privateKey.privateKeyPem,
        emailAddress: props.email,
      },
      { parent: this },
    );

    const certificate = new Certificate(
      this.name,
      {
        accountKeyPem: reg.accountKeyPem,
        commonName: props.dnsNames[0],
        subjectAlternativeNames: props.dnsNames,
        dnsChallenges: [props.dnsChallenge],

        minDaysRemaining: 30,
        revokeCertificateOnDestroy: false,
      },
      { parent: this, replaceOnChanges: ['minDaysRemaining'] },
    );

    this.commonName = certificate.commonName as pulumi.Output<string>;
    this.certificatePem = certificate.certificatePem;
    this.privateKeyPem = certificate.privateKeyPem;
    this.issuerPem = certificate.issuerPem;

    this.registerOutputs();
  }
}