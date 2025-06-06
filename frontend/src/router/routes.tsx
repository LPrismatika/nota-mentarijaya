import { createBrowserRouter } from "react-router-dom";
import NotaList from "@/pages/nota/NotaList.tsx";
import AddAll from "@/pages/detailNota/AddAll";
import DetailNota from "@/pages/detailNota/DetailNota";
import PrintNota from "@/pages/pdf/PrintNota";
import Layout from "./layout";

const routes = createBrowserRouter(
  [
    {
      path: "/",
      element: <Layout />,
      children: [
        {
          path: "/",
          element: <NotaList />,
        },
        {
          path: "/tambah-nota",
          element: <AddAll />,
        },
        {
          path: "/:notaId/detail-nota",
          element: <DetailNota />,
        },
        {
          path: "/:notaId/print",
          element: <PrintNota />,
        },
      ],
    },
  ],
  {
    basename: "/nota/frontend", 
  }
);

export default routes;
