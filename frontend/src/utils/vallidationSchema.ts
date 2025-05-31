import { z } from "zod";

//detail
export const detailBarangSchema = z.object({
  nama_barang: z.string().nonempty("Nama barang tidak boleh kosong"),
  coly: z
    .number({
      invalid_type_error: "Coly harus berupa angka",
      required_error: "Coly tidak boleh kosong",
    })
    .nonnegative("Coly tidak boleh negatif"),
  satuan_coly: z.string().nonempty("Satuan coly tidak boleh kosong"),
  qty_isi: z
    .number({
      invalid_type_error: "Qty isi harus berupa angka",
      required_error: "Qty isi tidak boleh kosong",
    })
    .nonnegative("Qty isi tidak boleh negatif"),
  nama_isi: z.string().nonempty("Nama isi tidak boleh kosong"),
  harga: z
    .number({
      invalid_type_error: "Harga harus berupa angka",
      required_error: "Harga tidak boleh kosong",
    })
    .nonnegative("Harga tidak boleh negatif"),
  diskon: z.array(
    z
      .number({
        invalid_type_error: "Diskon harus berupa angka",
      })
      .min(0, "Diskon minimal 0%")
      .max(100, "Diskon maksimal 100%")
  ).optional(),
});

//nota
export const notaSchema = z.object({
  no_nota: z.string().nonempty("Nomor nota tidak boleh kosong"),
  tanggal: z.string().nonempty("Tanggal tidak boleh kosong"),
  jt_tempo: z.string().nonempty("Jatuh tempo tidak boleh kosong"),
  pembeli: z.string().nonempty("Nama pembeli tidak boleh kosong"),
  alamat: z.string().nonempty("Alamat tidak boleh kosong"),
  details: z
    .array(detailBarangSchema)
    .min(1, "Detail barang tidak boleh kosong"),
});

