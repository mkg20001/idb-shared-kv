'use strict'

const { openDB } = require('idb')

/*
{
async get(key) {
  return db.get(storeName, key);
},
async set(key, val) {
  return db.put(storeName, val, key);
},
async delete(key) {
  return db.delete(storeName, key);
},
async clear() {
  return db.clear(storeName);
},
async keys() {
  return db.getAllKeys(storeName);
},
};
*/

async function batchedKV (db, storeName, batchInterval) {
  const batch = []

  async function runBatch () {
    const tx = db.transaction(storeName, 'readwrite')
    try {
      batch.forEach(b => {
        try {
          tx.store[b.a[0]](...b.a.slice(1))
        } catch (err) {
          b.reject(err)
        }
      })
    } catch (err) {
      batch.forEach(b => b.reject(err))
    }

    try {
      await tx.done
      batch.forEach(b => b.resolve())
    } catch (err) {
      batch.forEach(b => b.reject(err))
    }
  }

  function createPromise (...a) {
    return new Promise((resolve, reject) => {
      batch.push({
        a,
        resolve,
        reject
      })
    })
  }

  return {
    get (key) {
      return createPromise('get', storeName, key)
    },
    set (key, val) {
      return createPromise('set', storeName, key, val)
    },
    delete (key) {
      return createPromise('delete', storeName, key)
    },
    clear () {
      return createPromise('clear', storeName)
    },
    keys () {
      return createPromise('getAllKeys', storeName)
    }
  }
}

function kv (db, storeName) {
  return {
    get (key) {
      return db.get(storeName, key)
    },
    set (key, val) {
      return db.put(storeName, val, key)
    },
    delete (key) {
      return db.delete(storeName, key)
    },
    clear () {
      return db.clear(storeName)
    },
    keys () {
      return db.getAllKeys(storeName)
    }
  }
}

async function mainOpenDB () {
  const db = await openDB('idb-shared-kv', 1)

  return {
    getKV: async (name, batchInterval) => {
      await db.createObjectStore(name)

      if (batchInterval) {
        return batchedKV(db, name, batchInterval)
      } else {
        return kv(db, name)
      }
    }
  }
}

const SYM = Symbol('IDB_SHARED_KV')

module.exports = async (storeName, batchInterval) => {
  if (!global[SYM]) {
    global[SYM] = mainOpenDB
  }

  await global[SYM]
  return global[SYM].getKV(storeName, batchInterval)
}
