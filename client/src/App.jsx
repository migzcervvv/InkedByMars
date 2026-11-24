import { AppRoutes } from './app/AppRoutes'
import { ErrorBoundary } from './components/ui/ErrorBoundary'
export default function App() { return <ErrorBoundary><AppRoutes /></ErrorBoundary> }
