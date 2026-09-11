/** Shape of `User.roleId` once Mongoose has `.populate()`-d it — the static model type stays `Types.ObjectId` since populate isn't reflected in TS. */
export interface PopulatedRole {
  _id: string;
  key: string;
  name: string;
  isSystem: boolean;
  level: number;
}
