import  { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Swal from "sweetalert2";
import { format, addMonths } from "date-fns";
import { useCreateNota } from "@/services/mutations";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar, Plus, TrashIcon } from "lucide-react";
import axios from "axios";
import { notaSchema } from "@/utils/vallidationSchema";

export type BarangDetail = {
  nama_barang: string;
  coly: number;
  satuan_coly: string;
  qty_isi: number;
  nama_isi: string;
  harga: number;
  diskon: number[];
};

const AddAll = () => {
  const formatDate = (date) => format(date, "yyyy-MM-dd");

  const now = new Date();
  const tempo = addMonths(now, 2);

  const { register, handleSubmit, reset, setValue,  formState: { errors } } = useForm({ 
    resolver: zodResolver(notaSchema),
    defaultValues: {
      no_nota: "",
      tanggal: formatDate(now),
      jt_tempo: formatDate(tempo),
      pembeli: "",
      alamat: "",
    },
  });

  const [barang, setBarang] = useState<BarangDetail[]>([]);
  const [formDetail, setFormDetail] = useState<BarangDetail>({
    nama_barang: "",
    coly: 0,
    satuan_coly: "",
    qty_isi: 0,
    nama_isi: "",
    harga: 0,
    diskon: [],
  });

  const { mutate: createNota } = useCreateNota();

  useEffect(() => {
    const fetchNoNota = async () => {
      const res = await fetch("http://localhost:3000/nota/next-number");
      const data = await res.json();
      setValue("no_nota", data.no_nota);
    };

    fetchNoNota();
  }, [setValue]);

  const onSubmit = (data) => {
    if (barang.length === 0) {
      Swal.fire("Tidak ada detail barang yang ditambahkan.");
      return;
    }

    const payload = {
      ...data,
      details: barang,
    };

    createNota(payload, {
      onSuccess: () => {
        Swal.fire("Berhasil", "Nota berhasil dibuat", "success").then(() => {
          window.location.href = "/";
        });
        reset();
        setBarang([]);
      },
      onError: (error) => {
        if (axios.isAxiosError(error)) {
            Swal.fire(
              "Gagal",
              error.response?.data || "Terjadi kesalahan",
              "error"
            );
          } else {
            Swal.fire("Gagal", "Terjadi kesalahan yang tidak terduga", "error");
          }
      },
    });
    
  };

  const addDetail = () => {
    setBarang([...barang, formDetail]);
    setFormDetail({
      nama_barang: "",
      coly: 0,
      satuan_coly: "",
      qty_isi: 0,
      nama_isi: "",
      harga: 0,
      diskon: [],
    });
  };

  const removeDetail = (index: number) => {
    const newList = [...barang];
    newList.splice(index, 1);
    setBarang(newList);
  };

  return (
    <div className="p-4 mx-8 text-lg">
      <h1 className="text-2xl font-bold mb-12 text-center">Faktur</h1>
     
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-10 mb-4">
          <div className="space-y-2">
            <div className="flex gap-8 items-center">
              <label>Nota:</label>
              <Input {...register("no_nota")} disabled className="text-xl" />
            </div>
            <div className="flex gap-2 items-center">
              <label>Tanggal:</label>
              <div className="relative w-1/3">
                <Input
                  {...register("tanggal")}
                  type="date"
                  className="w-full border border-input rounded px-4 py-2 pr-10"
                />
                <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground cursor-pointer" />
              </div>
            </div>
            <div className="flex gap-5 items-center">
              <label>Jt.Tmp:</label>
              <div className="relative w-1/3">
                <Input
                  {...register("jt_tempo")}
                  type="date"
                  className="pr-10 border px-2 py-1 rounded"
                />
                <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground cursor-pointer" />
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex gap-8 items-center">
              <p>Kepada Yth</p>
            </div>
            <div className="flex gap-2 items-center">
              <label>Pembeli:</label>
              <Input
                {...register("pembeli")}
                placeholder="Nama Pembeli"
                className="w-full border px-2 py-1 rounded"
              />
            </div>
              {errors.pembeli && <p className="text-red-500 text-right text-sm mt-0">{errors.pembeli.message}</p>}
            <div className="flex gap-5 items-center">
              <label>Alamat:</label>
              <Input
                {...register("alamat")}
                placeholder="Alamat"
                className="w-full border px-2 py-1 rounded"
              />
            </div>
            {errors.alamat && <p className="text-red-500 text-right text-sm mt-0">{errors.alamat.message}</p>}
          </div>
        </div>

        <div className="flex justify-end mb-6">
          <Button type="submit" className="text-xl px-4 py-5">
            Simpan Nota
          </Button>
        </div>
      </form>
      
      <div className="overflow-x-auto border rounded-lg">
        <table className="w-full text-left min-w-[800px] uppercase">
          <thead className="bg-gray-200">
            <tr className="text-center">
              <th className="p-2 w-[2%]">No</th>
              <th className="p-2 w-[25%] text-left">Nama Barang</th>
              <th className="p-2 w-[12%]">Coly</th>
              <th className="p-2 w-[12%]">Qty</th>
              <th className="p-2 w-[12%]">Total Qty</th>
              <th className="p-2 w-[8%] text-center">Harga</th>
              <th className="p-2 w-[9%]">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {barang.map((item, index) => (
              <tr key={index} className="border-t uppercase text-center">
                <td className="p-2">{index + 1}</td>
                <td className="p-2 text-left">
                  <Input
                    value={item.nama_barang}
                    onChange={(e) => {
                      const newList = [...barang];
                      newList[index].nama_barang = e.target.value;
                      setBarang(newList);
                    }}
                  />
                </td>
                {/* {errors.nama_barang && <p className="text-red-500 text-right w-2/5 text-sm mt-0">{errors.nama_barang.message}</p>} */}
                <td className="p-2">
                    <div className="flex gap-2">
                    <Input
                        type="number"
                        onFocus={(e) => e.target.select()}
                        value={item.coly}
                        onChange={(e) => {
                        const newList = [...barang];
                        newList[index].coly = parseFloat(e.target.value) || 0;
                        setBarang(newList);
                        }}
                    />
                    <Input
                        type="text"
                        value={item.satuan_coly}
                        onChange={(e) => {
                        const newList = [...barang];
                        newList[index].satuan_coly = e.target.value;
                        setBarang(newList);
                        }}
                    />
                    </div>
                </td>
                <td className="p-2">
                    <div className="flex gap-2">
                        <Input
                            type="number"
                            onFocus={(e) => e.target.select()}
                            value={item.qty_isi}
                            onChange={(e) => {
                            const newList = [...barang];
                            newList[index].qty_isi = parseFloat(e.target.value) || 0;
                            setBarang(newList);
                            }}
                        />
                        <Input
                            type="text"
                            value={item.nama_isi}
                            onChange={(e) => {
                            const newList = [...barang];
                            newList[index].nama_isi = e.target.value;
                            setBarang(newList);
                            }}
                        />
                        </div>
                </td>
                <td className="p-2">
                  {item.coly * item.qty_isi} {item.satuan_coly}
                </td>
                <td className="p-2 text-right">
                  <Input
                    type="number"
                    onFocus={(e) => e.target.select()}
                    value={item.harga}
                    onChange={(e) => {
                      const newList = [...barang];
                      newList[index].harga = parseFloat(e.target.value) || 0;
                      setBarang(newList);
                    }}
                  />
                </td>
                <td className="p-2 flex justify-center">
                  <button onClick={() => removeDetail(index)} className="b-delete">
                    <TrashIcon size={16} />
                  </button>
                </td>
              </tr>
            ))}
            <tr className="sticky bg-white shadow-md border-t uppercase">
              <td className="p-2 text-center">{barang.length + 1}</td>
              <td className="p-2">
                <Input
                  value={formDetail.nama_barang}
                  onChange={(e) => setFormDetail({ ...formDetail, nama_barang: e.target.value })}
                />
              </td>
              <td className="p-2">
                <div className="flex gap-2">
                    <Input
                    type="number"
                    onFocus={(e) => e.target.select()}
                    value={formDetail.coly}
                    onChange={(e) => setFormDetail({ ...formDetail, coly: parseFloat(e.target.value) || 0 })}
                    />
                    <Input
                    type="text"
                    value={formDetail.satuan_coly}
                    onChange={(e) => setFormDetail({ ...formDetail, satuan_coly: e.target.value })}
                    />
                </div>
              </td>
              <td className="p-2">
                <div className="flex gap-2">
                    <Input
                    type="number"
                    onFocus={(e) => e.target.select()}
                    value={formDetail.qty_isi}
                    onChange={(e) => setFormDetail({ ...formDetail, qty_isi: parseFloat(e.target.value) || 0 })}
                    />
                    <Input
                    type="text"
                    value={formDetail.nama_isi}
                    onChange={(e) => setFormDetail({ ...formDetail, nama_isi: e.target.value })}
                    />
                </div>
              </td>
              <td className="p-2 text-center">
                {formDetail.coly * formDetail.qty_isi} {formDetail.satuan_coly}
              </td>
              <td className="p-2">
                <Input
                  type="number"
                  onFocus={(e) => e.target.select()}
                  value={formDetail.harga}
                  onChange={(e) => setFormDetail({ ...formDetail, harga: parseFloat(e.target.value) || 0 })}
                />
              </td>
              <td className="p-2 text-center">
                <button onClick={addDetail} className="bg-blue-500 text-white px-2 py-1 rounded">
                  <Plus />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AddAll;
