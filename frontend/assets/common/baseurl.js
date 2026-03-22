import { Platform } from 'react-native'


let baseURL = '';

{
Platform.OS === 'android'
 ? baseURL = 'https://planterest.onrender.com/api/v1/'
    : baseURL = 'https://planterest.onrender.com/api/v1/';
}
//SA BAHAY
//  ? baseURL = 'http://192.168.100.97:4000/api/v1/'
//     : baseURL = 'http://192.168.100.97:4000/api/v1/';

//CP KO
//   ? baseURL = 'http://192.168.70.178:4000/api/v1/'
//     : baseURL = 'http://192.168.70.178:4000/api/v1/';

export default baseURL;