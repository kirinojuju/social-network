// Photo ids in display order; older single-photo responses only have `image_id`.
export function postImageIds(post) {
  if (Array.isArray(post.image_ids) && post.image_ids.length) return post.image_ids
  return post.image_id ? [post.image_id] : []
}
