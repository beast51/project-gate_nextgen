import { CarNumberPropsType } from '../CarNumber.type';
import classes from './CarNumber.module.scss';

export const CarNumber: React.FC<CarNumberPropsType> = ({ carNumber }) => {
  const regionCode = carNumber.substring(0, 2);
  const number = carNumber.substring(2, 6);
  const vehicleSeries = carNumber.substring(6);
  return (
    <div className={classes.vehicleNumber}>
      <div className={classes.countryContainer}>
        <div className={classes.flag}>
          <div className={classes.blue}></div>
          <div className={classes.yellow}></div>
        </div>
        <p className={classes.country}>UA</p>
      </div>
      <div className={classes.wrapper}>
        <span className={classes.regionCode}>{regionCode}</span>
        <span className={classes.number}>{number}</span>
        <span className={classes.vehicleSeries}>{vehicleSeries}</span>
      </div>
    </div>
  );
};
