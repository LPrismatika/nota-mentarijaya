import { createBrowserRouter } from "react-router-dom";
import NotaList from "@/pages/nota/NotaList.tsx";
import AddAll from "@/pages/detailNota/AddAll";

const routes = createBrowserRouter(
  [
    {
      path: "/",
      element: <NotaList />,
    },
    {
      path: "/tambah-nota",
      element: <AddAll />,
    },
  ],
  {
    basename: "/nota/frontend",
  }
);

export default routes;
