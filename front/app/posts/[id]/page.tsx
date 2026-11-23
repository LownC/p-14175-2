"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiFetch } from "@/lib/backend/client";
import type { PostDto, RsData } from "@/types/post";

export default function Page() {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<PostDto | null>(null);

  useEffect(() => {
    apiFetch<PostDto>(`/api/v1/posts/${id}`)
      .then(setPost)
      .catch((rs: RsData<void>) => alert(rs.msg));
  }, [id]);

  if (post === null) return <div>로딩중...</div>;

  return (
    <>
      <h1 className="text-2xl font-bold">
        {post.id}번 글 : {post.title}
      </h1>

      <div className="text-sm text-gray-500">
        작성: {new Date(post.createDate).toLocaleString()}
      </div>

      <div className="mt-4 whitespace-pre-line">{post.content}</div>
    </>
  );
}
