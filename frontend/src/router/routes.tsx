import { createBrowserRouter } from "react-router-dom";
import NotaList from "@/pages/nota/NotaList.tsx";
import AddAll from "@/pages/detailNota/AddAll";
import DetailNota from "@/pages/detailNota/DetailNota";

const routes = createBrowserRouter(
  [
    {
      path: "/",
      element: <NotaList />,
    },
    {
      path: "/:notaId/detail-nota",
      element: <DetailNota />,
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
