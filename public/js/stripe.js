/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alerts';
const stripe = Stripe(
  'pk_test_51JZYHPC51616cy0TxIwPoQtGHbRxQMso2KB12bvC0XIi671n85ow462XqlDWfo85qleUqh3FwutrS5JKJ1lLjO5L00OblIjRyt'
);

// tourId comes from the Book buttons data attribute
export const bookTour = async (tourId) => {
  console.log(tourId, 'stripe.js');
  try {
    // 1) Get checkout session from API
    const session = await axios(
      `http://127.0.0.1:8000/api/v1/bookings/checkout-session/${tourId}`
    );
    console.log(session);

    // 2) Create checkout form + chanre credit card
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });
  } catch (err) {
    console.log(err);
    showAlert('error', err);
  }
};
