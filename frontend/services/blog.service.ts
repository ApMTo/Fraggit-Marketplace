import api from '@/lib/api';
import type {
  BlogPostCard,
  BlogPostDetail,
  BlogPostEditorDetail,
  BlogPostListResult,
  CreateBlogPostPayload,
  FindBlogPostsParams,
  UpdateBlogPostPayload,
} from '@/types/blog';

export const blogKeys = {
  all: ['blog'] as const,
  lists: () => [...blogKeys.all, 'list'] as const,
  list: (params: FindBlogPostsParams) =>
    [...blogKeys.lists(), params] as const,
  latest: () => [...blogKeys.all, 'latest'] as const,
  details: () => [...blogKeys.all, 'detail'] as const,
  detail: (slug: string) => [...blogKeys.details(), slug] as const,
  editors: () => [...blogKeys.all, 'editor'] as const,
  editor: (slug: string) => [...blogKeys.editors(), slug] as const,
};

function buildBlogFormData(
  payload: CreateBlogPostPayload | UpdateBlogPostPayload,
): FormData {
  const formData = new FormData();

  if (payload.title !== undefined) {
    formData.append('title', JSON.stringify(payload.title));
  }

  if (payload.content !== undefined) {
    formData.append('content', JSON.stringify(payload.content));
  }

  if (payload.slug) {
    formData.append('slug', payload.slug);
  }

  if (payload.cover instanceof File) {
    formData.append('cover', payload.cover);
  }

  return formData;
}

export const blogService = {
  async getPosts(params: FindBlogPostsParams = {}): Promise<BlogPostListResult> {
    const { data } = await api.get<BlogPostListResult>('/blog', { params });
    return data;
  },

  async getLatest(): Promise<BlogPostCard[]> {
    const { data } = await api.get<BlogPostCard[]>('/blog/latest');
    return data;
  },

  async getBySlug(slug: string): Promise<BlogPostDetail> {
    const { data } = await api.get<BlogPostDetail>(`/blog/${slug}`);
    return data;
  },

  async getEditorBySlug(slug: string): Promise<BlogPostEditorDetail> {
    const { data } = await api.get<BlogPostEditorDetail>(
      `/blog/${slug}/editor`,
    );
    return data;
  },

  async create(payload: CreateBlogPostPayload): Promise<BlogPostEditorDetail> {
    const formData = buildBlogFormData(payload);
    const { data } = await api.post<BlogPostEditorDetail>('/blog', formData);
    return data;
  },

  async update(
    id: string,
    payload: UpdateBlogPostPayload,
  ): Promise<BlogPostEditorDetail> {
    const formData = buildBlogFormData(payload);
    const { data } = await api.patch<BlogPostEditorDetail>(
      `/blog/${id}`,
      formData,
    );
    return data;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/blog/${id}`);
  },
};
