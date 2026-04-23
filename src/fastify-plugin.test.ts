import Fastify from 'fastify';
import { routeWatch } from './fastify-plugin';

async function buildApp(options = {}) {
  const app = Fastify();
  await app.register(routeWatch, options);
  app.get('/api/hello', async () => ({ message: 'hello' }));
  return app;
}

describe('routeWatch Fastify plugin', () => {
  it('should respond normally with plugin registered', async () => {
    const app = await buildApp();
    const res = await app.inject({ method: 'GET', url: '/api/hello' });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toEqual({ message: 'hello' });
    await app.close();
  });

  it('should invoke alert handler for slow threshold of 0ms', async () => {
    const alertHandler = jest.fn();
    const app = await buildApp({
      thresholds: { default: 0 },
      alertHandlers: [alertHandler],
    });

    await app.inject({ method: 'GET', url: '/api/hello' });
    expect(alertHandler).toHaveBeenCalledTimes(1);
    expect(alertHandler.mock.calls[0][0]).toMatchObject({
      method: 'GET',
      status: 200,
    });
    await app.close();
  });

  it('should not invoke alert handler for high threshold', async () => {
    const alertHandler = jest.fn();
    const app = await buildApp({
      thresholds: { default: 999999 },
      alertHandlers: [alertHandler],
    });

    await app.inject({ method: 'GET', url: '/api/hello' });
    expect(alertHandler).not.toHaveBeenCalled();
    await app.close();
  });

  it('should log route details on each request', async () => {
    const logFn = jest.fn();
    const app = await buildApp({ logger: { log: logFn } });

    await app.inject({ method: 'GET', url: '/api/hello' });
    expect(logFn).toHaveBeenCalledTimes(1);
    expect(logFn.mock.calls[0][0]).toMatchObject({
      method: 'GET',
      status: 200,
    });
    await app.close();
  });
});
