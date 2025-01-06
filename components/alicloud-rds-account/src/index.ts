import { RandomPasswordComponent } from '@pulumi-helpers/component-random-password';
import { RandomSuffixComponent } from '@pulumi-helpers/component-random-suffix';
import * as alicloud from '@pulumi/alicloud';
import * as pulumi from '@pulumi/pulumi';
import { snakeCase } from 'es-toolkit';

interface Props {
  instanceId: pulumi.Input<string>;
  accountType: pulumi.Input<'Normal' | 'Super'>;
  imports?: {
    accountPassword: string;
    accountSuffix: string;
    account: string;
  };
}

export class AlicloudRdsAccountComponent extends pulumi.ComponentResource {
  public accountName: pulumi.Output<string>;
  public accountPass: pulumi.Output<string>;

  public constructor(
    private name: string,
    props: Props,
    opts?: pulumi.ComponentResourceOptions,
  ) {
    super('pkg:index:AlicloudRdsAccountComponent', name, {}, opts);

    const accountPassword = new RandomPasswordComponent(
      this.name,
      { import: props.imports?.accountPassword },
      { parent: this },
    );

    const accountSuffix = new RandomSuffixComponent(
      this.name,
      { import: props.imports?.accountSuffix },
      { parent: this },
    );

    const account = new alicloud.rds.Account(
      this.name,
      {
        dbInstanceId: props.instanceId,
        accountType: props.accountType,
        accountName: pulumi.interpolate`${snakeCase(this.name)}_${accountSuffix.result}`,
        accountPassword: accountPassword.result,
      },
      { parent: this, ...(props.imports?.account ? { import: props.imports.account } : {}) },
    );

    this.accountName = account.accountName;
    this.accountPass = account.accountPassword;

    this.registerOutputs();
  }
}
