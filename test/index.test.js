import cacheManager from 'cache-manager';
import { createBucketKeyValueStore } from 'cache-manager-nats-store';

const config = {
    host:"nats://0.0.0.0",
    port:4222,
    ttl: 3600,
    streamName: "nats-store-test",
    bucket: "test"
}

const main = async () => {
    try {
        const natsStore = await cacheManager.caching(createBucketKeyValueStore, config);

        await natsStore.set("test1",{
            id:1,
            value:"Danh",
            age:28
        });

        const value = await natsStore.get("test1");

        const keys = await natsStore.store.keys("*");

        // console.log(keys);

        // await natsStore.del("test1");

        // const test = await natsStore.get("test1");

        // console.log(test);

    } catch (error) {
        console.log(error)
    }
}

main();
