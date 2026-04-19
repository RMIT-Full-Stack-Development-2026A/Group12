const express = require('express');
const cors = require('cors');
const paymentRoutes = require('./modules/payment/payment.routes');
const subscriptionRoutes = require('./modules/subscription/subscription.routes');

const app = express();

app.use(cors());
app.use(express.json());
app.use('/api/payment', paymentRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/auth', require('./modules/auth/auth.routes'));

module.exports = app;