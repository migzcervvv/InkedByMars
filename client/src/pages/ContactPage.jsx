import { Camera, Mail, MapPin } from "lucide-react";
import { Button } from "../components/ui/Button";

export default function ContactPage() {
  return (
    <section className="min-h-screen bg-bg px-6 pb-24 pt-32">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="eyebrow">Contact</p>
          <h1 className="page-title">Studio Line</h1>
          <p className="max-w-xl font-body text-3xl leading-tight text-ash">
            For booking requests, use the calendar so the studio can hold your
            date cleanly. For collaborations or press, send a direct note.
          </p>
          <Button to="/booking" className="mt-8">
            Start Booking
          </Button>
        </div>
        <div className="booking-panel grid content-center gap-5">
          <ContactRow
            icon={<Camera size={18} />}
            label="Instagram"
            value="@inkedbymars"
            href="https://instagram.com/inkedbymars"
          />
          <ContactRow
            icon={<Camera size={18} />}
            label="Flash"
            value="@flash.designs.by.mars"
            href="https://instagram.com/flash.designs.by.mars"
          />
          <ContactRow
            icon={<Mail size={18} />}
            label="Email"
            value="marielle.cervantes@yahoo.com"
            href="mailto:marielle.cervantes@yahoo.com"
          />
          <ContactRow
            icon={<MapPin size={18} />}
            label="Studio"
            href="https://www.google.com/maps/place/13A+A.+Arambulo,+Las+Pi%C3%B1as,+1747+Metro+Manila/@14.4385149,120.9851562,18z/data=!3m1!4b1!4m6!3m5!1s0x3397d2021765d763:0xce47d2aee4fa3d1e!8m2!3d14.4385123!4d120.9864437!16s%2Fg%2F11xgyqj6bw?entry=ttu&g_ep=EgoyMDI2MDUyNy4wIKXMDSoASAFQAw%3D%3D"
            value="Located in BF Resort, Las Piñas City"
          />
        </div>
      </div>
    </section>
  );
}

function ContactRow({ icon, label, value, href }) {
  const content = (
    <span className="flex items-center justify-between gap-4 border border-ink/15 bg-cream/35 p-4 text-ink transition hover:border-red hover:text-red">
      <span className="flex items-center gap-3">
        {icon}
        <span className="font-mono text-xs uppercase tracking-[0.16em]">
          {label}
        </span>
      </span>
      <span className="text-right font-body text-2xl">{value}</span>
    </span>
  );

  if (href) {
    return (
      <a href={href} target="_blank" rel="noreferrer">
        {content}
      </a>
    );
  }

  return content;
}
