import { parse } from 'cookie'
import type { SessionManager } from './types'
import Logger from '@dvinav/mwlogger'
import { RedisClientType } from 'redis'

// SessionManager class for handling sessions, stored in redis
class SessionManager implements SessionManager.Interface {
  private skey!: string // session key for redis
  private XFW!: string | null // ip address of the client
  private logger!: Logger // a Logger instance for logging
  private request: Request
  private redis: RedisClientType

  // ? what if we provide logger instance to the object if we already have one in the context we're using the SessionManager for optimization purposes?

  constructor(redis: RedisClientType, request: Request) {
    // initialize the logger instance

    this.request = request
    this.redis = redis

    this.initSession().catch(err => {
      this.logger.error({ message: `Session initialization failed: ${err.message}` })
    })
  }

  // gets the sid from the request cookies and sets the redis key for the session
  private async getSessionKey(): Promise<void> {
    try {
      const cookie = parse(this.request.headers.get('Cookie') || '')

      if (!cookie.sid) {
        // because sid must be set and the middleware handles it
        throw new Error('sid cookie not set')
      }

      this.skey = `basic-admin-panel:session:${cookie.sid}`
      return
    } catch (err: any) {
      this.logger.error({ message: `Failed to get session key: ${err.message}` })
      throw err
    }
  }

  // initialize the logger instance
  private async initializeLogger(): Promise<void> {
    if (this.logger) return
    try {
      // get the client's ip first
      this.XFW = this.request.headers.get('X-Forwarded-For')
      // initialize the logger with the client's ip
      this.logger = new Logger({ client: this.XFW })
    } catch (err: any) {
      console.error('Failed to initialize logger:', err)
      throw new Error('Logger initialization failed')
    }
  }

  // initialize the session
  async initSession(): Promise<void> {
    await this.initializeLogger()
    try {
      // first set the session key for redis
      await this.getSessionKey()

      // make sure the redis client is connected
      await this.checkCon()

      // get the session the session to see if it exists
      // ? any better way?
      const session = await this.redis.json.get(this.skey)

      if (!session) {
        // create the session in redis if not set
        await this.redis.json.set(this.skey, '$', {
          createdAt: Date.now(),
          lastAccessed: Date.now()
        })
      } else {
        // set/reset a 10 minute expire time each time the session is accessed
        await Promise.all([this.redis.expire(this.skey, 600), this.redis.json.set(this.skey, '$.lastAccessed', Date.now())])
      }
    } catch (err: any) {
      this.logger.error({ message: `Session initialization failed: ${err.message}` })
      throw err
    }
  }

  private async checkCon() {
    if (!this.redis.isOpen) await this.redis.connect()
  }

  // get a property from the session
  // using generic for type checking the returned data
  async getProp<T>(_key: string, _options?: { errorIfNotFound?: true }): Promise<T>
  async getProp<T>(key: string, options?: SessionManager.GetPropOptions): Promise<T | null> {
    await this.initializeLogger()
    try {
      await this.getSessionKey()
      // make sure the redis client is connected
      await this.checkCon()

      // format the path to be able to access the requested path in the session object
      const path = `$.${key}`

      // get the thing
      const val = (await this.redis.json.get(this.skey, { path })) as T[]

      // return null if the requested prop doesn't exist
      if (!val) {
        if (options?.errorIfNotFound) throw new Error(`Property ${key} not found`)
        return null
      }

      return val[0]
    } catch (err: any) {
      this.logger.error({ message: `Failed to get property ${key}: ${err.message}` })
      throw new Error()
    }
  }

  // set props
  async setProp(key: string, value: any): Promise<void> {
    await this.initializeLogger()
    try {
      await this.getSessionKey()
      // set the prop (no shit)
      await this.redis.json.set(this.skey, `$.${key}`, value)
    } catch (err: any) {
      this.logger.error({ message: `Failed to set property ${key}: ${err.message}` })
      throw err
    }
  }

  // delete a prop (no shit again)
  async deleteProp(key: string): Promise<void> {
    await this.initializeLogger()

    try {
      await this.getSessionKey()
      // delete the prop (!!!)
      await this.redis.json.del(this.skey, `$.${key}`)
    } catch (err: any) {
      this.logger.error({ message: `Failed to delete property ${key}: ${err.message}` })
      throw err
    }
  }
}

export default SessionManager
