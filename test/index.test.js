import * as cacheManager from 'cache-manager';
import { createBucketKeyValueStore } from '../lib/index.js';

const config = {
    url:"nats://nats.gobizdev.com:4222",
    ttl: 1000,
    bucket: "test"
}

var natsStore;

const sleep = (milliseconds) => {
    return new Promise(resolve => setTimeout(resolve, milliseconds))
}

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

describe('Keys method', () => {
    it('should return array string keys', async () => {
        await natsStore.set("test","hi");
        await natsStore.set("test2","hi2");
        await expect(natsStore.store.keys("*")).resolves.toEqual(['test','test2']);
    });

    it('Should return array empty when not found any keys', async () => {
        await expect(natsStore.store.keys("*")).resolves.toEqual([]);
    })

    it('should return array key with agr pattern', async () => {
        await natsStore.set("vendor","hi");
        await natsStore.set("vendorMapping","hi2");
        await natsStore.set("vendorSecret","hi2");
        await expect(natsStore.store.keys("vendor")).resolves.toEqual(['vendor','vendorMapping','vendorSecret']);
        await expect(natsStore.store.keys("vendorMapping")).resolves.toEqual(['vendorMapping']);
        await expect(natsStore.store.keys("vendorSecret")).resolves.toEqual(['vendorSecret']);
        await expect(natsStore.store.keys("danh")).resolves.toEqual([]);
    });
});

describe('Reset method', () => {
    it('should return empty array keys', async () => {
        await natsStore.set("vendor","hi");
        await natsStore.set("vendorMapping","hi2");
        await natsStore.set("vendorSecret","hi2");
        await expect(natsStore.store.keys("vendor")).resolves.toEqual(['vendor','vendorMapping','vendorSecret']);
        expect(natsStore.reset()).toBeInstanceOf(Promise);
        await natsStore.reset();
        await expect(natsStore.store.keys("*")).resolves.toEqual([]);
    });
})

describe('Test ttl of bucket', () => {
    it('should return undefine when ttl of bucket', async () => {
        await natsStore.set('hello', 'Danh');
        await expect(natsStore.get('hello')).resolves.toEqual('Danh');
        await sleep(300)
        await expect(natsStore.get('hello')).resolves.toEqual('Danh');
        await sleep(700)
        await expect(natsStore.get('hello')).resolves.toEqual(undefined);
    });
});