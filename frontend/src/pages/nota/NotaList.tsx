import { useGetAllNota } from "@/services/queries";
import React from "react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Check, EyeIcon, Loader, PlusIcon, Square, SquareCheckBig, Trash2, XIcon } from "lucide-react";
import Swal from "sweetalert2";
import { useCekNota, useDeleteDetailNota, useUnCekNota } from "@/services/mutations";
import { useQueryClient } from "@tanstack/react-query";

const NotaList = () => {
  const { data } = useGetAllNota();
  console.log(data, "dataaaaa");
  
  const queryClient = useQueryClient();
  const { mutate: deleteDetail } = useDeleteDetailNota();
  const navigate = useNavigate();

  const renderDate = (dateString: string) => {
    if (!dateString) return "Unknown Date";
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = date.toLocaleString("en-US", { month: "long" });
    const day = String(date.getDate()).padStart(2, "0");

    return `${day} ${month} ${year}`;
  };

  const handleNavigate = (id: number) => {
    navigate(`/${id}/detail-nota`);
  };

  const handleDelete = (id: number) => {
    Swal.fire({
      title: "Yakin ingin menghapus data ini?",
      text: "Data akan disembunyikan (status = 0)",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Ya, hapus!",
      cancelButtonText: "Batal",
    }).then((result) => {
      if (result.isConfirmed) {
        deleteDetail(id, {
          onSuccess: () => {
            Swal.fire("Berhasil!", "Data telah dihapus.", "success");
            queryClient.invalidateQueries({ queryKey: ["nota"] });
          },
          onError: () => {
            Swal.fire("Gagal!", "Terjadi kesalahan saat menghapus.", "error");
          },
        });
      }
    });
  };

  const CheckingButton = ({ id, cek }) => {
    const cekNotaMutation = useCekNota();
    const uncekNotaMutation = useUnCekNota();
  
    const isCekLoading = cekNotaMutation.isPending && cekNotaMutation.variables === id;
    const isUncekLoading = uncekNotaMutation.isPending && uncekNotaMutation.variables === id;
    const isLoading = isCekLoading || isUncekLoading;
  
    const handleCekClick = () => {
      if (isLoading) return;
  
      if (cek === 0) {
        cekNotaMutation.mutate(id);
      } else if (cek === 1) {
        uncekNotaMutation.mutate(id);
      }
    };
  
    return (
      <button
        onClick={handleCekClick}
        disabled={isLoading}
        className="b-white"
      >
        {isLoading ? (
          <Loader />
        ) : cek === 1 ? (
          <SquareCheckBig />
        ) : (
          <Square />
        )}
      </button>
    );
  };
  

  const sortedData = React.useMemo(() => {
    if (!data) return [];

    return [...data]
      .filter((item) => item.status !== 0)
      .sort((a, b) => {
        const dateA = new Date(a.updated_at).getTime();
        const dateB = new Date(b.updated_at).getTime();
        return dateB - dateA;
      });
  }, [data]);

  return (
    <div className="p-6 ">
      <h1 className="text-2xl font-bold mb-4 text-center">Daftar Nota</h1>
      
      <div className="flex justify-end mb-4">
        <Button
          onClick={() => navigate("/tambah-nota")}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
        >
          <PlusIcon />
          Tambah Nota
        </Button>
      </div>

      <div className="overflow-x-auto">
        <Table className="border min-w-[900px] border-gray-200 rounded-md">
          <TableHeader className="bg-gray-100">
            <TableRow>
              <TableCell className="p-2 font-semibold text-center">No</TableCell>
              <TableCell className="p-2 font-semibold text-center">Pembeli</TableCell>
              <TableCell className="p-2 font-semibold text-center">Tanggal</TableCell>
              <TableCell className="p-2 font-semibold text-center">Print</TableCell>
              <TableCell className="p-2 font-semibold text-center">Cheking</TableCell>
              <TableCell className="p-2 font-semibold text-center">Actions</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.length > 0 ? (
              sortedData.map((nota, index) => (
                <TableRow key={nota.id} className="hover:bg-gray-50 transition-all">
                  <TableCell className="p-3 text-center">{index + 1}</TableCell>
                  <TableCell className="p-3 text-center">{nota.pembeli}</TableCell>
                  <TableCell className="p-3 text-center">{renderDate(nota.tanggal)}</TableCell>
                  <TableCell className="p-3 text-center">
                    {nota.print === 1 ? (
                        <Check className='cek' />
                      ) : (
                        <XIcon className='cek' />
                      )}
                  </TableCell>
                  <TableCell className="p-3 text-center">
                    <CheckingButton id={nota.id} cek={nota.cek} />
                  </TableCell>
                  <TableCell className="p-3 text-center">
                    <ToggleGroup type="single" className="center gap-2">
                      <ToggleGroupItem
                        value="lihat"
                        className="b-detail"
                        onClick={() => handleNavigate(nota.id!)}
                      >
                        <EyeIcon /> Lihat Detail
                      </ToggleGroupItem>
                      <ToggleGroupItem
                        value="delete"
                        className="b-delete"
                        onClick={() => handleDelete(nota.id!)}
                      >
                        <Trash2 /> Delete
                      </ToggleGroupItem>
                    </ToggleGroup>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-4">
                  Tidak ada data tersedia.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default NotaList;
