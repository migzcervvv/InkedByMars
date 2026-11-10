import { http } from './http'
export function fetchInstagramPosts(limit = 12, cursor = null, config = {}) { return http.get('/instagram/posts', { ...config, params: { limit, cursor } }) }
export function fetchCarouselChildren(mediaId, config = {}) { return http.get(`/instagram/posts/${mediaId}/children`, config) }
export function fetchInstagramProfile(config = {}) { return http.get('/instagram/profile', config) }
