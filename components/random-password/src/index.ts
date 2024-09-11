import * as pulumi from '@pulumi/pulumi';
import * as random from '@pulumi/random';

interface RandomPasswordComponentProps {
  length?: number;
  import?: string;
}

export class RandomPasswordComponent extends pulumi.ComponentResource {
  public result?: pulumi.Output<string>;

  public constructor(
    private name: string,
    props: RandomPasswordComponentProps,
    opts?: pulumi.ComponentResourceOptions,
  ) {
    super('pkg:index:RandomPasswordComponent', name, {}, opts);

    const { length = 32 } = props;

    const password = new random.RandomPassword(
      this.name,
      {
        length: length,
        minLower: 2,
        minNumeric: 2,
        minUpper: 2,
        minSpecial: 1,
        special: true,
        overrideSpecial: `_-`,
      },
      {
        parent: this,
        ...(props.import ? { import: props.import } : {}),
      },
    );

    this.result = password.result;

    this.registerOutputs();
  }
}
