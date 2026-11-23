"use client";

import { FormEvent, useEffect, useState } from "react";
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

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const form = e.currentTarget;
    const titleInput = form.elements.namedItem("title") as HTMLInputElement;
    const contentInput = form.elements.namedItem("content") as HTMLTextAreaElement;

    titleInput.value = titleInput.value.trim();
    contentInput.value = contentInput.value.trim();

    if (titleInput.value.length < 2) {
      alert("제목을 2자 이상 입력해주세요.");
      titleInput.focus();
      return;
    }

    if (contentInput.value.length < 2) {
      alert("내용을 2자 이상 입력해주세요.");
      contentInput.focus();
      return;
    }

    apiFetch<RsData<void>>(`/api/v1/posts/${id}`, {
      method: "PUT",
      body: JSON.stringify({
        title: titleInput.value,
        content: contentInput.value,
      }),
    })
      .then((rs) => {
        alert(rs.msg);
        router.replace(`/posts/${id}`);
      })
      .catch((rs: RsData<void>) => alert(rs.msg));
  };

  if (post === null) return <div>로딩중...</div>;

  return (
    <>
      <h1 className="text-2xl font-bold">{post.id}번 글 수정</h1>

      <form className="mt-4 flex flex-col gap-2" onSubmit={handleSubmit}>
        <input
          className="border p-2 rounded"
          type="text"
          name="title"
          placeholder="제목"
          maxLength={100}
          defaultValue={post.title}
          autoFocus
        />
        <textarea
          className="border p-2 rounded h-40"
          name="content"
          placeholder="내용"
          maxLength={5000}
          defaultValue={post.content}
        />
        <button className="border p-2 rounded" type="submit">
          수정
        </button>
      </form>
    </>
  );
}
