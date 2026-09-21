'use client';

import React, { FC } from 'react';
import { HiPhoto } from 'react-icons/hi2';
import { ImageUploadButton } from '@/sharedLayer/framework/ImageUploadButton';
import { ImageControlPanelProps } from '../UploadImageButton.type';
import { Button } from '@/sharedLayer/ui/Button';
// import { deleteFolder } from '@/app/pagesLayer/GateUserPage/model/cloudinary';
import { api } from '@/sharedLayer/api';
import toast from 'react-hot-toast';
import classes from './ImageControlPanel.module.scss';
import { useIntl } from 'react-intl';

export const ImageControlPanel: FC<ImageControlPanelProps> = ({
  mainImage,
  apartmentNumber,
  carNumber,
}) => {
  const { $t } = useIntl();
  console.log('apartmentNumber', apartmentNumber);
  console.log('carNumber', carNumber);

  const deleteFiles = (data: any) => {
    api.deleteFiles(data).catch(() => toast.error('Something went wrong'));
    // .finally(() => setIsLoading(false));
  };

  return (
    <div className={classes.imageControlWrapper}>
      <ImageUploadButton
        multiple
        folder={apartmentNumber || 'withoutApartmentNumber'}
        publicId={`${apartmentNumber}/${carNumber}`}
        uploadPreset="gateUser"
        className={classes.button}
      >
        {$t({ id: 'upload a photo' })}
      </ImageUploadButton>
      <Button onClick={() => deleteFiles('test')} disabled>
        {$t({ id: 'delete a photo' })}
      </Button>
    </div>
  );
};
