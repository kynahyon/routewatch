import { ThresholdResult } from './threshold';
import { Logger } from './logger';

export interface AlertContext {
  method: string;
  route: string;
  statusCode: number;
  thresholdResult: ThresholdResult;
}

export type AlertHandler = (context: AlertContext) => void | Promise<void>;

export interface AlertConfig {
  onWarn?: AlertHandler;
  onCritical?: AlertHandler;
}

export function createDefaultAlertHandlers(logger: Logger): AlertConfig {
  return {
    onWarn: (ctx) => {
      logger.warn(
        `Slow route detected: ${ctx.method} ${ctx.route} took ${
          ctx.thresholdResult.durationMs
        }ms (warn threshold: ${ctx.thresholdResult.warnMs}ms)`
      );
    },
    onCritical: (ctx) => {
      logger.error(
        `Critical slow route: ${ctx.method} ${ctx.route} took ${
          ctx.thresholdResult.durationMs
        }ms (critical threshold: ${ctx.thresholdResult.criticalMs}ms)`
      );
    },
  };
}

export async function dispatchAlert(
  context: AlertContext,
  config: AlertConfig
): Promise<void> {
  const { level } = context.thresholdResult;

  if (level === 'critical' && config.onCritical) {
    await config.onCritical(context);
  } else if (level === 'warn' && config.onWarn) {
    await config.onWarn(context);
  }
}
