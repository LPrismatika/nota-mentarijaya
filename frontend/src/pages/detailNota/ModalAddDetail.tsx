import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
  } from "@/components/ui/dialog";
  import { Input } from "@/components/ui/input";
  import { Button } from "@/components/ui/button";
  import { useForm } from "react-hook-form";
  import { useCreateDetailNota } from "@/services/mutations";
  import { useState, useEffect } from "react";
  import Swal from "sweetalert2";
  import axios from "axios";
  import { useQueryClient } from "@tanstack/react-query";
  
  type Props = {
    notaId: Number | undefined; 
    onAdd: (detail: any) => void;
  };
  
  
  export default function AddDetailModal({ notaId, onAdd }: Props) {
    const createDetail = useCreateDetailNota();
    const [open, setOpen] = useState(false);
    const queryClient = useQueryClient();
  
    const {
      register,
      handleSubmit,
      reset,
      watch,
      setValue,
    } = useForm({
      defaultValues: {
        nama_barang: "",
        coly: 0,
        satuan_coly: "",
        qty_isi: 0,
        nama_isi: "",
        harga: 0,
        diskon: [],
        jumlah: 0,
        total: 0,
      },
    });
  
    // Ambil nilai-nilai untuk perhitungan real-time
    const coly = watch("coly");
    const qty_isi = watch("qty_isi");
    const harga = watch("harga");
    const diskon = watch("diskon");

    const getDiskonBertumpuk = (hargaAwal: number, diskonList?: number[]) => {
      if (!Array.isArray(diskonList) || diskonList.length === 0) return hargaAwal;
      return diskonList.reduce((harga, diskon) => {
        const persen = isNaN(diskon) ? 0 : diskon;
        return harga - harga * (persen / 100);
      }, hargaAwal);
    };

    const addDiskon = () => {
      const currentDiskon = watch("diskon") || [];
      setValue("diskon", [...currentDiskon, 0]);
    };
  
    // Hitung jumlah & total secara otomatis saat input berubah
    useEffect(() => {
      const jumlah = coly * qty_isi;
      const hargaAkhir = getDiskonBertumpuk(harga, diskon);
      const total = jumlah * hargaAkhir;
    
      setValue("jumlah", jumlah || 0);
      setValue("total", total || 0);
    }, [coly, qty_isi, harga, diskon, setValue]);
  
    const onSubmit = (data: any) => {
      const payload = {
        ...data,
        notaId: notaId ? Number(notaId) : undefined,
        diskon: JSON.stringify(data.diskon),
      };
      
      
      createDetail.mutate(payload, {
        onSuccess: () => {
          Swal.fire({
            icon: "success",
            title: "Success!",
            text: "Nota created successfully!",
          });
          console.log(notaId, "id");
          queryClient.invalidateQueries({ queryKey: ["detail-nota"] });
          onAdd(payload);
          reset();
          setOpen(false);
        },
        onError: (error) => {
          if (axios.isAxiosError(error)) {
            Swal.fire({
              icon: "error",
              title: "Failed!",
              text: error.response?.data,
            });
          }
        },
      });
    };
  
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button onClick={() => setOpen(true)}>+ Add Detail</Button>
        </DialogTrigger>
  
        <DialogContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle>Tambah Detail Nota</DialogTitle>
            </DialogHeader>
  
            <div className="grid gap-4 py-4">
              <div className="flex flex-col">
                  <label className="text-sm font-semibold">Nama Barang</label>
                  <Input placeholder="Nama Barang" {...register("nama_barang")} />
                </div>
  
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <label className="text-sm font-semibold">Coly</label>
                    <Input type="number" placeholder="Coly" {...register("coly", { valueAsNumber: true })} onFocus={(e) => e.target.select()} />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-sm font-semibold">Satuan Coly</label>
                    <Input placeholder="Satuan Coly" {...register("satuan_coly")} />
                  </div>
                </div>
  
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <label className="text-sm font-semibold">Qty Isi</label>
                    <Input type="number" placeholder="Qty Isi" {...register("qty_isi", { valueAsNumber: true })} onFocus={(e) => e.target.select()}/>
                  </div>
                  <div className="flex flex-col">
                    <label className="text-sm font-semibold">Nama Isi</label>
                    <Input placeholder="Nama Isi" {...register("nama_isi")} />
                  </div>
                </div>
  
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <label className="text-sm font-semibold">Harga</label>
                    <Input type="number" placeholder="Harga" {...register("harga", { valueAsNumber: true })} onFocus={(e) => e.target.select()}/>
                  </div>
                  <div className="flex flex-col">
                    <label className="text-sm font-semibold">Diskon (%)</label>
                    {watch("diskon")?.map((d, i) => (
                      <Input
                        key={i}
                        type="number"
                        className="mb-1"
                        value={d}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          const updated = [...watch("diskon")];
                          updated[i] = val;
                          setValue("diskon", updated);
                        }}
                      />
                    ))}
                    <Button type="button" className="b-white" variant="outline" onClick={addDiskon}>
                      + Tambah Diskon
                    </Button>
                  </div>

                </div>
            </div>
  
            <DialogFooter>
              <Button type="submit" disabled={createDetail.isPending}>
                {createDetail.isPending ? "Menyimpan..." : "Simpan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    );
  }
  