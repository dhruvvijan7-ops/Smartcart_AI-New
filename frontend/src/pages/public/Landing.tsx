import Hero from './Hero'
import Story from './Story'
import Features from './Features'
import Process from './Process'
import Closing from './Closing'
import { useRevealAll } from '../../lib/hooks'

export default function Landing() {
  useRevealAll([])
  return (
    <>
      <Hero />
      <Story />
      <Features />
      <Process />
      <Closing />
    </>
  )
}
