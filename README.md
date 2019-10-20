# idb-shared-kv

Shared (using same DB) IndexDB key-value store

# Usage

```js
const kv = require('idb-shared-kv')

const myKV = await kv('my-kv')
await kv.set('test', 1)
console.log(await kv.get('test'))

const myBatchedKV = await kv('my-batched-kv', 1000) // will batch TXs every 1 second
```
