"use client"

import { useEffect, useState } from "react"

export default function AnalogClock() {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const hours = time.getHours() % 12
  const minutes = time.getMinutes()
  const seconds = time.getSeconds()

  const hourAngle = (hours * 30) + (minutes * 0.5)
  const minuteAngle = minutes * 6
  const secondAngle = seconds * 6

  return (
    <div className="flex items-center justify-center">
      <div className="relative w-24 h-24 rounded-full border-4 border-gray-800 bg-white shadow-lg">
        <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-gray-800 rounded-full -translate-x-1/2 -translate-y-1/2 z-10" />
        <div
          className="absolute top-1/2 left-1/2 w-1 h-8 bg-gray-800 origin-bottom -translate-x-1/2 -translate-y-full"
          style={{ transform: `translate(-50%, -100%) rotate(${hourAngle}deg)` }}
        />
        <div
          className="absolute top-1/2 left-1/2 w-0.5 h-10 bg-gray-600 origin-bottom -translate-x-1/2 -translate-y-full"
          style={{ transform: `translate(-50%, -100%) rotate(${minuteAngle}deg)` }}
        />
        <div
          className="absolute top-1/2 left-1/2 w-0.5 h-12 bg-red-500 origin-bottom -translate-x-1/2 -translate-y-full"
          style={{ transform: `translate(-50%, -100%) rotate(${secondAngle}deg)` }}
        />
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute top-1 left-1/2 w-0.5 h-2 bg-gray-800 origin-bottom"
            style={{ transform: `translateX(-50%) rotate(${i * 30}deg) translateY(44px)` }}
          />
        ))}
      </div>
    </div>
  )
}
