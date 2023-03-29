import { connect, StringCodec, KV, NatsConnection, JetStreamClient } from 'nats';
import type { Store } from "cache-manager";

export interface NatsStoreConnectOptions {
    url: string;
    ttl: number;
    bucket: string;
}

export interface NatsStore extends Store {
    name: string;
    getKv: () => KV;
    getNc: () => NatsConnection,
    isCacheableValue: any;
    set: (key: any, value: any) => Promise<any>;
    get: (key: any) => Promise<any>;
    del: (...args: any[]) => Promise<any>;
    mset: (...args: any[]) => Promise<any>;
    mget: (...args: any[]) => Promise<any>;
    mdel: (...args: any[]) => Promise<any>;
    reset: () => Promise<any>;
    keys: (pattern: string) => Promise<any>;
    ttl: (key: any) => Promise<any>;
}


const decode = (value: Uint8Array): string => {
    return StringCodec().decode(value);
}

const endcode = (value: string): Uint8Array => {
    return StringCodec().encode(value);
}

export async function createBucketKeyValueStore (config: NatsStoreConnectOptions): Promise<NatsStore> {
    const nc = await connect({servers: config.url});

    const js = nc.jetstream();

    const kv = await js.views.kv(config.bucket,{
        ttl: config.ttl,
    });

    return buildNatsStoreWithConfig(kv, nc, config);
}

const buildNatsStoreWithConfig = (kv: KV, nc: NatsConnection, config: NatsStoreConnectOptions): NatsStore => {

    const isCacheableValue = (value: any): boolean => value !== undefined && value !== null;

    const set = async (key: any, value: any): Promise<Number> => {
        if(!isCacheableValue(value)) {
            throw new Error(`${value} is not a cacheable value`);
        }

        const keyEncoded = encodeKey(key);

        if(typeof(value) !== 'string') {
            return kv.put(keyEncoded, endcode(JSON.stringify(value)));
        }

        return kv.put(keyEncoded, endcode(value));
    }

    const get = async (key: any): Promise<any | undefined> => {
        if(!key) {
            throw new Error(`${key} is not undefined or null`);
        }

        const keyEncoded = encodeKey(key);

        const kvEntry = await kv.get(keyEncoded);

        if(!kvEntry?.value || kvEntry.value.length === 0) {
            return undefined;
        }

        const decodeValue = decode(kvEntry.value);

        if(typeof(decodeValue) === 'string' && !isJson(decodeValue)) {
            return decodeValue;
        }

        return JSON.parse(decodeValue);
    }

    const del = async (key: any): Promise<void> => {
        if(!key) {
            throw new Error(`${key} is not undefined or null`);
        }
        return kv.delete(encodeKey(key));
    }

    const mset = async (args: any[]) => {
        console.log("Here implement mset method here");
    }

    const mget = async (...args: any[]) => {
        console.log("Here implement mget method here");
    }

    const mdel = async (...args: any[]) => {
        console.log("Here implement mdel method here");
    }

    const keys = async (pattern: string, isDecode: boolean = true): Promise<string[]> => {
        const keys = await kv.keys();

        const filterKeys: string[] = [];
        
        if(!pattern || pattern === '*') {
            for await (const k of keys) {
                if(isDecode){
                    filterKeys.push(decodeKey(k));
                } else {
                    filterKeys.push(k);
                }
            }
            return filterKeys;
        }

        for await (const k of keys) {
            const key = isDecode ? decodeKey(k) : k;
            if(key.includes(pattern)) {
                filterKeys.push(key);
            }
        }

        return filterKeys;
    }

    const reset = async (): Promise<void | PromiseSettledResult<void>[]> => {
        const keysOfBucket = await keys('*', false);

        if(keysOfBucket.length !== 0) {
            const delPromises = keysOfBucket.map(key => {
                return kv.delete(key);
            })

            return Promise.allSettled(delPromises);
        }
    }

    const ttl = async (key: any) => {
        console.log("Here implement ttl method here");
    };

    const isJson = (value: string): boolean => {
        try {
            JSON.parse(value);
            return true;
        } catch (error) {
            return false;
        }
    }

    const encodeKey = (key: string): string  => {
        const buff = Buffer.from(key);
        return buff.toString('base64');
    }

    const decodeKey = (base64Key: string): string => {
        const buff = Buffer.from(base64Key,'base64');
        return buff.toString('ascii');
    }

    return {
        name: 'nats-store',
        isCacheableValue,
        getKv: () => kv,
        getNc: () => nc,
        set,
        get,
        del,
        mset,
        mget,
        mdel,
        reset,
        keys,
        ttl
    }
}