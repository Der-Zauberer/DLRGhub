/// <reference types="vite/client" />
export {}
declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $surrealDbService: SurrealDbService
    $dataService: DataService
  }
}