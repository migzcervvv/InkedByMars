import { Button } from '../components/ui/Button'

export default function NotFoundPage() {
  return (
    <section className="grid min-h-screen place-items-center bg-leather px-6 text-center text-cream">
      <div>
        <p className="eyebrow text-red">404</p>
        <h1 className="font-display text-7xl italic">Lost Line</h1>
        <p className="mx-auto mt-5 max-w-md font-body text-3xl italic leading-tight text-cream/70">
          This page slipped out of the stencil.
        </p>
        <Button to="/" className="mt-8">Return Home</Button>
      </div>
    </section>
  )
}
