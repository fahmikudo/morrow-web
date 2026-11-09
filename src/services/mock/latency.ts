const ms = import.meta.env.MODE === 'test' ? 0 : 120;

export function latency(): Promise<void> {
  const { promise, resolve } = Promise.withResolvers<void>();
  setTimeout(resolve, ms);
  return promise;
}
