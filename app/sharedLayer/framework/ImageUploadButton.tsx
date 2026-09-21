'use client';

import { CldUploadButton } from 'next-cloudinary';
import { FC } from 'react';

export type ImageUploadButtonProps = {
  folder: string
  publicId: string
  uploadPreset: string
  multiple?: boolean
  onUploaded?: (url: string | undefined) => void
  className?: string
  children?: string | JSX.Element | (string | JSX.Element)[]
}

// Opens the upload widget of the image storage
export const ImageUploadButton: FC<ImageUploadButtonProps> = ({
  folder, publicId, uploadPreset, multiple = false, onUploaded, className, children,
}) => (
  <CldUploadButton
    options={{ multiple, folder, publicId }}
    onUpload={(result: any) => onUploaded?.(result?.info?.secure_url)}
    uploadPreset={uploadPreset}
    className={className}
  >
    {children}
  </CldUploadButton>
);
