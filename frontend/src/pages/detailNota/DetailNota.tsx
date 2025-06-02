import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  SaveIcon,
  CalendarIcon,
  TrashIcon,
} from "lucide-react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { useGetAllNota, useGetDetailNota } from "@/services/queries";
import { useDeleteDetailNota, useUpdateNota } from "@/services/mutations";
import Swal from "sweetalert2";
import { useQueryClient } from "@tanstack/react-query";
import AddDetailModal from "./ModalAddDetail";

const DetailNota = () => {
  const { notaId } = useParams();
  const parsedNotaId = notaId ? Number(notaId) : undefined;
  const queryClient = useQueryClient();

  const { data: notaList } = useGetAllNota();
  const nota = notaList?.find((n) => n.id === parsedNotaId);
  const { data: detailsData } = useGetDetailNota(parsedNotaId!);
  const { mutate: updateNotaMutate } = useUpdateNota();
  const { mutate: deleteDetail } = useDeleteDetailNota();

  const [formData, setFormData] = useState({
    no_nota: "",
    pembeli: "",
    tanggal: "",
    alamat: "",
    jt_tempo: "",
  });

  const [details, setDetails] = useState<any[]>([]);

  useEffect(() => {
    if (nota) {
      setFormData({
        no_nota: nota.no_nota,
        pembeli: nota.pembeli,
        tanggal: nota.tanggal,
        alamat: nota.alamat,
        jt_tempo: nota.jt_tempo,
      });
    }

    if (detailsData) {
      setDetails(detailsData);
    }
  }, [nota, detailsData]);

  const handleNotaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (
    field: "tanggal" | "jt_tempo",
    date: Date | undefined
  ) => {
    if (!date) return;
    setFormData((prev) => ({
      ...prev,
      [field]: date.toISOString().split("T")[0],
    }));
  };

  const handleDetailChange = (index: number, field: string, value: any) => {
    setDetails((prevDetails) =>
      prevDetails.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    );
  };

  const handleDeleteDetail = (id: number) => {
    const filtered = details.filter((item) => item.id !== id);
    setDetails(filtered);
    deleteDetail(id);
  };

  const handleUpdateAll = () => {
    if (!parsedNotaId) return;

    updateNotaMutate(
      {
        id: parsedNotaId,
        data: {
          ...formData,
          details,
        },
      },
      {
        onSuccess: () => {
          Swal.fire({
            icon: "success",
            title: "Berhasil!",
            text: "Nota berhasil diperbarui.",
            timer: 2000,
            showConfirmButton: false,
            timerProgressBar: true,
            didOpen: () => {
              Swal.showLoading();
            },
          });
          queryClient.invalidateQueries({ queryKey: ["detail nota"] });
        },
        onError: () => {
          Swal.fire({
            icon: "error",
            title: "Gagal!",
            text: "Terjadi kesalahan saat memperbarui nota.",
            confirmButtonText: "OK",
          });
        },
      }
    );
  };

  return (
    <div className="p-4 mx-8 text-lg uppercase">
      <h1 className="text-2xl font-bold mb-12 text-center">Faktur</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-10 mb-4">
        <div className="space-y-2">
          <div className="flex gap-13 items-center">
            <label>No Nota:</label>
            <Input className="w-1/3" value={formData.no_nota} readOnly />
          </div>
          <div className="flex gap-15 items-center">
            <label>Tanggal:</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="b-white">
                  <CalendarIcon className="mr-2 h-4 w-1/2" />
                  {formData.tanggal
                    ? format(new Date(formData.tanggal), "dd MMM yyyy")
                    : "Pilih Tanggal"}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start">
                <Calendar
                  mode="single"
                  selected={
                    formData.tanggal ? new Date(formData.tanggal) : undefined
                  }
                  onSelect={(date) => handleDateChange("tanggal", date)}
                  className="bg-white text-black"
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="flex gap-5 items-center">
            <label>Jatuh Tempo:</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="b-white">
                  <CalendarIcon className="mr-4 h-4 w-1/2" />
                  {formData.jt_tempo
                    ? format(new Date(formData.jt_tempo), "dd MMM yyyy")
                    : "Pilih Tanggal"}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start">
                <Calendar
                  mode="single"
                  selected={
                    formData.jt_tempo ? new Date(formData.jt_tempo) : undefined
                  }
                  onSelect={(date) => handleDateChange("jt_tempo", date)}
                  className="bg-white text-black"
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        <div className="space-y-2">
          <div>
            <label>Kepada Yth:</label>
            <Input
              name="pembeli"
              value={formData.pembeli}
              onChange={handleNotaChange}
              placeholder="Masukkan Nama Pembeli"
            />
          </div>
          <div>
            <label>Alamat:</label>
            <Input
              name="alamat"
              value={formData.alamat}
              onChange={handleNotaChange}
              placeholder="Masukkan Alamat"
            />
          </div>
        </div>
      </div>

      <div className="flex gap-3 justify-end mb-5">
        <AddDetailModal
          notaId={parsedNotaId}
          onAdd={(newDetail) => {
            setDetails((prev) => [...prev, newDetail]); 
          }}
        />
        <Button onClick={handleUpdateAll} className="flex gap-2 items-center">
          <SaveIcon size={16} />
          Save Nota
        </Button>
        </div>

      <table className="min-w-full border uppercase rounded-lg">
        <thead className="bg-gray-200">
        <tr className="text-center">
              <th className="p-2 w-[2%]">No</th>
              <th className="p-2 w-[25%] text-left">Nama Barang</th>
              <th className="p-2 w-[12%]">Coly</th>
              <th className="p-2 w-[12%]">Qty</th>
              <th className="p-2 w-[12%]">Total Qty</th>
              <th className="p-2 w-[8%] text-center">Harga</th>
              <th className="p-2 w-[8%] text-center">Diskon</th>
              <th className="p-2 w-[10%] text-center">Sub Total</th>
              <th className="p-2 w-[9%]">Aksi</th>
            </tr>
        </thead>
        <tbody className="uppercase">
          {details.map((item, index) => (
            <tr key={index} className="border-t">
              <td className="p-2">{index + 1}</td>
              <td className="p-2">
                <Input
                  value={item.nama_barang}
                  onChange={(e) => handleDetailChange(index, "nama_barang", e.target.value)}
                />
              </td>
              <td className="p-2">
                <div className="flex gap-2">
                  <Input
                    type="number"
                    onFocus={(e) => e.target.select()}
                    value={item.coly}
                    onChange={(e) => handleDetailChange(index, "coly", parseFloat(e.target.value) || 0)}
                  />
                  <Input
                    type="text"
                    value={item.satuan_coly}
                    onChange={(e) => handleDetailChange(index, "satuan_coly", e.target.value)}
                  />
                </div>
              </td>
              <td className="p-2">
                <div className="flex gap-2">
                  <Input
                    type="number"
                    onFocus={(e) => e.target.select()}
                    value={item.qty_isi}
                    onChange={(e) => handleDetailChange(index, "qty_isi", parseFloat(e.target.value) || 0)}
                  />
                  <Input
                    type="text"
                    value={item.nama_isi}
                    onChange={(e) => handleDetailChange(index, "nama_isi", e.target.value)}
                  />
                </div>
              </td>
              <td className="p-2 text-center">{item.jumlah} {item.satuan_coly}</td>
              <td className="p-2">
                <Input
                  type="number"
                  onFocus={(e) => e.target.select()}
                  value={item.harga}
                  onChange={(e) => handleDetailChange(index, "harga", parseFloat(e.target.value) || 0)}
                />
              </td>
              <td className="p-2">
                <Input
                  type="text"
                  value={Array.isArray(item.diskon) ? item.diskon.join(", ") : ""}
                  onChange={(e) => {
                    const newDiskon = e.target.value.split(",").map(d => parseFloat(d) || 0);
                    handleDetailChange(index, "diskon", newDiskon);
                  }}
                />
              </td>
              <td className="p-2">
                {item.total.toLocaleString("id-ID", { maximumFractionDigits: 2 })}
              </td>
              <td className="p-2">
                <Button
                  variant="destructive"
                  onClick={() => handleDeleteDetail(item.id)}
                >
                  <TrashIcon size={16} />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
        <tr>
          <td colSpan={7} className="text-right font-medium p-2">
            Subtotal: 
          </td>
          <td className="text-left">
            {" "}
            Rp.{" "}
            2.000.0000
          </td>
          <td></td>
        </tr>
        <tr>
          <td colSpan={7} className="text-right font-medium p-2">
            Diskon: 
          </td>
          <td className="text-left">
            <div className="flex items-center space-x-2">
              <Input
              className="w-20"                    
              onFocus={(e) => e.target.select()}
              type="number"
              />{" "}
              <span>%</span>
            </div>
          </td>
          <td>
            <div className="flex items-center space-x-2">
              <span>Rp</span>
                <Input
                  className="w-20"
                  onFocus={(e) => e.target.select()}
                  type="number"
                  />
            </div>
          </td>
        </tr>
        <tr>
          <td colSpan={7} className="text-right font-medium p-2">
            Total: 
          </td>
          <td className="font-bold p-2">
            Rp. 500.000.000
          </td>
          <td>
            <Button
              onClick={handleUpdateAll}
              className="flex gap-2 items-center"
            >
              <SaveIcon size={16} />
              Save All
            </Button>
          </td>
        </tr>
      </table>
    </div>
  );
};

export default DetailNota;
