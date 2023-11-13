'use client';

import React, { FC } from 'react';
import { HiPhoto } from 'react-icons/hi2';
import { CldUploadButton } from 'next-cloudinary';
import { ImageControlPanelProps } from '../UploadImageButton.type';
import { Button } from '@/sharedLayer/ui/Button';
// import { deleteFolder } from '@/app/pagesLayer/GateUserPage/model/cloudinary';
import axios from 'axios';
import toast from 'react-hot-toast';
import classes from './ImageControlPanel.module.scss';

export const ImageControlPanel: FC<ImageControlPanelProps> = ({
  mainImage,
  apartmentNumber,
  carNumber,
}) => {
  console.log('apartmentNumber', apartmentNumber);
  console.log('carNumber', carNumber);

  const deleteFiles = (data: any) => {
    axios
      .post('/api/cloudinary/delete_files', data, {
        headers: {
          'Content-Type': 'application/json',
        },
      })
      .then(() => console.log('data', data))
      .catch(() => toast.error('Something went wrong'));
    // .finally(() => setIsLoading(false));
  };

  return (
    <div className={classes.imageControlWrapper}>
      <CldUploadButton
        options={{
          multiple: true,
          folder: apartmentNumber,
          publicId: `${apartmentNumber}/${carNumber}`,
        }}
        onUpload={(result: any) =>
          console.log('done uploading', result?.info?.secure_url)
        }
        uploadPreset="gateUser"
        className={classes.button}
      >
        Загрузить фото
        {/* <HiPhoto className={classes.icon} /> */}
      </CldUploadButton>
      <Button onClick={() => deleteFiles('test')}>Удалить фото</Button>
    </div>
  );
};
