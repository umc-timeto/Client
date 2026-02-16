import { createBrowserRouter, Navigate } from "react-router-dom";
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
  TimeBlockCreateFolderPage,
  TimeBlockCreateGoalPage,
  TimeBlockCreateTaskPage,
  TimeBlockPage,
  MyLogPage,
  SurveyPage,
} from "@/pages";

const publicChildren: RouteObject[] = [
  { index: true, element: <LoginPage /> },
  { path: "login", element: <LoginPage /> },

  { path: "auth/kakao/callback", element: <KakaoCallbackPage /> },
];

const protectedChildren: RouteObject[] = [
  { path: "home", element: <HomePage /> },
  { path: "goal", element: <GoalPage /> },
  { path: "folder", element: <FolderPage /> },
  { path: "folder/select", element: <FolderSelectPage /> },
  { path: "task", element: <TaskPage /> },
  { path: "timeblock", element: <TimeBlockPage /> },
  { path: "timeblock/create/goal", element: <TimeBlockCreateGoalPage /> },
  { path: "timeblock/create/folder", element: <TimeBlockCreateFolderPage /> },
  { path: "timeblock/create/task", element: <TimeBlockCreateTaskPage /> },
  { path: "mylog", element: <MyLogPage /> },
  { path: "survey", element: <SurveyPage /> },
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
      { path: "*", element: <Navigate to="/login" replace /> },
    ],
  },
];

export const router = createBrowserRouter(routes);