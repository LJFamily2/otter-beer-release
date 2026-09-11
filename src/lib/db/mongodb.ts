import mongoose, { type Mongoose } from "mongoose";
import { env } from "@/lib/env";

interface MongooseCache {
  conn: Mongoose | null;
  promise: Promise<Mongoose> | null;
}

// Next.js dev mode hot-reloads modules but keeps the Node process alive, so a
// module-level singleton would still be re-created on every edit and open a
// new connection each time. Caching on `global` survives the reload.
declare global {
  var __otterBeerMongooseCache: MongooseCache | undefined;
}

/**
 * Owns the single Mongoose connection for the app. Repositories should go
 * through `Database.connect()` rather than importing mongoose directly, so
 * the connection lifecycle stays in one place.
 */
export class Database {
  private static getCache(): MongooseCache {
    if (!global.__otterBeerMongooseCache) {
      global.__otterBeerMongooseCache = { conn: null, promise: null };
    }
    return global.__otterBeerMongooseCache;
  }

  static async connect(): Promise<Mongoose> {
    const cache = Database.getCache();

    if (cache.conn) {
      return cache.conn;
    }

    if (!cache.promise) {
      cache.promise = mongoose
        .connect(env.MONGODB_URI, { bufferCommands: false })
        .then((m) => m);
    }

    try {
      cache.conn = await cache.promise;
    } catch (err) {
      cache.promise = null;
      throw err;
    }

    return cache.conn;
  }
}
