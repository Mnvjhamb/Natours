import axios from 'axios';
import { showAlert } from './alerts';

const stripe = Stripe(
  'pk_test_51NmrkiSDInvmZrhWOgMQb7k9Fo6EcyRd6sGl2FJForKd1XNZ9QTsZ8WW4fb4ZDLULydY5nSFa2veX2Pp3WlCNABJ00EAs2MLew'
);
export const bookTour = async (tourID) => {
  try {
    // 1) Get the Checkout Session from the API
    console.log('h');
    const session = await axios({
      method: 'GET',
      url: `/api/v1/bookings/checkout-session/${tourID}`,
    });

    // 2) Create checkout form + charge the debit/card
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });
  } catch (err) {
    console.log(err);
  }
};
