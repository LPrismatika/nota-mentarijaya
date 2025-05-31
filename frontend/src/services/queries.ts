import { useQuery } from "@tanstack/react-query";
import { getAllDetailNota, getAllNota } from "./api";


export function useGetAllNota(){
    return useQuery({
        queryKey: ["nota"],
        queryFn: getAllNota
    })
}

export function useGetDetailNota(notaId: number){
    return useQuery({
        queryKey: ["detail nota", notaId],
        queryFn: () => getAllDetailNota(notaId),
        enabled: !!notaId,
    })
}