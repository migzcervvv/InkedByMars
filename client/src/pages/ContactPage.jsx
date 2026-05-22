import { Camera, Mail, MapPin } from 'lucide-react'
import { Button } from '../components/ui/Button'

export default function ContactPage() {
  return (
    <section className="min-h-screen bg-bg px-6 pb-24 pt-32">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="eyebrow">Contact</p>
          <h1 className="page-title">Studio Line</h1>
          <p className="max-w-xl font-body text-3xl leading-tight text-ash">
            For booking requests, use the calendar so the studio can hold your date cleanly. For collaborations or press, send a direct note.
          </p>
          <Button to="/booking" className="mt-8">Start Booking</Button>
        </div>
        <div className="booking-panel grid content-start gap-5">
          <ContactRow icon={<Camera size={18} />} label="Instagram" value="@inkedbymars" href="https://instagram.com/inkedbymars" />
          <ContactRow icon={<Camera size={18} />} label="Flash" value="@flash.designs.by.mars" href="https://instagram.com/flash.designs.by.mars" />
          <ContactRow icon={<Mail size={18} />} label="Email" value="hello@inkedbymars.com" href="mailto:hello@inkedbymars.com" />
          <ContactRow icon={<MapPin size={18} />} label="Studio" value="By appointment only" />
        </div>
      </div>
    </section>
  )
}

function ContactRow({ icon, label, value, href }) {
  const content = (
    <span className="flex items-center justify-between gap-4 border border-ink/15 bg-cream/35 p-4 text-ink transition hover:border-red hover:text-red">
      <span className="flex items-center gap-3">
        {icon}
        <span className="font-mono text-xs uppercase tracking-[0.16em]">{label}</span>
      </span>
      <span className="text-right font-body text-2xl">{value}</span>
    </span>
  )

  if (href) {
    return <a href={href} target="_blank" rel="noreferrer">{content}</a>
  }

  return content
}
