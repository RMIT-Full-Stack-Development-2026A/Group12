const express = require('express');
const cors = require('cors');

const subscriptionRoutes = require('./modules/subscription/subscription.routes');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/subscription', subscriptionRoutes);

module.exports = app;