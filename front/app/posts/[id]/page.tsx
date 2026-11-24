"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiFetch } from "@/lib/backend/client";
import type { PostCommentDto, PostDto, RsData } from "@/types/post";

export default function Page() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [post, setPost] = useState<PostDto | null>(null);
  const [postComments, setPostComments] = useState<PostCommentDto[] | null>(null);

  useEffect(() => {
    apiFetch<PostDto>(`/api/v1/posts/${id}`)
      .then(setPost)
      .catch((rs: RsData<void>) => alert(`${rs.resultCode} : ${rs.msg}`));

    apiFetch<PostCommentDto[]>(`/api/v1/posts/${id}/comments`)
      .then(setPostComments);
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
      .catch((rs: RsData<void>) => alert(`${rs.resultCode} : ${rs.msg}`));
  };

  const deleteComment = (commentId: number) => {
    if (!confirm(`${commentId}번 댓글을 삭제하시겠습니까?`)) return;

    apiFetch<RsData<void>>(`/api/v1/posts/${id}/comments/${commentId}`, {
      method: "DELETE",
    })
      .then((rs) => {
        alert(rs.msg);
        setPostComments((prev) =>
          prev === null ? prev : prev.filter((comment) => comment.id !== commentId)
        );
      })
      .catch((rs: RsData<void>) => alert(`${rs.resultCode} : ${rs.msg}`));
  };

  const writeComment = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const form = e.currentTarget;
    const contentInput = form.elements.namedItem("content") as HTMLTextAreaElement;

    contentInput.value = contentInput.value.trim();

    if (contentInput.value.length === 0) {
      alert("댓글 내용을 입력해주세요.");
      contentInput.focus();
      return;
    }

    if (contentInput.value.length < 2) {
      alert("댓글 내용을 2자 이상 입력해주세요.");
      contentInput.focus();
      return;
    }

    apiFetch<RsData<PostCommentDto>>(`/api/v1/posts/${id}/comments`, {
      method: "POST",
      body: JSON.stringify({ content: contentInput.value }),
    })
      .then((rs) => {
        alert(rs.msg);
        form.reset();
        setPostComments((prev) => (prev === null ? [rs.data] : [...prev, rs.data]));
      })
      .catch((rs: RsData<void>) => alert(`${rs.resultCode} : ${rs.msg}`));
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
      <section className="mt-8 border-t pt-4">
        <h2 className="text-xl font-bold">댓글</h2>
        
        <form className="mt-2 flex gap-2" onSubmit={writeComment}>
          <textarea
            className="border p-2 rounded flex-1"
            name="content"
            placeholder="댓글을 입력하세요"
            maxLength={100}
            rows={2}
          />
          <button className="border px-3 rounded" type="submit">
            작성
          </button>
        </form>

        {postComments === null && <div>댓글 로딩중...</div>}

        {postComments?.length === 0 && <div>댓글이 없습니다.</div>}

        {postComments !== null && postComments.length > 0 && (
          <ul className="mt-2 flex flex-col gap-2">
            {postComments.map((comment) => (
              <li key={comment.id} className="border p-2 rounded">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">
                    {comment.id}번 댓글 · {new Date(comment.createDate).toLocaleString()}
                  </span>
                  <button
                    type="button"
                    className="text-sm border px-2 rounded"
                    onClick={() => deleteComment(comment.id)}
                  >
                    삭제
                  </button>
                </div>
                <div className="whitespace-pre-line">{comment.content}</div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
