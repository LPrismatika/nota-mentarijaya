import type { DetailNota } from "./detailNota";

export interface Nota {
    id?: number,
    no_nota: string,
    tanggal: string,
    pembeli: string,
    alamat: string,
    subtotal: number;
    diskon_persen: number;
    diskon_rupiah: number;
    total_harga: number,
    total_coly: number,
    jt_tempo: string,
    status: number,
    created_at: string,
    updated_at: string,
    details: DetailNota[],
}

export interface NotaPayload extends Omit<Nota, "id" | "details"> {
  details: Omit<DetailNota, "notaId">[];
}


export interface Pagination {
    totalCount: number;
    pageSize: number;
    currentPage: number;
    totalPages: number;
  }

export interface NotaResponse {
    data: Nota[],
    pagination: Pagination,
}