"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiFetch } from "@/lib/backend/client";
import type { PostCommentDto, PostDto, RsData } from "@/types/post";

function usePost(id: number) {
  const [post, setPost] = useState<PostDto | null>(null);

  useEffect(() => {
    apiFetch<PostDto>(`/api/v1/posts/${id}`)
      .then(setPost)
      .catch((rs: RsData<void>) => alert(`${rs.resultCode} : ${rs.msg}`));
  }, [id]);

  const deletePost = (onSuccess: (rs: RsData<void>) => void) => {
    apiFetch<RsData<void>>(`/api/v1/posts/${id}`, {
      method: "DELETE",
    })
      .then(onSuccess)
      .catch((rs: RsData<void>) => alert(`${rs.resultCode} : ${rs.msg}`));
  };

  return {
    post,
    deletePost,
  };
}

function usePostComments(id: number) {
  const [postComments, setPostComments] = useState<PostCommentDto[] | null>(null);

  useEffect(() => {
    apiFetch<PostCommentDto[]>(`/api/v1/posts/${id}/comments`)
      .then(setPostComments);
  }, [id]);

  const deleteComment = (
    commentId: number,
    onSuccess: (rs: RsData<void>) => void
  ) => {
    apiFetch<RsData<void>>(`/api/v1/posts/${id}/comments/${commentId}`, {
      method: "DELETE",
    })
      .then((rs) => {
        setPostComments((prev) =>
          prev === null ? prev : prev.filter((comment) => comment.id !== commentId)
        );
        onSuccess(rs);
      })
      .catch((rs: RsData<void>) => alert(`${rs.resultCode} : ${rs.msg}`));
  };

  const writeComment = (
    content: string,
    onSuccess: (rs: RsData<PostCommentDto>) => void
  ) => {
    apiFetch<RsData<PostCommentDto>>(`/api/v1/posts/${id}/comments`, {
      method: "POST",
      body: JSON.stringify({ content }),
    })
      .then((rs) => {
        setPostComments((prev) => (prev === null ? [rs.data] : [...prev, rs.data]));
        onSuccess(rs);
      })
      .catch((rs: RsData<void>) => alert(`${rs.resultCode} : ${rs.msg}`));
  };

  return {
    id,
    postComments,
    deleteComment,
    writeComment,
  };
}

function PostInfo({
  postState,
}: {
  postState: ReturnType<typeof usePost>;
}) {
  const router = useRouter();
  const { post, deletePost: _deletePost } = postState;

  if (post === null) return <div>로딩중...</div>;

  const deletePost = () => {
    if(!confirm(`${post.id}번 글을 삭제하시겠습니까?`)) return;

    _deletePost((rs) => {
      alert(rs.msg);
      router.replace("/posts");
    });
  };

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

function PostCommentWrite({
  postCommentsState,
}: {
  postCommentsState: ReturnType<typeof usePostComments>;
}) {
  const { writeComment } = postCommentsState;

  const handleWriteFormSubmit = (e: FormEvent<HTMLFormElement>) => {
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

    writeComment(contentInput.value, (rs) => {
      alert(rs.msg);
      form.reset();
    });
  };

  return (
    <form className="mt-2 flex gap-2" onSubmit={handleWriteFormSubmit}>
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
  );
}

function PostCommentList({
  postCommentsState,
}: {
  postCommentsState: ReturnType<typeof usePostComments>;
}) {
  const { postComments, deleteComment: _deleteComment } = postCommentsState;

  const deleteComment = (commentId: number) => {
    if (!confirm(`${commentId}번 댓글을 삭제하시겠습니까?`)) return;

    _deleteComment(commentId, (rs) => alert(rs.msg));
  };

  if (postComments === null) return <div>댓글 로딩중...</div>;

  if (postComments.length === 0) return <div>댓글이 없습니다.</div>;

  return (
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
  );
}

function PostCommentWriteAndList({
  postCommentsState,
}: {
  postCommentsState: ReturnType<typeof usePostComments>;
}) {
  const { id } = postCommentsState;

  return (
    <section className="mt-8 border-t pt-4">
      <h2 className="text-xl font-bold">{id}번 글의 댓글</h2>

      <PostCommentWrite postCommentsState={postCommentsState} />

      <PostCommentList postCommentsState={postCommentsState} />
    </section>
  );
}

export default function Page() {
  const { id: idStr } = useParams<{ id: string }>();
  const id = Number(idStr);

  const postState = usePost(id);
  const postCommentsState = usePostComments(id);

  return (
    <>
      <PostInfo postState={postState} />

      <PostCommentWriteAndList postCommentsState={postCommentsState} />
    </>
  );
}
