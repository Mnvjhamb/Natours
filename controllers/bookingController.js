const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Tour = require('./../models/tourModel');
const User = require('../models/userModel');
const factory = require('./handlerFactory');
const Booking = require('./../models/bookingModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  // 1) get the currently booked tour
  const tour = await Tour.findById(req.params.tourID);
  if (!tour) {
    return next(new AppError(`Tour Not Found`, 404));
  }
  // 2) Create the checkout session
  const session = await stripe.checkout.sessions.create({
    // Information about session
    payment_method_types: ['card'],
    mode: 'payment', // Specify the mode as 'payment'
    success_url: `${req.protocol}://${req.get('host')}/?tour=${
      req.params.tourID
    }&user=${req.user.id}&price=${tour.price}`,
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
    customer_email: `${req.user.email}`,
    client_reference_id: req.params.tourID,
    // Information about product
    line_items: [
      {
        price_data: {
          currency: 'inr',
          unit_amount: tour.price * 100, // Amount in cents
          product_data: {
            name: `${tour.name} Tour`,
            description: `${tour.summary}`,
            // images: [
            //   `${req.protocol}://${req.get('host')}/img/tours/${
            //     tour.imageCover
            //   }`,
            // ],
          },
        },
        quantity: 1,
      },
    ],
  });

  console.log(session.url);

  // 3) Create session as response
  res.status(200).json({
    status: 'success',
    session,
  });
});

exports.createBookingCheckout = catchAsync(async (req, res, next) => {
  const { tour, user, price } = req.query;
  if (!tour || !user || !price) return next();
  await Booking.create({ tour, user, price });

  res.redirect(`${req.originalUrl.split('?')[0]}my-tours?alert=booking`);
});

exports.webhookCheckout = (req, res, next) => {
  const signature = req.headers['stripe-signature'];
  let event = null;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return req.status(400).send(`Webhook error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    createBookingCheckout(event.data.object);
  }

  res.status(200).json({ received: true });
};

exports.createBooking = factory.createOne(Booking);
exports.getBookings = factory.getAll(Booking);
exports.getBooking = factory.getOne(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);
