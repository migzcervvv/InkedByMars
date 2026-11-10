import { AppRoutes } from './app/AppRoutes'
import { ErrorBoundary } from './components/ui/ErrorBoundary'
import { ScrollToTop } from './components/ui/ScrollToTop'
export default function App() { return <ErrorBoundary><ScrollToTop /><AppRoutes /></ErrorBoundary> }
