'use client';

import React from 'react';
import { HiPhoto } from 'react-icons/hi2';
import { CldUploadButton } from 'next-cloudinary';

export const UploadImageButton = () => {
  return (
    <CldUploadButton
      options={{ cropping: true, multiple: false, publicId: '380932808527' }}
      onUpload={(result: any) =>
        console.log('done uploading', result?.info?.secure_url)
      }
      uploadPreset="gateUser"
    >
      <HiPhoto />
    </CldUploadButton>
  );
};
