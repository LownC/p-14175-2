"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/backend/client";
import type { PostDto } from "@/types/post";

export default function Page() {
  const [posts, setPosts] = useState<PostDto[] | null>(null);

  useEffect(() => {
    apiFetch<PostDto[]>("/api/v1/posts").then(setPosts);
  }, []);

  if (posts === null) return <div>로딩중...</div>;

  return (
    <>
      <h1 className="text-2xl font-bold">글 목록</h1>

      <Link href="/posts/write" className="inline-block mt-2 border px-2 py-1 rounded">
        글쓰기
      </Link>

      {posts.length === 0 && <div>글이 없습니다.</div>}

      <ul>
        {posts.map((post) => (
          <li key={post.id}>
            <Link href={`/posts/${post.id}`}>
              {post.id} : {post.title}
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
