/** Shape of `BlogPost.authorId` once Mongoose has `.populate()`-d it — the static model type stays `Types.ObjectId` since populate isn't reflected in TS. */
export interface PopulatedAuthor {
  name: string;
  email?: string;
  image?: string;
}
