import NextImage from 'next/image';
import { CSSProperties, FC } from 'react';

export type ImageProps = {
  src: string
  alt: string
  // fills the parent element instead of having its own size
  fill?: boolean
  width?: number
  height?: number
  sizes?: string
  // load early: the image is visible without scrolling
  priority?: boolean
  className?: string
  style?: CSSProperties
}

// An optimized image
export const Image: FC<ImageProps> = (props) => <NextImage {...props} />;
