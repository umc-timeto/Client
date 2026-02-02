import { createBrowserRouter } from "react-router-dom";
import type { RouteObject } from "react-router-dom";

import RootLayout from "@/layouts/RootLayout";
import ProtectedLayout from "@/layouts/ProtectedLayout";

import { LoginPage, HomePage, GoalPage, FolderPage, TaskPage, TimeBlockPage, MyLogPage } from "@/pages";

const publicChildren: RouteObject[] = [{ index: true, element: <LoginPage /> }];

const protectedChildren: RouteObject[] = [
  { path: "home", element: <HomePage /> },
  { path: "goal", element: <GoalPage /> },
  { path: "folder", element: <FolderPage /> },
  { path: "task", element: <TaskPage /> },
  { path: "timeblock", element: <TimeBlockPage /> },
  { path: "mylog", element: <MyLogPage /> },
];

const routes: RouteObject[] = [
  {
    path: "/",
    element: <RootLayout />,
    children: [
      ...publicChildren,
      {
        element: <ProtectedLayout />,
        children: protectedChildren,
      },
    ],
  },
];

export const router = createBrowserRouter(routes);