import { Button } from '../components/ui/Button'
import { usePageMeta } from '../hooks/usePageMeta'
export default function NotFoundPage() { usePageMeta('Page not found', 'This page could not be found. Return to Inked by Mars to explore the work or request an appointment.'); return <section className="frame recovery-page"><h1>Lost in the ink?</h1><p>This page isn’t here. The studio, the work, and booking are a click away.</p><Button to="/">Back home</Button></section> }
