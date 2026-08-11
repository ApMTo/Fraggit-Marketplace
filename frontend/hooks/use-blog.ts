'use client';

import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { blogKeys, blogService } from '@/services/blog.service';
import type {
  CreateBlogPostPayload,
  FindBlogPostsParams,
  UpdateBlogPostPayload,
} from '@/types/blog';

export function useBlogPosts(params: FindBlogPostsParams) {
  return useQuery({
    queryKey: blogKeys.list(params),
    queryFn: () => blogService.getPosts(params),
    staleTime: 30_000,
    placeholderData: (previous) => previous,
  });
}

export function useBlogLatest() {
  return useQuery({
    queryKey: blogKeys.latest(),
    queryFn: () => blogService.getLatest(),
    staleTime: 60_000,
  });
}

export function useBlogPost(slug: string | null) {
  return useQuery({
    queryKey: blogKeys.detail(slug ?? ''),
    queryFn: () => blogService.getBySlug(slug!),
    enabled: Boolean(slug),
    staleTime: 60_000,
  });
}

export function useBlogMutations() {
  const queryClient = useQueryClient();

  const invalidateBlog = () =>
    queryClient.invalidateQueries({ queryKey: blogKeys.all });

  const createMutation = useMutation({
    mutationFn: (payload: CreateBlogPostPayload) => blogService.create(payload),
    onSuccess: invalidateBlog,
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateBlogPostPayload;
    }) => blogService.update(id, payload),
    onSuccess: invalidateBlog,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => blogService.remove(id),
    onSuccess: invalidateBlog,
  });

  return { createMutation, updateMutation, deleteMutation };
}
