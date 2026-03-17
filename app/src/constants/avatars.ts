import { ImageSourcePropType } from 'react-native';

export interface AvatarAsset {
  id: number;
  source: ImageSourcePropType;
}

export const DEFAULT_AVATAR_ID = 1;

export const AVATARS: AvatarAsset[] = [
  { id: 1, source: require('../../assets/avatars/avatar-01.png') },
  { id: 2, source: require('../../assets/avatars/avatar-02.png') },
  { id: 3, source: require('../../assets/avatars/avatar-03.png') },
  { id: 4, source: require('../../assets/avatars/avatar-04.png') },
  { id: 5, source: require('../../assets/avatars/avatar-05.png') },
  { id: 6, source: require('../../assets/avatars/avatar-06.png') },
  { id: 7, source: require('../../assets/avatars/avatar-07.png') },
  { id: 8, source: require('../../assets/avatars/avatar-08.png') },
  { id: 9, source: require('../../assets/avatars/avatar-09.png') },
  { id: 10, source: require('../../assets/avatars/avatar-10.png') },
  { id: 11, source: require('../../assets/avatars/avatar-11.png') },
  { id: 12, source: require('../../assets/avatars/avatar-12.png') },
  { id: 13, source: require('../../assets/avatars/avatar-13.png') },
  { id: 14, source: require('../../assets/avatars/avatar-14.png') },
  { id: 15, source: require('../../assets/avatars/avatar-15.png') },
  { id: 16, source: require('../../assets/avatars/avatar-16.png') },
  { id: 17, source: require('../../assets/avatars/avatar-17.png') },
  { id: 18, source: require('../../assets/avatars/avatar-18.png') },
  { id: 19, source: require('../../assets/avatars/avatar-19.png') },
  { id: 20, source: require('../../assets/avatars/avatar-20.png') },
  { id: 21, source: require('../../assets/avatars/avatar-21.png') },
  { id: 22, source: require('../../assets/avatars/avatar-22.png') },
  { id: 23, source: require('../../assets/avatars/avatar-23.png') },
  { id: 24, source: require('../../assets/avatars/avatar-24.png') },
  { id: 25, source: require('../../assets/avatars/avatar-25.png') },
  { id: 26, source: require('../../assets/avatars/avatar-26.png') },
  { id: 27, source: require('../../assets/avatars/avatar-27.png') },
  { id: 28, source: require('../../assets/avatars/avatar-28.png') },
  { id: 29, source: require('../../assets/avatars/avatar-29.png') },
  { id: 30, source: require('../../assets/avatars/avatar-30.png') },
  { id: 31, source: require('../../assets/avatars/avatar-31.png') },
  { id: 32, source: require('../../assets/avatars/avatar-32.png') },
  { id: 33, source: require('../../assets/avatars/avatar-33.png') },
  { id: 34, source: require('../../assets/avatars/avatar-34.png') },
  { id: 35, source: require('../../assets/avatars/avatar-35.png') },
  { id: 36, source: require('../../assets/avatars/avatar-36.png') },
  { id: 37, source: require('../../assets/avatars/avatar-37.png') },
  { id: 38, source: require('../../assets/avatars/avatar-38.png') },
  { id: 39, source: require('../../assets/avatars/avatar-39.png') },
  { id: 40, source: require('../../assets/avatars/avatar-40.png') },
  { id: 41, source: require('../../assets/avatars/avatar-41.png') },
  { id: 42, source: require('../../assets/avatars/avatar-42.png') },
  { id: 43, source: require('../../assets/avatars/avatar-43.png') },
  { id: 44, source: require('../../assets/avatars/avatar-44.png') },
  { id: 45, source: require('../../assets/avatars/avatar-45.png') },
  { id: 46, source: require('../../assets/avatars/avatar-46.png') },
  { id: 47, source: require('../../assets/avatars/avatar-47.png') },
  { id: 48, source: require('../../assets/avatars/avatar-48.png') },
  { id: 49, source: require('../../assets/avatars/avatar-49.png') },
  { id: 50, source: require('../../assets/avatars/avatar-50.png') },
  { id: 51, source: require('../../assets/avatars/avatar-51.png') },
  { id: 52, source: require('../../assets/avatars/avatar-52.png') },
  { id: 53, source: require('../../assets/avatars/avatar-53.png') },
  { id: 54, source: require('../../assets/avatars/avatar-54.png') },
  { id: 55, source: require('../../assets/avatars/avatar-55.png') },
  { id: 56, source: require('../../assets/avatars/avatar-56.png') },
];

export function getAvatarById(id: number): AvatarAsset {
  return AVATARS.find(a => a.id === id) ?? AVATARS[0];
}
