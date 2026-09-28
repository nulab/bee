import { type Entity } from "backlog-js";
import { type BacklogClient } from "./client";

// backlog-js has no methods for these document endpoints yet, so they are
// called through its generic request helpers. Replace each function with the
// backlog-js method once one exists.

type DocumentCommentEntry = {
  id: string;
  documentId: string;
  content: string;
  plain: string;
  createdUserId: number;
  created: string;
  updatedUserId: number;
  updated: string;
  createdUser: Entity.User.User | null;
};

type DocumentCommentReply = DocumentCommentEntry & {
  commentId: string;
};

type DocumentComment = DocumentCommentEntry & {
  statusId: number;
  commentType: string;
  replies: DocumentCommentReply[];
};

const getDocumentComments = (
  client: BacklogClient,
  documentId: string,
): Promise<DocumentComment[]> => client.get(`documents/${documentId}/comments`);

const getDocumentsCount = (
  client: BacklogClient,
  projectIdOrKey: string,
): Promise<{ count: number }> => client.get("documents/count", { projectIdOrKey });

const addDocumentTags = (
  client: BacklogClient,
  documentId: string,
  tagNames: string[],
): Promise<Entity.Document.Tag[]> => client.post(`documents/${documentId}/tags`, { tagNames });

const removeDocumentTags = (
  client: BacklogClient,
  documentId: string,
  tagNames: string[],
): Promise<void> => client.delete(`documents/${documentId}/tags`, { tagNames });

export { addDocumentTags, getDocumentComments, getDocumentsCount, removeDocumentTags };
export type { DocumentComment, DocumentCommentEntry, DocumentCommentReply };
