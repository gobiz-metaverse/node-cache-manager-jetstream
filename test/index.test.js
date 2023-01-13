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

describe('Connect', () => {
    it('should connected', () => {
        const isConnected = natsStore.store.getNc().isClosed();
        expect(isConnected).toEqual(false);
    });
});

describe('Get and set method of nats key/value bucket', () => {
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

    it('should be return undefine when key not found', async () => {
        await expect(natsStore.get('danhtest123')).resolves.toEqual(undefined);
    });
});

describe('Del method', () => {
    it('should return error when not pass key to arg', async () => {
        await expect(natsStore.del()).rejects.toThrowError();
    });

    it('Should del success', async () => {
        await natsStore.set('hello', 'Danh');
        await expect(natsStore.get('hello')).resolves.toEqual('Danh');
        expect(natsStore.del('hello')).toBeInstanceOf(Promise);
        await expect(natsStore.get('hello')).resolves.toEqual(undefined);
    })
});