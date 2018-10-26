import iam = require('@aws-cdk/aws-iam');
import cdk = require('@aws-cdk/cdk');
import { ScalableTarget, ScalingSchedule, ServiceNamespace } from './scalable-target';
import { BasicStepScalingPolicyProps } from './step-scaling-policy';
import { BasicTargetTrackingScalingPolicyProps } from './target-tracking-scaling-policy';

/**
 * Properties for a ScalableTableAttribute
 */
export interface BaseScalableAttributeProps extends EnableScalingProps {
  /**
   * Service namespace of the scalable attribute
   */
  serviceNamespace: ServiceNamespace;

  /**
   * Resource ID of the attribute
   */
  resourceId: string;

  /**
   * Scalable dimension of the attribute
   */
  dimension: string;

  /**
   * Role to use for scaling
   */
  role: iam.IRole;
}

/**
 * Represent an attribute for which autoscaling can be configured
 *
 * This class is basically a light wrapper around ScalableTarget, but with
 * all methods protected instead of public so they can be selectively
 * exposed and/or more specific versions of them can be exposed by derived
 * classes for individual services support autoscaling.
 *
 * Typical use cases:
 *
 * - Hide away the PredefinedMetric enum for target tracking policies.
 * - Don't expose all scaling methods (for example Dynamo tables don't support
 *   Step Scaling, so the Dynamo subclass won't expose this method).
 */
export abstract class BaseScalableAttribute extends cdk.Construct {
  private target: ScalableTarget;

  public constructor(parent: cdk.Construct, id: string, protected readonly props: BaseScalableAttributeProps) {
    super(parent, id);

    this.target = new ScalableTarget(this, 'Target', {
      serviceNamespace: this.props.serviceNamespace,
      scalableDimension: this.props.dimension,
      resourceId: this.props.resourceId,
      role: this.props.role,
      minCapacity: props.minCapacity !== undefined ? props.minCapacity : 1,
      maxCapacity: props.maxCapacity
    });
  }

  /**
   * Scale out or in based on time
   */
  protected scaleOnSchedule(id: string, props: ScalingSchedule) {
    this.target.scaleOnSchedule(id, props);
  }

  /**
   * Scale out or in based on a metric value
   */
  protected scaleOnMetric(id: string, props: BasicStepScalingPolicyProps) {
    this.target.scaleOnMetric(id, props);
  }

  /**
   * Scale out or in in order to keep a metric around a target value
   */
  protected scaleToTrackMetric(id: string, props: BasicTargetTrackingScalingPolicyProps) {
    this.target.scaleToTrackMetric(id, props);
  }
}

/**
 * Properties for enabling DynamoDB capacity scaling
 */
export interface EnableScalingProps {
  /**
   * Minimum capacity to scale to
   *
   * @default 1
   */
  minCapacity?: number;

  /**
   * Maximum capacity to scale to
   */
  maxCapacity: number;
}
