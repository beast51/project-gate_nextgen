  const cloudinary = require('cloudinary');
  cloudinary.v2.config({
  cloud_name: 'dcjd6ogdr',
  api_key: '744144639353525',
  api_secret: 'Iscusmz3f18YTmiQsBBd8Eu9QSk',
  secure: true
  });



  export const deleteFolder = () => {
    cloudinary.v2.api.delete_folder('cars/248').then(console.log);
  }