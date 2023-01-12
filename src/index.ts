import { connect, StringCodec, KV } from 'nats';
import type { Store } from "cache-manager";

export interface NatsStoreConnectOptions {
    url: string;
    ttl: number;
    bucket: string;
}

export interface NatsStore extends Store {
    name: string;
    getKv: () => KV;
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

    return buildNatsStoreWithConfig(kv, config);
}

const buildNatsStoreWithConfig = (kv: KV, config: NatsStoreConnectOptions): NatsStore => {

    const isCacheableValue = (value: any): boolean => value !== undefined && value !== null;

    const set = async (key: any, value: any): Promise<Number> => {
        if(!isCacheableValue(value)) {
            throw new Error(`${value} is not a cacheable value`);
        }

        if(typeof(value) !== 'string') {
            return kv.create(key, endcode(JSON.stringify(value)));
        }

        return kv.create(key, endcode(value));
    }

    const get = async (key: any): Promise<any | undefined> => {
        if(!key) {
            throw new Error(`${key} is not undefined or null`);
        }

        const kvEntry = await kv.get(key);

        if(!kvEntry?.value || kvEntry.value.length === 0) {
            return undefined;
        }

        return JSON.parse(decode(kvEntry.value));
    }

    const del = async (key: any): Promise<void> => {
        if(!key) {
            throw new Error(`${key} is not undefined or null`);
        }
        return kv.delete(key);
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

    const reset = async () => {
        return kv.destroy();
    }

    const keys = async (pattern: string) => {
        const keys = await kv.keys();

        const filterKeys: string[] = [];
        
        if(!pattern || pattern === '*') {
            for await (const k of keys) {
                filterKeys.push(k);
            }
            return filterKeys;
        }

        for await (const k of keys) {
            if(k.includes(pattern)) {
                filterKeys.push(k);
            }
        }

        return filterKeys;
    }

    const ttl = async (key: any) => {
        console.log("Here implement ttl method here");
    };

    return {
        name: 'nats-store',
        isCacheableValue,
        getKv: () => kv,
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