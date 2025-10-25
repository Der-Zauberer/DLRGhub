import type { App } from "vue"

export class WeatherService {

    async getWeather(): Promise<Weather> {
        const url = 'https://api.open-meteo.com/v1/forecast?latitude=47.666&longitude=8.9&current=temperature_2m,precipitation&hourly=temperature_2m,precipitation_probability&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_mean&forecast_days=7'
        const result = await fetch(url).then(result => result.json()) as Weather
        return result
    }

    async getWaterTemperature(): Promise<WaterTemperature> {
        const url = 'https://corsproxy.io/?https://www.hydrodaten.admin.ch/plots/temperature_7days/2288_temperature_7days_de.json'
        const result = await fetch(url).then(result => result.json())
        const data = result.plot.data[0]
        return { time: data.x, temperature: data.y }
    }

}

export type Weather = {
  latitude: number
  longitude: number
  generationtime_ms: number
  utc_offset_seconds: number
  timezone: string
  timezone_abbreviation: string
  elevation: number
  current_units: {
    time: string
    interval: string
    temperature_2m: string
    precipitation: string
  }
  current: {
    time: string
    interval: number
    temperature_2m: number
    precipitation: number
  }
  hourly_units: {
    time: string
    temperature_2m: string
    precipitation_probability: string
  }
  hourly: {
    time: string[]
    temperature_2m: number[]
    precipitation_probability: number[]
  }
  daily_units: {
    time: string
    temperature_2m_max: string
    temperature_2m_min: string
    precipitation_probability_mean: string
  }
  daily: {
    time: string[]
    temperature_2m_max: number[]
    temperature_2m_min: number[]
    precipitation_probability_mean: number[]
  }
}

export type WaterTemperature = {
      time: string[]
      temperature: number[]
}

export const WEATHER_SERVICE = 'weatherService'

export default {
    install(app: App) {
        const weatherService = new WeatherService()
        app.config.globalProperties.$weatherService = weatherService
        app.provide(WEATHER_SERVICE, weatherService)
    }
}