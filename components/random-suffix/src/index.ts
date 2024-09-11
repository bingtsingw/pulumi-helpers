import * as pulumi from '@pulumi/pulumi';
import * as random from '@pulumi/random';

interface Props {
  length?: number;
  import?: string;
}

export class RandomSuffixComponent extends pulumi.ComponentResource {
  public result?: pulumi.Output<string>;

  public constructor(
    private name: string,
    props: Props,
    opts?: pulumi.ComponentResourceOptions,
  ) {
    super('pkg:index:RandomSuffixComponent', name, {}, opts);

    const { length = 7 } = props;

    const suffix = new random.RandomString(
      this.name,
      {
        length: length,
        upper: false,
        special: false,
        minLower: 2,
        minNumeric: 2,
      },
      { parent: this, ...(props.import ? { import: props.import } : {}) },
    );

    this.result = suffix.result;

    this.registerOutputs();
  }
}
