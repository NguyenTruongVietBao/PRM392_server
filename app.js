const express = require('express');
const cors = require('cors');
const app = express();
const connectDb = require('./utils/db');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.use('/', require('./routes/index'));
app.use('/api/users', require('./routes/user'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/categories', require('./routes/category'));
app.use('/api/products', require('./routes/product'));
app.use('/api/cart', require('./routes/cart'));
app.use('/api/orders', require('./routes/order'));
app.use('/api/payments', require('./routes/payment'));
app.use('/api/chat', require('./routes/chat'));
connectDb();
app.listen(8080, () => {
  console.log(`Server is running on port 8080`);
});
