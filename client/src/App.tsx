import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Admin from "./pages/Admin";
import Workspace from "@/pages/Workspace";
import GuidedJourney from "@/pages/GuidedJourney";
import CollectionStudio from "@/pages/CollectionStudio";
import PhotoEdits from "@/pages/PhotoEdits";
import Pricing from "./pages/Pricing";
import Lookbook from "@/pages/Lookbook";
import SignatureAdmin from "@/pages/SignatureAdmin";
import { SignatureWreaths, SignatureWreathDetail } from "@/pages/SignatureWreaths";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/login"} component={Login} />
      <Route path={"/admin"} component={Admin} />
      <Route path={"/admin/inventory"} component={Admin} />
      <Route path={"/admin/signature-wreaths"} component={SignatureAdmin} />
      <Route path={"/workspace"} component={Workspace} />
      <Route path={"/guided"} component={GuidedJourney} />
      <Route path={"/collection-studio"} component={CollectionStudio} />
      <Route path={"/photo-edits"} component={PhotoEdits} />
      <Route path={"/plans"} component={Pricing} />
      <Route path={"/lookbook/demo"} component={Lookbook} />
      <Route path={"/lookbook"} component={Lookbook} />
      <Route path={"/lookbook/share/:token"} component={Lookbook} />
      <Route path={"/signature-wreaths"} component={SignatureWreaths} />
      <Route path={"/signature-wreaths/:slug"} component={SignatureWreathDetail} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
