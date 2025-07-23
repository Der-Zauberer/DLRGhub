import type { Profile } from "@/services/surrealdb.service";

export const profiles: Record<string, Profile> = {
  local: {
    address: 'ws://localhost:8080/rpc',
    namespace: 'dlrg.derzauberer.eu',
    database: 'develop'
  },
  production: {
    address: 'wss://derzauberer-06c3cc37l9t95bs5baeq4gtut8.aws-euw1.surreal.cloud',
    namespace: 'dlrg.derzauberer.eu',
    database: 'main'
  }
}

export const profile = profiles.local