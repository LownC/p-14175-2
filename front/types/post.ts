export type PostDto = {
  id: number;
  createDate: string;
  modifyDate: string;
  title: string;
  content: string;
};

export type RsData<T> = {
  resultCode: string;
  msg: string;
  data: T;
};

