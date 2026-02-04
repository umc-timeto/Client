import { createBrowserRouter } from "react-router-dom";
import type { RouteObject } from "react-router-dom";

import RootLayout from "@/layouts/RootLayout";
import ProtectedLayout from "@/layouts/ProtectedLayout";

import {
  LoginPage,
  KakaoCallbackPage,
  HomePage,
  GoalPage,
  FolderPage,
  FolderSelectPage,
  TaskPage,
  TimeBlockPage,
  MyLogPage,
} from "@/pages";

const publicChildren: RouteObject[] = [
  { index: true, element: <LoginPage /> },
  { path: "login", element: <LoginPage /> },
  { path: "auth/callback/kakao", element: <KakaoCallbackPage /> },
];

const protectedChildren: RouteObject[] = [
  { path: "home", element: <HomePage /> },
  { path: "goal", element: <GoalPage /> },
  { path: "folder", element: <FolderPage /> },
  { path: "folder/select", element: <FolderSelectPage /> },
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