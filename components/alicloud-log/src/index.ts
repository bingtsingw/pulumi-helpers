import { RandomSuffixComponent } from '@pulumi-helpers/component-random-suffix';
import * as alicloud from '@pulumi/alicloud';
import * as pulumi from '@pulumi/pulumi';

export class AlicloudLogComponent extends pulumi.ComponentResource {
  public projectName: pulumi.Output<string>;
  public storeName: pulumi.Output<string>;

  public constructor(name: string, opts?: pulumi.ComponentResourceOptions) {
    super('pkg:index:AlicloudLogComponent', name, {}, opts);

    const suffix = new RandomSuffixComponent(name, { length: 7 }, { parent: this });
    const _project = new alicloud.log.Project(
      name,
      { projectName: pulumi.interpolate`${name}-${suffix.result}` },
      { parent: this },
    );

    const _store = new alicloud.log.Store(
      name,
      {
        logstoreName: pulumi.interpolate`${name}-${suffix.result}`,
        projectName: _project.projectName,
        shardCount: 1,
        autoSplit: true,
        maxSplitShardCount: 60,
        retentionPeriod: 3650,
      },
      { parent: this },
    );

    new alicloud.log.StoreIndex(
      name,
      {
        project: _project.projectName,
        logstore: _store.logstoreName,
        fullText: {
          caseSensitive: false,
          includeChinese: false,
          token: ', \'";=()[]{}?@&<>/:\n\t\r',
        },
      },
      { parent: this },
    );

    this.projectName = _project.projectName;
    this.storeName = _store.logstoreName;

    this.registerOutputs();
  }
}
