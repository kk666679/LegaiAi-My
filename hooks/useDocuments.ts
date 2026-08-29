import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Temporary mock implementation until actual API is ready
export function useDocuments() {
  const queryClient = useQueryClient();

  const listQuery = useQuery({
    queryKey: ["documents"],
    queryFn: async () => [],
  });

  const statsQuery = useQuery({
    queryKey: ["documents-stats"],
    queryFn: async () => ({ total: 0, draft: 0, published: 0, archived: 0 }),
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return { id: "temp-id", ...data };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return { id, ...data };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });

  const archiveMutation = useMutation({
    mutationFn: async (id: string) => {
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });

  const submitForReviewMutation = useMutation({
    mutationFn: async (id: string) => {
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: async (id: string) => {
      return { id: "duplicated-id" };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });

  return {
    documents: listQuery.data || [],
    isLoading: listQuery.isLoading,
    stats: statsQuery.data,
    createDocument: createMutation.mutate,
    updateDocument: updateMutation.mutate,
    deleteDocument: deleteMutation.mutate,
    archiveDocument: archiveMutation.mutate,
    submitForReview: submitForReviewMutation.mutate,
    approveDocument: approveMutation.mutate,
    duplicateDocument: duplicateMutation.mutate,
  };
}

export function useDocument(id: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["document", id],
    queryFn: async () => ({ id, title: "Document", content: "" }),
    enabled: !!id,
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      return { id, ...data };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["document", id] });
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });

  return {
    document: query.data,
    isLoading: query.isLoading,
    updateDocument: updateMutation.mutate,
  };
}
