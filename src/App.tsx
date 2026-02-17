import { RouterProvider } from "react-router-dom";
import { router } from "@/routes/router";

if (import.meta.env.DEV) {
  const devToken = (import.meta.env.VITE_DEV_ACCESS_TOKEN as string | undefined)?.trim();

  if (devToken && !localStorage.getItem("accessToken")) {
    localStorage.setItem("accessToken", devToken);
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}