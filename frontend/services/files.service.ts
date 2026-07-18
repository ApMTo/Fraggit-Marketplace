import api from '@/lib/api';

export type UploadedFileResult = {
  url: string;
  public_id: string;
};

export const filesService = {
  async uploadImage(file: File): Promise<UploadedFileResult> {
    const formData = new FormData();
    formData.append('file', file);

    const { data } = await api.post<UploadedFileResult>(
      '/files/upload',
      formData,
    );

    return data;
  },
};
