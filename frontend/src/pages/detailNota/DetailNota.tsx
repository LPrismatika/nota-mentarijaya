import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  SaveIcon,
  CalendarIcon,
  TrashIcon,
  PencilIcon,
  XIcon,
  CheckIcon,
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

  const formatDateToYMD = (dateStr: string) => {
    const d = new Date(dateStr);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const [formData, setFormData] = useState({
    no_nota: "",
    pembeli: "",
    tanggal: "",
    alamat: "",
    jt_tempo: "",
  });

  const [diskonPersen, setDiskonPersen] = useState(0);
  const [diskonRupiah, setDiskonRupiah] = useState(0);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [details, setDetails] = useState<any[]>([]);

  const calculateDetail = (item: any) => {
    const coly = parseFloat(Number(item.coly).toFixed(2)) || 0;
    const qty_isi = parseFloat(Number(item.qty_isi).toFixed(2)) || 0;
    const harga = parseFloat(item.harga) || 0;    
    let diskonList: number[] = [];
    if (Array.isArray(item.diskon)) {
      diskonList = item.diskon;
    } else if (typeof item.diskon === "string") {
      try {
        const parsed = JSON.parse(item.diskon);
        if (Array.isArray(parsed)) diskonList = parsed;
      } catch {
        diskonList = [];
      }
    } else if (typeof item.diskon === "number") {
      diskonList = [item.diskon];
    }

    const jumlah = coly * qty_isi;
    const total = diskonList.reduce(
      (acc, persen) => acc - acc * (persen / 100),
      jumlah * harga
    );

    return {
      ...item,
      coly,      
      qty_isi,
      harga,
      diskon: diskonList,
      jumlah,
      total,
    };
  };

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
      const recalculated = detailsData.map((item: any) =>
        calculateDetail(item)
      );
      setDetails(recalculated);
    }
  }, [nota, detailsData]);

  const handleCancel = () => {
    setEditIndex(null);
  };

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

  const handleDetailChange = (id: number, field: string, value: any) => {
    const formattedValue = Array.isArray(value)
      ? value.map(v => (typeof v === 'string' ? v.replace(',', '.') : v))
      : typeof value === 'string' ? value.replace(',', '.') : value;

    setDetails((prevDetails) =>
      prevDetails.map((item) =>
        item.id === id
          ? calculateDetail({
              ...item,
              [field]: Array.isArray(formattedValue)
                ? formattedValue.map(v => isNaN(parseFloat(v)) ? 0 : parseFloat(v))
                : isNaN(parseFloat(formattedValue)) ? 0 : parseFloat(formattedValue),
              [`${field}_raw`]: value,
            })
          : item
      )
    );
  };

  const handleDeleteDetail = (id: number) => {
    const filtered = details.filter((item) => item.id !== id);
    setDetails(filtered);
    deleteDetail(id);
  };

  const calculateTotals = () => {
    const subtotal = details.reduce((sum, item) => sum + item.total, 0);
    const totalColy = details.reduce((sum, item) => sum + item.coly, 0);
    return { subtotal, totalColy };
  };

  const { subtotal, totalColy } = calculateTotals();

  const handleUpdateAll = () => {
    if (!parsedNotaId) return;

    const { subtotal } = calculateTotals();

    updateNotaMutate(
      {
        id: parsedNotaId,
        data: {
          ...formData,
          tanggal: formatDateToYMD(formData.tanggal),
          jt_tempo: formatDateToYMD(formData.jt_tempo),
          total_coly: totalColy,
          diskon_persen: diskonPersen,
          diskon_rupiah: diskonRupiah,
          details,
          subtotal,
          total_harga: subtotal - diskonRupiah,
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
                <Button variant="outline" className="calender">
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
                  className="bg-white text-black [&_*]:!bg-white [&_*]:!text-black [&_.day-selected]:!bg-blue-500"
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="flex gap-5 items-center">
            <label>Jatuh Tempo:</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="calender">
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
                  className="bg-white text-black [&_*]:!bg-white [&_*]:!text-black [&_.day-selected]:!bg-blue-500"
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
              <th className="p-2 w-[12%] text-center">Sub Total</th>
              <th className="p-2 w-[9%]">Aksi</th>
            </tr>
        </thead>
        <tbody className="uppercase">
        {details.map((item, index) => (
            <tr key={index} className="border-t">
              <td className="p-2">{index + 1}</td>
              <td className="p-2">
                {editIndex === index ? (
                  <Input
                    value={item.nama_barang}
                    onChange={(e) => handleDetailChange(index, "nama_barang", e.target.value)}
                  />
                ) : (
                  item.nama_barang
                )}
              </td>
              <td className="p-2 text-right">
                <div className="flex gap-2">
                  {editIndex === index ? (
                    <>
                      <Input
                        type="number"
                        value={item.coly}
                        onChange={(e) => handleDetailChange(index, "coly", parseFloat(e.target.value) || 0)}
                      />
                      <Input
                        type="text"
                        value={item.satuan_coly}
                        onChange={(e) => handleDetailChange(index, "satuan_coly", e.target.value)}
                      />
                    </>
                  ) : (
                    <span>{item.coly} {item.satuan_coly}</span>
                  )}
                </div>
              </td>
              <td className="p-2 text-right">
                <div className="flex gap-2">
                  {editIndex === index ? (
                    <>
                      <Input
                        type="number"
                        value={item.qty_isi}
                        onChange={(e) => handleDetailChange(index, "qty_isi", parseFloat(e.target.value) || 0)}
                      />
                      <Input
                        type="text"
                        value={item.nama_isi}
                        onChange={(e) => handleDetailChange(index, "nama_isi", e.target.value)}
                      />
                    </>
                  ) : (
                    <span>{item.qty_isi} {item.nama_isi}</span>
                  )}
                </div>
              </td>
              <td className="p-2 text-right">{item.jumlah} {item.satuan_coly}</td>
              <td className="p-2 text-right">
                {editIndex === index ? (
                  <Input
                    type="number"
                    value={item.harga}
                    onChange={(e) => handleDetailChange(index, "harga", parseFloat(e.target.value) || 0)}
                  />
                ) : (
                  item.harga.toLocaleString("id-ID")
                )}
              </td>
              <td className="p-2 text-center">
                {(() => {
                  let parsed: number[] = [];

                  if (Array.isArray(item.diskon)) {
                    parsed = item.diskon;
                  } else if (typeof item.diskon === "string") {
                    try {
                      const result = JSON.parse(item.diskon);
                      parsed = Array.isArray(result) ? result : [];
                    } catch {
                      parsed = [];
                    }
                  }

                  // Tambahkan satu input kosong (NaN) di akhir
                  const extendedParsed = [...parsed, NaN];

                  if (editIndex === index) {
                    return (
                      <div className="flex flex-col gap-1">
                        {extendedParsed.map((d, i) => {
                          const raw =
                            item?.diskon_raw?.[i] ??
                            (isNaN(d) ? "" : d.toString().replace(".", ","));

                          return (
                            <Input
                              key={i}
                              type="text"
                              value={raw}
                              onFocus={(e) => e.target.select()}
                              onChange={(e) => {
                                const input = e.target.value;
                                const stringWithDot = input.replace(",", ".");
                                const num = parseFloat(stringWithDot);

                                const newDiskon = [...(item.diskon || [])];
                                newDiskon[i] = isNaN(num) ? 0 : num;

                                // Pastikan diskon_raw memiliki panjang cukup
                                const newDiskonRaw = [...(item.diskon_raw || [])];
                                while (newDiskonRaw.length < extendedParsed.length) {
                                  newDiskonRaw.push("");
                                }
                                newDiskonRaw[i] = input;

                                // Simpan hanya angka valid
                                const updatedDiskon = extendedParsed.map((_, j) => {
                                  const raw = newDiskonRaw[j] || "";
                                  const parsed = parseFloat(raw.replace(",", "."));
                                  return isNaN(parsed) ? NaN : parsed;
                                });

                                // Hapus trailing kosong jika tidak diisi
                                while (
                                  updatedDiskon.length > 1 &&
                                  isNaN(updatedDiskon[updatedDiskon.length - 1]) &&
                                  newDiskonRaw[updatedDiskon.length - 1].trim() === ""
                                ) {
                                  updatedDiskon.pop();
                                  newDiskonRaw.pop();
                                }

                                handleDetailChange(item.id, "diskon", updatedDiskon);
                                handleDetailChange(item.id, "diskon_raw", newDiskonRaw);
                              }}
                              className="w-16 text-right"
                            />
                          );
                        })}
                      </div>
                    );
                  } else {
                    const displayed = parsed.filter((d) => !isNaN(d));
                    return displayed.join(" + ");
                  }
                })()}
              </td>


              <td className="px-5 text-right">
                {item.total.toLocaleString("id-ID", { maximumFractionDigits: 2 })}
              </td>
              <td className="p-2 ">
                <div className="flex gap-2 justify-end">
                  {editIndex === index ? (
                    <>
                      <Button
                        className="b-simpan"
                        size="sm"
                        onClick={() => setEditIndex(null)}
                      >
                        <CheckIcon size={16} />
                      </Button>
                      <button onClick={handleCancel} className="b-batal">
                        <XIcon size={16} />
                      </button>
                    </>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditIndex(index)}
                      className="b-edit"
                    >
                      <PencilIcon size={16} />
                    </Button>
                  )}
                  <Button
                    variant="destructive"
                    className="b-delete"
                    onClick={() => handleDeleteDetail(item.id)}
                  >
                    <TrashIcon size={16} />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
        <tr>
          <td colSpan={7} className="text-right font-medium p-2">
            Subtotal: 
          </td>
          <td className="text-right">
            Rp.{" "}
            {subtotal.toLocaleString("id-ID", { maximumFractionDigits: 2 })}
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
                value={diskonPersen}
                onFocus={(e) => e.target.select()}
                onChange={(e) => {
                const val = parseFloat(e.target.value) || 0;
                  setDiskonPersen(val);
                  setDiskonRupiah((subtotal * val) / 100);
                }}
                placeholder="Diskon %"
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
                value={diskonRupiah}
                onFocus={(e) => e.target.select()}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 0;
                  setDiskonRupiah(val);
                  setDiskonPersen((val / subtotal) * 100);
                }}
                placeholder="Diskon Rp"
                type="number"
                />
            </div>
          </td>
        </tr>
        <tr>
          <td colSpan={7} className="text-right font-medium p-2">
            Total: 
          </td>
          <td className="font-bold p-2 text-right">
            Rp.{" "}
            {(subtotal - diskonRupiah).toLocaleString("id-ID", {
              maximumFractionDigits: 2,
            })}
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


