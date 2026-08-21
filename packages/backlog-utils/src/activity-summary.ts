import { type Entity } from "backlog-js";

type ActivityContent = Entity.Activity.Activity["content"];

const STATUS_DELETED_TYPE = 34;

const getActivitySummary = (activity: { type: number; content: ActivityContent }): string => {
  const { content } = activity;
  if (
    activity.type === STATUS_DELETED_TYPE &&
    "deletedStatus" in content &&
    content.deletedStatus.name
  ) {
    return content.deletedStatus.name;
  }
  if ("summary" in content && content.summary) {
    return content.summary;
  }
  if ("link" in content && content.link.length > 0) {
    return content.link
      .map((item) => (item.key_id ? `#${item.key_id}` : (item.title ?? "")))
      .filter(Boolean)
      .join(", ");
  }
  if ("key_id" in content && content.key_id) {
    return `#${content.key_id}`;
  }
  return "";
};

export { getActivitySummary };
