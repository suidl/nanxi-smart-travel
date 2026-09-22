/** KV / Request / Response 等全局类型由 @cloudflare/workers-types 提供，这里只声明本项目绑定。 */
interface Env {
  WEATHER_CACHE: KVNamespace
  SHARED_TRIPS: KVNamespace
  ASSETS: Fetcher
  YONGJIA?: string
  YONGJIA_BASE_URL?: string
  AI_MODEL?: string
  OPENAI_API_KEY?: string
  OPENAI_BASE_URL?: string
}
