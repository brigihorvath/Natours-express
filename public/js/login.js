/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alerts';

export const login = async (email, password) => {
  try {
    const res = await axios({
      method: 'POST',
      // url: 'http://127.0.0.1:8000/api/v1/users/login',
      // the URL works this way only when the API and the website is hosted on the same server.
      url: '/api/v1/users/login',
      data: {
        email,
        password,
      },
    });

    if (res.data.status === 'success') {
      showAlert('success', 'Logged in successfully!');
      window.setTimeout(() => {
        // in order to load another page
        location.assign('/');
      }, 1500);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};

export const logout = async () => {
  try {
    const res = await axios({
      method: 'GET',
      url: '/api/v1/users/logout',
    });
    if ((res.data.status = 'success')) location.assign('/');
    // this solution also may works, but maybe there are some problems,
    // because it loads the page from the browser cache and it will still sow the user as logged in????
    //if ((res.data.status = 'success')) location.reload();
  } catch (err) {
    // console.log(err.response);
    showAlert('error', 'Error logging out! Try again.');
  }
};
