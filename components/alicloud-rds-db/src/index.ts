import { AlicloudRdsAccountComponent } from '@pulumi-helpers/component-alicloud-rds-account';
import * as alicloud from '@pulumi/alicloud';
import * as pulumi from '@pulumi/pulumi';

interface Props {
  instanceId: pulumi.Input<string>;
}

export class AlicloudRdsDbComponent extends pulumi.ComponentResource {
  public dbName?: pulumi.Output<string>;
  public accountName?: pulumi.Output<string>;
  public accountPass?: pulumi.Output<string>;

  public constructor(
    private name: string,
    private props: Props,
    opts?: pulumi.ComponentResourceOptions,
  ) {
    super('pkg:index:AlicloudRdsDbComponent', name, {}, opts);

    const db = new alicloud.rds.Database(
      this.name,
      {
        instanceId: this.props.instanceId,
        characterSet: 'UTF8',
      },
      { parent: this },
    );

    const account = new AlicloudRdsAccountComponent(
      this.name,
      {
        instanceId: this.props.instanceId,
        accountType: 'Normal',
      },
      { parent: this },
    );

    new alicloud.rds.AccountPrivilege(
      this.name,
      {
        instanceId: this.props.instanceId,
        accountName: account.accountName,
        dbNames: [db.name],
        privilege: 'DBOwner',
      },
      { parent: this },
    );

    this.dbName = db.name;
    this.accountName = account.accountName;
    this.accountPass = account.accountPass;

    this.registerOutputs();
  }
}
