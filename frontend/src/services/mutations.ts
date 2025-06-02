import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cekNota, createDetailNota, createNota, deleteDetailNota, printNota, unCekNota, updateDetailNota, updateNota } from "./api";
import type { Nota, NotaPayload } from "@/types/nota";
import type { DetailNota } from "@/types/detailNota";

//buat nota
export function useCreateNota() { 
    const queryClient = useQueryClient();
    return useMutation({
        mutationKey: ["createNota"],
        mutationFn: (notaData: NotaPayload) => createNota(notaData),

        onError: () =>{
            console.log("error");            
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["nota"]})
        }
    })
}

//edit nota
export function useUpdateNota() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationKey: ["updateNota"],
        mutationFn: ({id, data} : {id: number; data: Nota}) => 
            updateNota(id, data),
        onError: () => {
            console.log("error");            
        }, 
        onSuccess: async () => {
            await queryClient.invalidateQueries({queryKey: ["nota"]})
        }
    }) 
}

//buat detail-nota
export function useCreateDetailNota() {
    const queryClient = useQueryClient();
  
    return useMutation({
      mutationKey: ["createDetailNota"],
      mutationFn: (detailNota: DetailNota) => createDetailNota(detailNota),
      onError: (error) => {
        console.error("Error creating detail nota:", error);
      },
      onSuccess: () => {
        // Optionally invalidate relevant queries to refresh data after creation
        queryClient.invalidateQueries({ queryKey: ["detail-nota"] });
      },
    });
}

export function useUpdateDetailNota() {
    const queryClient = useQueryClient();
  
    return useMutation({
      mutationKey: ["updateDetailNota"],
      mutationFn: ({ id, nota_id, detailNota }: { id: number; nota_id: number; detailNota: DetailNota }) =>
        updateDetailNota(id, nota_id, detailNota),
      onError: (error) => {
        console.error("Error updating detail nota:", error);
      },
      onSuccess: () => {
        // Invalidate the relevant queries to refresh the list after update
        queryClient.invalidateQueries({ queryKey: ["detail-nota"] });
      },
    });
}

export function useDeleteDetailNota() {
    const queryClient = useQueryClient();
  
    return useMutation({
      mutationKey: ["deleteDetailNota"],
      mutationFn: (id: number) => deleteDetailNota(id),
      onError: (error) => {
        console.error("Error deleting detail nota:", error);
      },
      onSuccess: () => {
        // Invalidate the relevant queries to refresh data after deletion
        queryClient.invalidateQueries({ queryKey: ["detail-nota"] });
      },
    });
}

export function useCekNota() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["cekNota"],
    mutationFn: (id: number) => cekNota(id),
    onError: (error) => {
      console.error("Error cek nota:", error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nota"] });
    },
  });
}

export function useUnCekNota() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["cekNota"],
    mutationFn: (id: number) => unCekNota(id),
    onError: (error) => {
      console.error("Error cek nota:", error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nota"] });
    },
  });
}

export function usePrintNota() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["printNota"],
    mutationFn: (id: number) => printNota(id),
    onError: (error) => {
      console.error("Error print nota:", error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nota"] });
    },
  });
}
 
  