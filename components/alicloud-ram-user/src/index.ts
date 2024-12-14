import { RandomSuffixComponent } from '@pulumi-helpers/component-random-suffix';
import * as alicloud from '@pulumi/alicloud';
import * as pulumi from '@pulumi/pulumi';

interface AlicloudRamUserProps {
  policy?: pulumi.Input<string>;
  enableAk?: boolean;
}

export class AlicloudRamUserComponent extends pulumi.ComponentResource {
  public userName: pulumi.Output<string>;
  public ak!: pulumi.Output<string>;
  public sk!: pulumi.Output<string>;

  public constructor(
    private name: string,
    private props: AlicloudRamUserProps,
    opts?: pulumi.ComponentResourceOptions,
  ) {
    super('pkg:index:AlicloudRamUserComponent', name, {}, opts);

    const user = new alicloud.ram.User(name, { displayName: name }, { parent: this });

    if (props.policy) {
      this.createPolicy(user);
    }

    if (props.enableAk) {
      this.createAk(user);
    }

    this.userName = user.name;

    this.registerOutputs();
  }

  private createPolicy(user: alicloud.ram.User) {
    const suffix = new RandomSuffixComponent(this.name, { length: 7 }, { parent: this });

    const _policy = new alicloud.ram.Policy(
      this.name,
      {
        policyName: pulumi.interpolate`${this.name}-${suffix.result}`,
        policyDocument: this.props.policy,
        description: `policy for ram user '${this.name}'`,
      },
      { parent: this },
    );

    new alicloud.ram.UserPolicyAttachment(
      this.name,
      {
        userName: user.name,
        policyName: _policy.policyName,
        policyType: _policy.type,
      },
      { parent: this },
    );
  }

  private createAk(user: alicloud.ram.User) {
    const ak = new alicloud.ram.AccessKey(this.name, { userName: user.name }, { parent: this });

    this.ak = ak.id;
    this.sk = ak.secret;
  }
}
