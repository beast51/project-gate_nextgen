'use client';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import { GateUserType } from '@/entitiesLayer/GateUser/model/types/GateUser.type';
import { FC } from 'react';
import Image from 'next/image';

export type SliderPropsType = {
  user: GateUserType;
};

export const Slider: FC<SliderPropsType> = ({ user }) => {
  return (
    <Swiper
      spaceBetween={50}
      slidesPerView={1}
      onSlideChange={() => console.log('slide change')}
      onSwiper={(swiper) => console.log(swiper)}
    >
      {user.image && (
        <SwiperSlide key={user.image}>
          <Image
            src={user.image}
            alt="additional photo"
            sizes="100vw"
            style={{
              width: '100%',
              height: 'auto',
            }}
            priority
            width={1366}
            height={911}
          />
        </SwiperSlide>
      )}
      {user.additionalImages?.map((image) => {
        return (
          <SwiperSlide key={image}>
            <Image
              src={image}
              alt="additional photo"
              sizes="100vw"
              style={{
                width: '100%',
                height: 'auto',
              }}
              width={1366}
              height={911}
            />
          </SwiperSlide>
        );
      })}
    </Swiper>
    // </div>
  );
};
