import * as cacheManager from 'cache-manager';
import { createBucketKeyValueStore } from '../lib/index.js';

const config = {
    url:"nats://0.0.0.0:4222",
    ttl: 3600,
    bucket: "palpatine"
}

var natsStore;

beforeEach(async () => {
    natsStore = await cacheManager.caching(createBucketKeyValueStore, config);

    await natsStore.reset();
});

describe('get', () => {
    it('should connected', () => {
        const isConnected = natsStore.store.getNc().isClosed();
        console.log(isConnected)
        expect(isConnected).toEqual(false);
    });

    it('should return exceptions when value undefined', async () => {
        await expect(natsStore.set('test1',undefined)).rejects.toThrowError();
    });

    it('Should value is string', async () => {
        await natsStore.set('test', 'hi');
        await expect(natsStore.get('test')).resolves.toEqual('hi');
        expect(typeof(await natsStore.get('test'))).toBe('string');
    });

    it('should value is json', async () => {
        await natsStore.set('test2', {
            name: 'Danh',
            age: 25,
            bod:"5/1/1998"
        })
        await expect(natsStore.get('test2')).resolves.toMatchObject({
            name: 'Danh',
            age: 25,
            bod:"5/1/1998"
        });
        expect(typeof(await natsStore.get('test2'))).toBe('object');
    });
});