import type { FastifyPluginCallback, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import { createTimer } from './timer';
import { createLogger } from './logger';
import { resolveThresholds, evaluateThreshold } from './threshold';
import { createDefaultAlertHandlers } from './alert';
import type { RouteWatchOptions } from './types';

const routeWatchPlugin: FastifyPluginCallback<RouteWatchOptions> = (
  fastify,
  options,
  done
) => {
  const logger = createLogger(options.logger);
  const thresholds = resolveThresholds(options.thresholds);
  const alertHandlers = options.alertHandlers ?? createDefaultAlertHandlers(logger);

  fastify.addHook(
    'onResponse',
    async (req: FastifyRequest, reply: FastifyReply) => {
      const duration = reply.elapsedTime;
      const route = req.routerPath ?? req.url;
      const method = req.method;
      const status = reply.statusCode;

      const evaluation = evaluateThreshold(duration, route, thresholds);

      logger.log({
        method,
        route,
        status,
        duration,
        slow: evaluation.isSlow,
        level: evaluation.level,
      });

      if (evaluation.isSlow) {
        alertHandlers.forEach((handler) =>
          handler({ method, route, status, duration, level: evaluation.level })
        );
      }
    }
  );

  done();
};

export const routeWatch = fp(routeWatchPlugin, {
  name: 'routewatch',
  fastify: '4.x',
});
