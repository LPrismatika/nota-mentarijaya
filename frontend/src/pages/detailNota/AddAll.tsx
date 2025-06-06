import  { useEffect, useRef, useState } from "react";
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
  jumlah: number;
  harga: number;
  total: number;
  diskon: number[];
};

const AddAll = () => {
  const formatDate = (date) => format(date, "yyyy-MM-dd");
  const now = new Date();
  const tempo = addMonths(now, 2);

  const getDiskonBertumpuk = (hargaAwal: number, diskonList?: number[]) => {
    if (!Array.isArray(diskonList) || diskonList.length === 0) return hargaAwal;
    return diskonList.reduce((harga, diskon) => {
      const persen = isNaN(diskon) ? 0 : diskon;
      return harga - harga * (persen / 100);
    }, hargaAwal);
  };

  const normalizeNumber = (val: string | number): number => {
    if (typeof val === "string") {
      return parseFloat(val.replace(",", ".")) || 0;
    }
    return Number(val) || 0;
  };

  function formatRibuan(angka: number | string): string {
    const num = typeof angka === "string" ? parseFloat(angka) : angka;
    if (isNaN(num)) return "0";
    return num.toLocaleString("id-ID", {
      maximumFractionDigits: 2,
    });
  }

  const { register, handleSubmit, reset, setValue,  formState: { errors } } = useForm({ 
    // resolver: zodResolver(notaSchema),
    defaultValues: {
      no_nota: "",
      tanggal: formatDate(now),
      jt_tempo: formatDate(tempo),
      pembeli: "",
      alamat: "",
      details: [],
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
    jumlah: 0,
    total: 0,
    diskon: [],
  });

  const [diskonPersen, setDiskonPersen] = useState(0);
  const [diskonRupiah, setDiskonRupiah] = useState(0);
  const { mutate: createNota } = useCreateNota();

  const totalBarang = barang.map((item) => ({
    ...item,
    total: getDiskonBertumpuk(
      normalizeNumber(item.harga) * normalizeNumber(item.coly) * normalizeNumber(item.qty_isi),
      item.diskon
    ),
    diskon: JSON.stringify(item.diskon),
  }));

  const subtotal = totalBarang.reduce(
    (sum, item) => normalizeNumber(sum) + normalizeNumber(item.total),
    0
  );
  const totalHarga = subtotal - diskonRupiah;
  const totalColy = totalBarang.reduce((sum, item) => sum + item.coly, 0);

  useEffect(() => {
    const fetchNoNota = async () => {
      const res = await fetch("http://localhost:3001/nota/next-number");
      const data = await res.json();
      const noNotaFormatted = data.no_nota;

      setValue("no_nota", noNotaFormatted);
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
      subtotal,
      diskon_persen: diskonPersen,
      diskon_rupiah: diskonRupiah,
      total_harga: totalHarga,
      total_coly: totalColy,
      details: totalBarang,
    };

    createNota(payload, {
      onSuccess: () => {
        Swal.fire("Berhasil", "Nota berhasil dibuat", "success").then(() => {
          window.location.href = "/nota/frontend";
        });
        reset();
        setBarang([]);
        setDiskonPersen(0);
        setDiskonRupiah(0);
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
    console.log("PAYLOAD:", data);
    
  };

  const inputNamaBarang = useRef<HTMLInputElement>(null);
  const inputTanggal = useRef<HTMLInputElement>(null);
  const inputTempo = useRef<HTMLInputElement>(null);

  const addDetail = () => {
    const jumlah = formDetail.coly * formDetail.qty_isi;
    const total = getDiskonBertumpuk(
      formDetail.harga * jumlah,
      formDetail.diskon
    ).toFixed(2);
    setBarang([...barang, { ...formDetail, jumlah, total }]);
    setFormDetail({
      nama_barang: "",
      coly: 0,
      satuan_coly: "",
      qty_isi: 0,
      nama_isi: "",
      harga: 0,
      jumlah: 0,
      total: 0,
      diskon: [],
    });
    inputNamaBarang.current?.focus();
  };

  const addDiscount = () => {
    setFormDetail({
      ...formDetail,
      diskon: [...formDetail.diskon, 0],
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
         
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-10 mb-4">
          <div className="space-y-2">
            <div className="flex gap-8 items-center">
              <label>Nota:</label>
              <Input {...register("no_nota")} disabled className="text-xl w-1/3" />
            </div>
            <div className="flex gap-2 items-center">
              <label>Tanggal:</label>
              <div className="relative w-1/3">
                <Input
                  {...register("tanggal")}
                  ref={(el) => {
                    register("tanggal").ref(el);
                    inputTanggal.current = el;
                  }}
                  type="date"
                  className="w-full border border-input rounded px-4 py-2 pr-10"
                />
                <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground cursor-pointer"
                onClick={() =>
                  inputTanggal.current?.showPicker?.() ||
                  inputTanggal.current?.focus()
                }
                />
              </div>
            </div>
            <div className="flex gap-5 items-center">
              <label>Jt.Tmp:</label>
              <div className="relative w-1/3">
                <Input
                  {...register("jt_tempo")}
                  ref={(el) => {
                    register("jt_tempo").ref(el);
                    inputTempo.current = el;
                  }}
                  type="date"
                  className="pr-10 border px-2 py-1 rounded"
                />
                <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground cursor-pointer" 
                onClick={() =>
                  inputTempo.current?.showPicker?.() ||
                  inputTempo.current?.focus()
                }
                />
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
          <Button type="submit" onClick={handleSubmit(onSubmit)} className="text-xl px-4 py-5">
            Simpan Nota
          </Button>
        </div>
      
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
              <th className="p-2 w-[5%] text-center">Diskon</th>
              <th className="p-2 w-[10%] text-center">Sub Total</th>
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
                  {item.jumlah} {item.satuan_coly}
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
                <td className="p-2 text-right">
                {item.diskon.map((d, i) => (
                    <Input
                      key={i}
                      type="text"
                      className="w-full border px-2 py-1 mb-1 text-right"
                      value={d?.toString().replace(".", ",") ?? ""}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => {
                        const input = e.target.value;
                        const stringWithDot = input.replace(",", ".");
                        const value = parseFloat(stringWithDot);

                        const newDiskon = [...item.diskon];
                        newDiskon[i] = isNaN(value) ? 0 : value;

                        const newList = [...barang];
                        newList[index].diskon = newDiskon;

                        const coly = parseFloat(newList[index].coly) || 0;
                        const qty = parseFloat(newList[index].qty_isi) || 0;
                        const harga = parseFloat(newList[index].harga) || 0;
                        let total = coly * qty * harga;

                        newDiskon.forEach((persen) => {
                          total -= (total * persen) / 100;
                        });

                        newList[index].total = total;

                        setBarang(newList);
                      }}
                    />
                  ))}
                </td>                
                <td className="p-2 text-right">
                        {formatRibuan(item.total)}</td>
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
              {formDetail.diskon.map((d, i) => (
                  <input
                    key={i}
                    type="number"
                    className="w-full border px-2 py-1 mb-1"
                    value={d}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value) || 0;
                      const newDiskon = [...formDetail.diskon];
                      newDiskon[i] = value;

                      setFormDetail({
                        ...formDetail,
                        diskon: newDiskon,
                      });
                    }}
                  />
                ))}
                <button
                  className="b-white"
                  onClick={addDiscount}
                >
                  <Plus />
                </button>
              </td>
              <td className="p-2 text-right">
                {formDetail.harga && formDetail.qty_isi
                  ? formatRibuan(
                      getDiskonBertumpuk(
                        formDetail.harga * formDetail.coly * formDetail.qty_isi,
                        formDetail.diskon
                      )
                    )
                  : 0}
              </td>
              <td className="p-2 text-center">
                <button onClick={addDetail} className="bg-blue-500 text-white px-2 py-1 rounded">
                  <Plus />
                </button>
              </td>
            </tr>
          </tbody>
          <tr className="text-right">
              <td colSpan={7}>
                <div className="my-1.5">Subtotal:</div>
              </td>
              <td>
                {subtotal.toLocaleString("id-ID", {
                  maximumFractionDigits: 2,
                })}
              </td>
              <td></td>
            </tr>
            <tr className="text-right">
              <td colSpan={7}>
                <div className="my-1.5">
                  <p>Diskon:</p>
                </div>
              </td>
              <td>
                <div className="flex justify-evenly">
                  <Input
                    className="w-18"
                    value={diskonPersen}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      setDiskonPersen(val);
                      const rupiah = (subtotal * val) / 100;
                      setDiskonRupiah(rupiah);
                    }}
                    placeholder="Diskon %"
                    type="number"
                    onFocus={(e) => e.target.select()}
                  />
                  <span>%</span>
                </div>
              </td>
              <td>
                <div className="flex justify-evenly">
                  <span>Rp</span>
                  <Input
                    className="w-25"
                    value={diskonRupiah}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      setDiskonRupiah(val);
                      setDiskonPersen((val / subtotal) * 100);
                    }}
                    placeholder="Diskon Rp"
                    type="number"
                    onFocus={(e) => e.target.select()}
                  />
                </div>
              </td>
            </tr>
            <tr className="text-right">
              <td colSpan={7}>
                <div className="my-1.5">Total Harga:</div>
              </td>
              <td className="font-bold">
                {totalHarga.toLocaleString("id-ID", {
                  maximumFractionDigits: 2,
                })}
              </td>
              <td></td>
            </tr>
        </table>
      </div>
    </div>
  );
};

export default AddAll;
