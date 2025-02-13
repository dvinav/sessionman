import { RedisClientType } from 'redis'

declare namespace SessionManager {
  interface GetPropOptions {
    errorIfNotFound?: boolean
  }

  interface InitialProps {
    request: Request
    redis: RedisClientType
  }

  interface Interface {
    getProp<T>(_key: string, _options?: { errorIfNotFound?: true }): Promise<T>
    getProp<T>(key: string, options?: SessionManager.GetPropOptions): Promise<T | null>
    setProp(key: string, _value: string): Promise<void>
    deleteProp(key: string): Promise<void>
    initSession(): Promise<void>
  }
}

export { SessionManager }
