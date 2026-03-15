import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import client from '../api/client'

export function useVaultEntries() {
  return useQuery({
    queryKey: ['vault'],
    queryFn: () => client.get('/vault').then(r => r.data),
    staleTime: 1000 * 60 * 5,
  })
}

export function useCreateEntry() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data) => client.post('/vault', data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vault'] })
  })
}

export function useUpdateEntry() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }) => client.put(`/vault/${id}`, data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vault'] })
  })
}

export function useDeleteEntry() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => client.delete(`/vault/${id}`).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vault'] })
  })
}