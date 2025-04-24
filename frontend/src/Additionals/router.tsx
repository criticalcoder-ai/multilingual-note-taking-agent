// router.tsx
import {
  createRootRoute,
  createRoute,
  createRouter,
  Navigate,
} from "@tanstack/react-router";
import PersistentDrawerLeft from "../Components/Transcribe";

const rootRoute = createRootRoute({
  component: () => <PersistentDrawerLeft />,
});

const chatRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/chat/$chatId",
  component: PersistentDrawerLeft,
});

const defaultRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: () => <Navigate to="/chat/1" />,
});

const routeTree = rootRoute.addChildren([defaultRoute, chatRoute]);

export const router = createRouter({ routeTree });
