export function getPostImageUrl(post) {
 // ← new: if it's an object with `.uri`
 if (post.image && typeof post.image === "object" && post.image.uri) {
 return post.image.uri;
 }
 if (post.full_picture) return post.full_picture;
 if (post.image && typeof post.image === "string") return post.image;
 if (post.picture?.data?.url) return post.picture.data.url;
 if (post.attachments?.data?.[0]?.media?.image?.src) return post.attachments.data[0].media.image.src;
 if (post.media?.image?.src) return post.media.image.src;
 if (Array.isArray(post.album_preview) && post.album_preview.length > 0) {
 return post.album_preview[0].image_file_uri;
 }
 if (post.image?.source) return post.image.source;
 if (post.video_thumbnail) return post.video_thumbnail;
 if (post.thumbnail) return post.thumbnail;
 return null;
}

