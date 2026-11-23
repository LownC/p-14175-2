"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiFetch } from "@/lib/backend/client";
import type { PostDto, RsData } from "@/types/post";

export default function Page() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [post, setPost] = useState<PostDto | null>(null);

  useEffect(() => {
    apiFetch<PostDto>(`/api/v1/posts/${id}`)
      .then(setPost)
      .catch((rs: RsData<void>) => alert(rs.msg));
  }, [id]);

  const deletePost = () => {
    if (!confirm(`${id}번 글을 삭제하시겠습니까?`)) return;

    apiFetch<RsData<void>>(`/api/v1/posts/${id}`, {
      method: "DELETE",
    })
      .then((rs) => {
        alert(rs.msg);
        router.replace("/posts");
      })
      .catch((rs: RsData<void>) => alert(rs.msg));
  };

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

      <div className="mt-4 flex gap-2">
        <Link href={`/posts/${post.id}/edit`} className="border px-2 py-1 rounded">
          수정
        </Link>
        <button
          type="button"
          className="border px-2 py-1 rounded"
          onClick={deletePost}
        >
          삭제
        </button>
      </div>
    </>
  );
}
